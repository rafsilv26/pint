const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');

router.post('/xlsx', exportController.exportarXlsx);

module.exports = router;
