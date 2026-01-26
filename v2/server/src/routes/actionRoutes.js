const express = require('express');
const router = express.Router();
const actionController = require('../controllers/actionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', actionController.createAction);
router.get('/', actionController.getActions);
router.put('/:id', actionController.updateAction);
router.delete('/:id', actionController.deleteAction);

module.exports = router;
