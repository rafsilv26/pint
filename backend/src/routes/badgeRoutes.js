const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalogController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const setResource = (req, _res, next) => {
  req.params.resource = 'badges';
  next();
};

router.get('/', setResource, catalogController.listResources);
router.get('/:id', setResource, catalogController.getResource);
router.post('/', authorize('Admin'), setResource, catalogController.createResource);
router.put('/:id', authorize('Admin'), setResource, catalogController.updateResource);
router.delete('/:id', authorize('Admin'), setResource, catalogController.deleteResource);

module.exports = router;
