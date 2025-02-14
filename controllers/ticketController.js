const TicketType = require('../models/TicketType');

exports.createTicketType = async (req, res) => {
  const { name, price, quantity } = req.body;
  
  if (!name || price == null || quantity == null) {
    return res.status(400).send({ error: 'Todos os campos são obrigatórios' });
  }

  try {
    const ticketType = new TicketType({ name, price, quantity });
    await ticketType.save();
    res.status(201).send(ticketType);
  } catch (error) {
    res.status(400).send({ error: 'Falha ao criar o ingresso' });
  }
};

exports.getTicketTypes = async (req, res) => {
  try {
    const ticketTypes = await TicketType.find();
    res.send(ticketTypes);
  } catch (error) {
    res.status(400).send({ error: 'Falha ao buscar o ingresso' });
  }
};

exports.getTicketDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const ticket = await TicketType.findById(id);
    if (!ticket) {
      return res.status(404).send({ error: 'Ingresso não encontrado!' });
    }
    res.send(ticket);
  } catch (error) {
    res.status(400).send({ error: 'Falha ao obter detalhes do ingresso' });
  }
};

exports.updateTicketType = async (req, res) => {
  const { id } = req.params;
  const { name, price, quantity } = req.body;

  if (!name && price == null && quantity == null) {
    return res.status(400).send({ error: 'Pelo menos um campo deve ser atualizado' });
  }

  try {
    const ticketType = await TicketType.findByIdAndUpdate(id, req.body, { new: true });
    res.send(ticketType);
  } catch (error) {
    res.status(400).send({ error: 'Falha ao atualizar o ingresso' });
  }
};

exports.deleteTicketType = async (req, res) => {
  const { id } = req.params;
  try {
    await TicketType.findByIdAndDelete(id);
    res.send({ message: 'Ingresso excluido com sucesso' });
  } catch (error) {
    res.status(400).send({ error: 'Falha ao deletar ingresso' });
  }
};
