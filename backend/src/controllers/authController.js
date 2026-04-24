const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Lógica: procurar user -> comparar password (bcrypt) -> gerar token (JWT)
        // Se tudo ok, envia o JSON (a "View")
        res.json({ message: "Login realizado com sucesso", token: "xyz..." });
    } catch (error) {
        res.status(500).json({ error: "Erro no servidor" });
    }
};