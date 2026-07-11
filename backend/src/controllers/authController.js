const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sequelize = require('../config/database');
const User = require('../models/User');
const PolicyRGPD = require('../models/PolicyRGPD');
const PolicyRGPDAcceptance = require('../models/PolicyRGPDAcceptance');
const { applyUserRoles, getUserRoles, normalizeRoles } = require('../services/userRoles.service');
const { getPendingPolicies } = require('../services/rgpd.service');

// Todos os perfis (Admin, Consultor, TalentManager, ServiceLineLeader) têm de
// aceitar as políticas RGPD obrigatórias — não só os consultores.
const pendingPoliciesFor = async (userId) => {
    const pendentes = await getPendingPolicies(userId);
    return pendentes.map((p) => ({
        policyId: p.policyId,
        title: p.title,
        description: p.description,
        version: p.version,
    }));
};

const publicUser = async (user) => {
    const roles = await getUserRoles(user.id);
    return {
        id: user.id,
        nome: user.nome,
        email: user.email,
        fotoPerfil: user.fotoPerfil,
        idioma: user.idioma,
        mustChangePassword: user.mustChangePassword,
        pendingPolicies: await pendingPoliciesFor(user.id),
        role: roles[0] || null,
        roles
    };
};

exports.register = async (req, res) => {
    try {
        const {
            nome,
            email,
            password,
            roles = ['Consultor'],
            areaId,
            serviceLineId
        } = req.body;

        if (!nome || !email || !password) {
            return res.status(400).json({ message: 'Nome, email e password são obrigatórios.' });
        }

        const normalizedRoles = normalizeRoles(roles);
        if (normalizedRoles.length === 0) {
            return res.status(400).json({ message: 'Indica pelo menos um perfil válido.' });
        }

        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'Este email já está registado.' });
        }

        // Envolvemos a criação do utilizador + atribuição de perfis numa
        // transação: se a atribuição do perfil falhar (ex: ServiceLineLeader
        // sem serviceLineId), o utilizador criado é revertido também, em vez
        // de ficar "órfão" na BD sem perfil nenhum atribuído.
        const t = await sequelize.transaction();
        let newUser;
        let assignedRoles;
        try {
            newUser = await User.create({ nome, email, password }, { transaction: t });
            assignedRoles = await applyUserRoles(newUser.id, normalizedRoles, { areaId, serviceLineId }, t);
            await t.commit();
        } catch (error) {
            await t.rollback();
            throw error;
        }

        res.status(201).json({
            message: 'Utilizador registado com sucesso!',
            user: {
                id: newUser.id,
                nome: newUser.nome,
                email: newUser.email,
                roles: assignedRoles
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao registar o utilizador.', details: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // verificar se o email existe e se o utilizador está ativo
        const user = await User.findOne({ where: { email } });
        if (!user || user.ativo === false) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // comparar a password fornecida com a password armazenada (hash)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // gerar token JWT e obter os perfis do utilizador
        const roles = await getUserRoles(user.id);
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        // atualizar a data do último login e, se for o primeiro login, definir a data do primeiro login
        user.lastLogin = new Date();
        if (!user.firstLoginDate) {
            user.firstLoginDate = new Date();
        }
        await user.save();

        res.json({
            message: 'Login efetuado com sucesso!',
            token,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: roles[0] || null,
                roles,
                mustChangePassword: user.mustChangePassword,
                pendingPolicies: await pendingPoliciesFor(user.id)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao processar o login.', details: error.message });
    }
};

exports.me = async (req, res) => {
    res.json({ user: await publicUser(req.user.data) });
};

// Aceitação de uma política RGPD pelo utilizador autenticado (qualquer perfil).
// Devolve a lista atualizada de políticas ainda pendentes (para o modal do
// frontend saber se já pode desbloquear a app ou se ainda falta aceitar mais alguma).
exports.acceptPolicy = async (req, res) => {
    try {
        const { policyId } = req.body;
        if (!policyId) {
            return res.status(400).json({ message: 'policyId é obrigatório.' });
        }

        const policy = await PolicyRGPD.findByPk(policyId);
        if (!policy) {
            return res.status(404).json({ message: 'Política não encontrada.' });
        }

        try {
            await PolicyRGPDAcceptance.findOrCreate({
                where: { policyId, consultorId: req.user.id },
                defaults: {
                    acceptanceDate: new Date(),
                    originIP: req.ip,
                    userAgent: req.headers['user-agent'] || null
                }
            });
        } catch (dbError) {
            // Se a BD tiver uma foreign key que só aceita CONSULTORID de quem
            // está na tabela CONSULTOR (utilizadores sem perfil Consultor não
            // têm lá registo), isto falha para Admin/TM/SLL. Ver nota no PR:
            // é preciso alterar essa FK para apontar para UTILIZADOR(id).
            if (dbError.name === 'SequelizeForeignKeyConstraintError') {
                return res.status(500).json({
                    error: 'Erro ao aceitar política.',
                    details: 'A tabela ACEITACAO_POLITICA_RGPD tem uma foreign key restrita a consultores. É preciso alterar essa constraint para referenciar UTILIZADOR(id) em vez de CONSULTOR(consultorId).'
                });
            }
            throw dbError;
        }

        const pendingPolicies = await pendingPoliciesFor(req.user.id);
        res.json({ message: 'Política aceite com sucesso.', pendingPolicies });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao aceitar política.', details: error.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Password atual e nova password sao obrigatorias.' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'A nova password deve ter pelo menos 8 caracteres.' });
        }

        const user = await User.findByPk(req.user.id);
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Password atual invalida.' });
        }

        user.password = newPassword;
        user.mustChangePassword = false;
        user.updatedAt = new Date();
        await user.save();

        res.json({ message: 'Password alterada com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao alterar password.', details: error.message });
    }
};
