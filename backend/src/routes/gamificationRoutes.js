const express = require('express');
const router = express.Router();

const gamificationController = require('../controllers/gamificationController');

router.get('/', gamificationController.getGamification);

module.exports = router;