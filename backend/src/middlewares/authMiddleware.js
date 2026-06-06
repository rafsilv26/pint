const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getUserRoles } = require('../services/userRoles.service');

const loadAuthenticatedUser = async (token) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
    });

    if (!user || user.ativo === false) {
        throw new Error('Utilizador inválido ou inativo.');
    }

    const roles = await getUserRoles(user.id);
    return {
        id: user.id,
        roles,
        primaryRole: roles[0] || null,
        data: user
    };
};

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Não autorizado, nenhum token foi fornecido.' });
    }

    try {
        const token = authHeader.split(' ')[1];
        req.user = await loadAuthenticatedUser(token);
        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Não autorizado, token inválido ou expirado.' });
    }
};

const optionalProtect = async (req, _res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    try {
        const token = authHeader.split(' ')[1];
        req.user = await loadAuthenticatedUser(token);
    } catch (error) {
        req.user = null;
    }

    return next();
};

const authorize = (...rolesPermitidos) => {
    return (req, res, next) => {
        // Garantir que o middleware 'protect' correu antes deste
        if (!req.user) {
            return res.status(500).json({ message: 'Erro interno de configuração de segurança.' });
        }

        const hasRole = req.user.roles.some((role) => rolesPermitidos.includes(role));
        if (!hasRole) {
            return res.status(403).json({
                message: 'Acesso proibido para o perfil atual.',
                roles: req.user.roles,
                rolesPermitidos
            });
        }

        return next();
    };
};

module.exports = { protect, optionalProtect, authorize };
