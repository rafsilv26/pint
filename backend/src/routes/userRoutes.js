const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authorize } = require('../middlewares/authMiddleware');

// Tudo isto herda o /api/users do index.js
router.get('/', authorize('Admin', 'TalentManager'), userController.getAllUsers);        // GET /api/users
router.get('/:id', authorize('Admin', 'TalentManager'), userController.getUserById);     // GET /api/users/:id
router.put('/:id', authorize('Admin'), userController.updateUser);      // PUT /api/users/:id
router.delete('/:id', authorize('Admin'), userController.deleteUser);   // DELETE /api/users/:id

module.exports = router;
