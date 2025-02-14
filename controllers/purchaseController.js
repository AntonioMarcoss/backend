const TicketType = require('../models/TicketType');
const Purchase = require('../models/Purchase');
const TicketPurchase = require('../models/TicketPurchase');

exports.purchaseTicket = async (req, res) => {
    const { ticketTypeId, quantity } = req.body;

    if (!ticketTypeId || !quantity || quantity <= 0) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios e a quantidade deve ser maior que zero.' });
    }

    try {
        const ticketType = await TicketType.findById(ticketTypeId);
        if (!ticketType) {
            return res.status(404).json({ message: 'Tipo de ingresso não encontrado' });
        }

        if (quantity > ticketType.quantity) {
            return res.status(400).json({ message: 'Quantidade solicitada excede o estoque disponível' });
        }

        const purchase = new Purchase({
            userId: req.user.userId,
            quantity,
        });

        const ticketPurchase = new TicketPurchase({
            userId: req.user.userId,
            ticketTypeId,
            quantity,
        });

        await ticketPurchase.save();
        await purchase.save();

        ticketType.quantity -= quantity;
        await ticketType.save();

        res.status(201).json({ message: 'Compra realizada com sucesso!', purchase });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao realizar a compra' });
    }
};

exports.getPurchaseHistory = async (req, res) => {
    try {
        const purchases = await Purchase.find({ userId: req.user.userId }).populate('ticketTypeId');
        res.json(purchases);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar histórico de compras' });
    }
};

exports.getPurchaseDetail = async (req, res) => {
    try {
        const purchase = await Purchase.findById(req.params.id).populate('ticketTypeId');
        if (!purchase || purchase.userId.toString() !== req.user.userId) {
            return res.status(404).json({ message: 'Compra não encontrada' });
        }
        res.render('ticketDetail', { purchase });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar detalhes da compra' });
    }
};