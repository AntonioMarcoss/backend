const express = require('express');
const ticketController = require('../controllers/ticketController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');
const purchaseController = require('../controllers/purchaseController');
const TicketType = require('../models/TicketType');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.get('/purchase-history', purchaseController.getPurchaseHistory);
router.get('/ticket-detail/:id', purchaseController.getPurchaseDetail);

router.post('/', verifyToken, purchaseController.purchaseTicket);
router.get('/history', verifyToken, purchaseController.getPurchaseHistory);
router.get('/:id', verifyToken, purchaseController.getPurchaseDetail);

router.post('/', authenticate, isAdmin, ticketController.createTicketType);
router.get('/', ticketController.getTicketTypes);
router.get("/:id", ticketController.getTicketDetail);
router.put('/:id', authenticate, isAdmin, ticketController.updateTicketType);
router.delete('/:id', authenticate, isAdmin, ticketController.deleteTicketType);

router.get("/tickets", async (req, res) => {
    try {
        const tickets = await TicketType.find();
        res.render("tickets", { tickets });
    } catch (error) {
        res.status(500).send("Erro ao carregar ingressos");
    }
});

module.exports = router;