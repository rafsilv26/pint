const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Tudo isto herda o /api/users do index.js
router.get('/', userController.getAllUsers);        // GET /api/users
router.put('/:id', userController.updateUser);      // PUT /api/users/:id
router.delete('/:id', userController.deleteUser);   // DELETE /api/users/:id

module.exports = router;