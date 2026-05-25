const jwt = require('jsonwebtoken');

// 1. Middleware para verificar se o utilizador está logado (Token válido)
const protect = (req, res, next) => {
    let token;

    // O token costuma ser enviado no Header como: Bearer <TOKEN>
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extrair o token do cabeçalho
            token = req.headers.authorization.split(' ')[1];

            // Verificar e descodificar o token usando a chave secreta do .env
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Guardar os dados do token (id e role) no objeto 'req' para usar nos controllers
            req.user = decoded;

            return next(); // Passa para o próximo middleware ou controller
        } catch (error) {
            return res.status(401).json({ message: 'Não autorizado, token inválido ou expirado.' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Não autorizado, nenhum token foi fornecido.' });
    }
};

// 2. Middleware para restringir o acesso por perfil (Roles)
const authorize = (...rolesPermitidos) => {
    return (req, res, next) => {
        // Garantir que o middleware 'protect' correu antes deste
        if (!req.user) {
            return res.status(500).json({ message: 'Erro interno de configuração de segurança.' });
        }

        // Verificar se o role do utilizador está na lista de perfis permitidos para esta rota
        if (!rolesPermitidos.includes(req.user.role)) {
            return res.status(403).json({ message: `Acesso proibido para o perfil de ${req.user.role}.` });
        }

        next();
    };
};

module.exports = { protect, authorize };