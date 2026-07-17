const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authorize } = require('../middlewares/authMiddleware');

router.get('/', authorize('Admin', 'TalentManager'), userController.getAllUsers);
router.get('/:id', authorize('Admin', 'TalentManager'), userController.getUserById);
router.put('/:id', authorize('Admin'), userController.updateUser);
router.delete('/:id', authorize('Admin'), userController.deleteUser);

module.exports = router;
