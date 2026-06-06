const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalogController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/:resource', catalogController.listResources);
router.get('/:resource/:id', catalogController.getResource);
router.post('/:resource', authorize('Admin'), catalogController.createResource);
router.put('/:resource/:id', authorize('Admin'), catalogController.updateResource);
router.delete('/:resource/:id', authorize('Admin'), catalogController.deleteResource);

module.exports = router;
