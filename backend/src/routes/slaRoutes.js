const express = require('express');
const router = express.Router();
const { authorize } = require('../middlewares/authMiddleware');
const slaController = require('../controllers/slaController');

// Gestão de SLAs por equipa (protect aplicado no index.js; só Admin).
router.get('/configs', authorize('Admin'), slaController.listarConfigs);
// UI simplificada: define o prazo de uma equipa (talent/serviceline).
router.put('/team/:team', authorize('Admin'), slaController.definirEquipa);
router.post('/configs', authorize('Admin'), slaController.criarConfig);
router.put('/configs/:id', authorize('Admin'), slaController.atualizarConfig);
router.delete('/configs/:id', authorize('Admin'), slaController.apagarConfig);

module.exports = router;
