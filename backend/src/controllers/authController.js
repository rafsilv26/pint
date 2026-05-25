const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 1. REGISTO DE UTILIZADOR
exports.register = async (req, res) => {
    try {
        const { nome, email, password, role } = req.body;

        // Verificar se o email já existe
        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'Este email já está registado.' });
        }

        // Criar o utilizador (o hook do modelo vai encriptar a password)
        const newUser = await User.create({ nome, email, password, role });

        res.status(201).json({ 
            message: 'Utilizador registado com sucesso!', 
            user: { id: newUser.id, nome: newUser.nome, email: newUser.email, role: newUser.role } 
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao registar o utilizador.', details: error.message });
    }
};

// 2. LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Procurar o utilizador por email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas (Email ou Password incorretos).' });
        }

        // Comparar a password enviada com o hash guardado na BD
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas (Email ou Password incorretos).' });
        }

        // Gerar o Token JWT com o ID e o Role do utilizador
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        res.json({
            message: 'Login efetuado com sucesso!',
            token,
            user: {
                id: user.id,
                nome: user.nome,
                role: user.role,
                mustChangePassword: user.mustChangePassword
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao processar o login.', details: error.message });
    }
};