const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');

// Exportação genérica para Excel real. Protegida a montante em routes/index.js.
router.post('/xlsx', exportController.exportarXlsx);

module.exports = router;
