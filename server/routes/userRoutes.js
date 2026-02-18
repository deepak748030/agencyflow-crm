const express = require('express');
const { auth, roleGuard } = require('../middleware/auth');
const userController = require('../controllers/userController');
const router = express.Router();

router.get('/', auth, roleGuard(['admin', 'manager']), userController.listUsers);
router.post('/', auth, roleGuard(['admin']), userController.createUser);
router.get('/:id', auth, userController.getUser);
router.put('/:id', auth, roleGuard(['admin']), userController.updateUser);
router.delete('/:id', auth, roleGuard(['admin']), userController.deactivateUser);

module.exports = router;
