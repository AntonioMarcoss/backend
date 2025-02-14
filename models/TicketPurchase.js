const mongoose = require('mongoose');

const TicketPurchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ticketTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'TicketType', required: true },
  quantity: { type: Number, required: true },
  purchaseDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TicketPurchase', TicketPurchaseSchema);