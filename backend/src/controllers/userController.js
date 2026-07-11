const sequelize = require('../config/database');
const User = require('../models/User');
const { ServiceLineLeader, Consultant } = require('../models');
const { getUserRoles, applyUserRoles } = require('../services/userRoles.service');

// Função auxiliar para serializar o utilizador com os seus perfis
// Inclui serviceLineId/areaId (se aplicável) para que o formulário de edição
// consiga pré-preencher estes campos corretamente.
const serializeUser = async (user) => {
    const [roles, ssl, consultor] = await Promise.all([
        getUserRoles(user.id),
        ServiceLineLeader.findByPk(user.id),
        Consultant.findByPk(user.id)
    ]);

    return {
        id: user.id,
        nome: user.nome,
        email: user.email,
        fotoPerfil: user.fotoPerfil,
        idioma: user.idioma,
        ativo: user.ativo,
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt,
        roles,
        serviceLineId: ssl?.serviceLineId ?? null,
        areaId: consultor?.areaId ?? null
    };
};

// Controladores para gestão de utilizadores
exports.getAllUsers = async (_req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            order: [['nome', 'ASC']]
        });

        res.json(await Promise.all(users.map(serializeUser)));
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar utilizadores.', details: error.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }

        res.json(await serializeUser(user));
    } catch (error) {
        res.status(500).json({ error: 'Erro ao obter utilizador.', details: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nome,
            email,
            fotoPerfil,
            idioma,
            ativo,
            mustChangePassword,
            roles,
            areaId,
            serviceLineId
        } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }

        if (nome !== undefined) user.nome = nome;
        if (email !== undefined) user.email = email;
        if (fotoPerfil !== undefined) user.fotoPerfil = fotoPerfil;
        if (idioma !== undefined) user.idioma = idioma;
        if (ativo !== undefined) user.ativo = ativo;
        if (mustChangePassword !== undefined) user.mustChangePassword = mustChangePassword;
        user.updatedAt = new Date();

        // Transação: se a atualização dos dados base ou a atribuição de
        // perfis falhar (ex: ServiceLineLeader sem serviceLineId), nada fica
        // gravado — evita utilizadores com dados a meio ou sem perfil.
        const t = await sequelize.transaction();
        try {
            await user.save({ transaction: t });

            if (roles !== undefined) {
                await applyUserRoles(user.id, roles, { areaId, serviceLineId }, t);
            }

            await t.commit();
        } catch (error) {
            await t.rollback();
            throw error;
        }

        res.json({
            message: 'Utilizador atualizado com sucesso!',
            user: await serializeUser(user)
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar utilizador.', details: error.message });
    }
};

// CORRIGIDO: Agora faz Hard Delete em vez de Soft Delete
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }

        // Destrói o registo DEFINITIVAMENTE da base de dados (Hard Delete)
        await user.destroy({ force: true });

        res.json({ message: 'Utilizador removido definitivamente com sucesso.' });
    } catch (error) {
        console.error("Erro ao eliminar utilizador:", error);
        res.status(500).json({ error: 'Erro ao remover utilizador.', details: error.message });
    }
};