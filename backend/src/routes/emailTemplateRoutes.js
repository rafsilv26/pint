const express = require('express');
const router = express.Router();
const { authorize } = require('../middlewares/authMiddleware');
const emailTemplateController = require('../controllers/emailTemplateController');

router.get('/', authorize('Admin'), emailTemplateController.listarTemplates);
router.put('/:code', authorize('Admin'), emailTemplateController.guardarTemplate);
router.delete('/:code', authorize('Admin'), emailTemplateController.reporTemplate);
router.post('/:code/preview', authorize('Admin'), emailTemplateController.previewTemplate);
router.post('/:code/test', authorize('Admin'), emailTemplateController.enviarTeste);

module.exports = router;
