const User = require('../models/User');

// 1. LISTAR TODOS OS UTILIZADORES
exports.getAllUsers = async (req, res) => {
    try {
        // Busca todos os utilizadores, mas esconde a password por segurança (attributes)
        const users = await User.findAll({
            attributes: { exclude: ['password'] }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar utilizadores.', details: error.message });
    }
};

// 2. ATUALIZAR UM UTILIZADOR (Mudar Role ou dados)
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, role, mustChangePassword } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }

        // Atualiza os campos se eles forem enviados no body
        user.nome = nome || user.nome;
        user.email = email || user.email;
        user.role = role || user.role;
        if (mustChangePassword !== undefined) user.mustChangePassword = mustChangePassword;

        await user.save();

        res.json({
            message: 'Utilizador atualizado com sucesso!',
            user: { id: user.id, nome: user.nome, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar utilizadores.', details: error.message });
    }
};

// 3. APAGAR UM UTILIZADOR
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }

        await user.destroy();
        res.json({ message: 'Utilizador removido do sistema com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao apagar utilizador.', details: error.message });
    }
};