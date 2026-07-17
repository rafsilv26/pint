const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const User = require('../models/User');
const { Area, Consultant } = require('../models');
const PolicyRGPD = require('../models/PolicyRGPD');
const PolicyRGPDAcceptance = require('../models/PolicyRGPDAcceptance');
const { applyUserRoles, getUserRoles, normalizeRoles } = require('../services/userRoles.service');
const { emailRecuperarPassword, emailBoasVindas } = require('../services/email.service');
const { getPendingPolicies } = require('../services/rgpd.service');

// URL pública do frontend, usada nos links enviados por email
// (recuperação de password e página de login).
const frontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

// Guardamos apenas o hash do token na BD: se a BD for comprometida, os
// tokens em circulação nos emails continuam inutilizáveis.
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Todos os perfis (Admin, Consultor, TalentManager, ServiceLineLeader) têm de
// aceitar as políticas RGPD obrigatórias — não só os consultores.
const pendingPoliciesFor = async (userId) => {
    const pendentes = await getPendingPolicies(userId);
    return pendentes.map((p) => ({
        policyId: p.policyId,
        title: p.title,
        description: p.description,
        version: p.version,
        mandatory: p.mandatory !== false,
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
        // Token para o novo utilizador confirmar o endereço de email
        // (link incluído no email de boas-vindas; na BD fica só o hash).
        const confirmToken = crypto.randomBytes(32).toString('hex');

        const t = await sequelize.transaction();
        let newUser;
        let assignedRoles;
        try {
            newUser = await User.create({
                nome,
                email,
                password,
                emailConfirmationToken: hashToken(confirmToken)
            }, { transaction: t });
            assignedRoles = await applyUserRoles(newUser.id, normalizedRoles, { areaId, serviceLineId }, t);
            await t.commit();
        } catch (error) {
            await t.rollback();
            throw error;
        }

        // Email de boas-vindas em background — o registo não deve falhar
        // nem atrasar por causa do SMTP.
        // A password temporária (a que o admin definiu) vai no email para o
        // utilizador poder entrar no primeiro acesso.
        emailBoasVindas(newUser, `${frontendUrl()}/login`, `${frontendUrl()}/confirmar-email?token=${confirmToken}`, password)
            .catch((erro) => console.error('Erro ao enviar email de boas-vindas:', erro.message));

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
        res.status(500).json({ error: 'Erro ao registar o utilizador.' });
    }
};

// Auto-registo público de um CONSULTOR (guião req 1). O próprio escolhe a
// área; recebe um email de confirmação e só pode entrar depois de confirmar.
exports.signup = async (req, res) => {
    try {
        const { nome, email, password, areaId } = req.body;
        if (!nome || !email || !password || !areaId) {
            return res.status(400).json({ message: 'Nome, email, password e área são obrigatórios.' });
        }
        if (String(password).length < 8) {
            return res.status(400).json({ message: 'A password deve ter pelo menos 8 caracteres.' });
        }

        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'Este email já está registado.' });
        }

        const area = await Area.findOne({ where: { id: areaId, ativo: true, deletedAt: null } });
        if (!area) {
            return res.status(400).json({ message: 'A área selecionada não existe ou está inativa.' });
        }

        const confirmToken = crypto.randomBytes(32).toString('hex');
        const t = await sequelize.transaction();
        let newUser;
        try {
            newUser = await User.create({
                nome,
                email,
                password,
                emailConfirmationToken: hashToken(confirmToken)
            }, { transaction: t });
            // Perfil Consultor + área escolhida.
            await applyUserRoles(newUser.id, ['Consultor'], { areaId }, t);
            await t.commit();
        } catch (error) {
            await t.rollback();
            throw error;
        }

        emailBoasVindas(newUser, `${frontendUrl()}/login`, `${frontendUrl()}/confirmar-email?token=${confirmToken}`)
            .catch((erro) => console.error('Erro ao enviar email de boas-vindas:', erro.message));

        res.status(201).json({ message: 'Conta criada. Confirma o teu email para poderes entrar.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar a conta.' });
    }
};

// Reenvio de confirmação com resposta neutra para não permitir enumeração.
exports.resendConfirmation = async (req, res) => {
    const resposta = { message: 'Se a conta estiver pendente, será enviado um novo email de confirmação.' };
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        if (!email) return res.status(400).json({ message: 'O email é obrigatório.' });
        const user = await User.findOne({ where: { email } });
        if (!user || user.emailConfirmed === true || user.ativo === false) return res.json(resposta);

        const confirmToken = crypto.randomBytes(32).toString('hex');
        user.emailConfirmationToken = hashToken(confirmToken);
        user.updatedAt = new Date();
        await user.save();
        await emailBoasVindas(user, `${frontendUrl()}/login`, `${frontendUrl()}/confirmar-email?token=${confirmToken}`);
        return res.json(resposta);
    } catch (error) {
        return res.status(500).json({ message: 'Não foi possível reenviar o email de confirmação.' });
    }
};

// Lista pública das áreas — para o formulário de auto-registo escolher a área.
exports.listarAreasPublicas = async (_req, res) => {
    try {
        const areas = await Area.findAll({
            where: { ativo: true, deletedAt: null },
            attributes: ['id', 'nome'],
            order: [['nome', 'ASC']]
        });
        res.json(areas);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar áreas.' });
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

        // Bloqueia enquanto o email não estiver confirmado (guião req 1). Só
        // afeta quem tem confirmação pendente — contas legadas sem token passam.
        if (user.emailConfirmed === false && user.emailConfirmationToken) {
            return res.status(403).json({ message: 'Confirma o teu email antes de entrar. Verifica a tua caixa de correio.', emailConfirmacaoPendente: true });
        }

        // gerar token JWT e obter os perfis do utilizador
        const roles = await getUserRoles(user.id);
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        const agora = new Date();
        const primeiroLogin = !user.firstLoginDate;
        const ausenteHa15Dias = user.lastLogin &&
            (agora.getTime() - new Date(user.lastLogin).getTime()) >= 15 * 24 * 60 * 60 * 1000;
        const hora = agora.getHours();
        const greeting = primeiroLogin
            ? 'Bem-vindo!'
            : ausenteHa15Dias
                ? 'Seja bem-vindo novamente'
                : hora < 12 ? 'Bom dia,' : hora < 20 ? 'Boa tarde,' : 'Boa noite,';

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
                greeting,
                pendingPolicies: await pendingPoliciesFor(user.id)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao processar o login.' });
    }
};

exports.me = async (req, res) => {
    res.json({ user: await publicUser(req.user.data) });
};

exports.forgotPassword = async (req, res) => {
    // Resposta sempre neutra quando o email não existe: não revelamos se
    // uma conta está registada (evita enumeração de emails).
    const respostaNeutra = {
        message: 'Se o email estiver registado, vais receber uma mensagem com as instruções de recuperação.'
    };

    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'O email é obrigatório.' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user || user.ativo === false) {
            return res.json(respostaNeutra);
        }

        // Token aleatório enviado por email; na BD fica apenas o hash.
        const token = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = hashToken(token);
        user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
        await user.save();

        const link = `${frontendUrl()}/atualizar-password?token=${token}`;
        try {
            await emailRecuperarPassword(user, link);
        } catch (erroEmail) {
            // Sem email entregue o utilizador nunca receberia o link — nesse
            // caso é mais honesto devolver erro do que a resposta neutra.
            console.error('Erro ao enviar email de recuperação:', erroEmail.message);
            return res.status(500).json({ message: 'Não foi possível enviar o email de recuperação. Tenta novamente mais tarde.' });
        }

        res.json(respostaNeutra);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao processar o pedido de recuperação.' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, novaPassword } = req.body;

        if (!token || !novaPassword) {
            return res.status(400).json({ message: 'Token e nova password são obrigatórios.' });
        }
        if (novaPassword.length < 8) {
            return res.status(400).json({ message: 'A nova password deve ter pelo menos 8 caracteres.' });
        }

        const user = await User.findOne({
            where: {
                passwordResetToken: hashToken(token),
                passwordResetExpires: { [Op.gt]: new Date() }
            }
        });
        if (!user || user.ativo === false) {
            return res.status(400).json({ message: 'Link de recuperação inválido ou expirado. Pede uma nova recuperação.' });
        }

        user.password = novaPassword; // o hook beforeUpdate trata do hash
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        user.mustChangePassword = false;
        user.updatedAt = new Date();
        await user.save();

        res.json({ message: 'Password atualizada com sucesso. Já podes iniciar sessão.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar a password.' });
    }
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
                console.error('Constraint inválida em ACEITACAO_POLITICA_RGPD:', dbError);
                return res.status(500).json({ error: 'Erro ao aceitar política.' });
            }
            throw dbError;
        }

        const pendingPolicies = await pendingPoliciesFor(req.user.id);
        res.json({ message: 'Política aceite com sucesso.', pendingPolicies });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao aceitar política.' });
    }
};

// Confirmação do endereço de email através do link enviado no email de
// boas-vindas (rota pública: quem tem o token prova que recebeu o email).
exports.confirmEmail = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: 'Token é obrigatório.' });
        }

        const user = await User.findOne({ where: { emailConfirmationToken: hashToken(token) } });
        if (!user) {
            return res.status(400).json({ message: 'Link de confirmação inválido ou já utilizado.' });
        }

        user.emailConfirmed = true;
        user.emailConfirmationToken = null;
        await user.save();

        res.json({ message: 'Email confirmado com sucesso. Já podes iniciar sessão.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao confirmar o email.' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        // areaId (opcional): no primeiro acesso o consultor escolhe a sua área
        // aqui, ao definir a nova password (guião req 2).
        const { currentPassword, newPassword, areaId } = req.body;

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

        // Se for consultor e tiver escolhido área, guarda-a.
        if (areaId) {
            const consultant = await Consultant.findByPk(user.id);
            if (consultant) {
                consultant.areaId = areaId;
                await consultant.save();
            }
        }

        res.json({ message: 'Password alterada com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao alterar password.' });
    }
};
