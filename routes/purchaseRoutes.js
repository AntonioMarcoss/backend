const express = require('express');
const purchaseController = require('../controllers/purchaseController');
const { authenticate } = require('../middleware/authMiddleware'); 
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();


router.post('/', authenticate, purchaseController.purchaseTicket);

router.get('/history', authenticate, purchaseController.getPurchaseHistory);

router.get('/detail/:id', authenticate, purchaseController.getPurchaseDetail);

router.post('/', verifyToken, purchaseController.purchaseTicket);
router.get('/history', verifyToken, purchaseController.getPurchaseHistory);
router.get('/:id', verifyToken, purchaseController.getPurchaseDetail);

module.exports = router;
