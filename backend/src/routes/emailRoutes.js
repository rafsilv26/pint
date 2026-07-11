const express = require('express');
const emailController = require('../controllers/emailController');
const { authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/status', authorize('Admin'), emailController.status);
router.post('/test', authorize('Admin'), emailController.sendTest);

module.exports = router;
