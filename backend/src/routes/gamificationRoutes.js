const express = require('express');
const router = express.Router();

// Importa o controlador que adaptámos
const gamificationController = require('../controllers/gamificationController');

// A rota fica apenas '/', porque o '/gamification' e o middleware 'protect' 
// já foram definidos no teu index.js!
router.get('/', gamificationController.getGamification);

// Se no futuro quiseres adicionar a rota dos pontos específicos que tínhamos falado:
// router.get('/points/me', gamificationController.getUserTotalPoints);

module.exports = router;