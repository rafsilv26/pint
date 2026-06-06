const User = require('../models/User');
const { getUserRoles, applyUserRoles } = require('../services/userRoles.service');

// Função auxiliar para serializar o utilizador com os seus perfis
const serializeUser = async (user) => ({
    id: user.id,
    nome: user.nome,
    email: user.email,
    fotoPerfil: user.fotoPerfil,
    idioma: user.idioma,
    ativo: user.ativo,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt,
    roles: await getUserRoles(user.id)
});

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

        await user.save();

        if (roles !== undefined) {
            await applyUserRoles(user.id, roles, { areaId, serviceLineId });
        }

        res.json({
            message: 'Utilizador atualizado com sucesso!',
            user: await serializeUser(user)
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar utilizador.', details: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }

        user.ativo = false;
        user.deletedAt = new Date();
        await user.save();

        res.json({ message: 'Utilizador desativado com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao desativar utilizador.', details: error.message });
    }
};
