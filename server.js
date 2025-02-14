const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const mustacheExpress = require('mustache-express');
const TicketPurchase = require('./models/TicketPurchase');
const TicketType = require('./models/TicketType');
const authMiddleware = require('./middleware/authMiddleware');
const adminMiddleware = require('./middleware/adminMiddleware');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
// Conectar ao MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuração de sessão
app.use(session({
    secret: 'seuSegredoSeguro',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Configuração do Mustache
app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', path.join(__dirname, 'views'));

// Rota para exibir a página de login
app.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao fazer logout' });
        }
        res.redirect('/login');
    });
});

// Rota para exibir a página de registro
app.get('/register', (req, res) => {
    res.render('register', { title: 'Registro' });
});

// Rotas de API
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/purchases', purchaseRoutes);

// Página Inicial
app.get('/', (req, res) => {
    res.render('index', { title: 'Página Inicial', user: req.session.user || null });
});

// Página de dashboard com ingressos disponíveis e histórico de compras
app.get('/dashboard', authMiddleware.authenticate, async (req, res) => {
    try {
        const tickets = await TicketType.find();
        const purchases = await TicketPurchase.find({ userId: req.user.id }).populate('ticketTypeId');

        res.render('dashboard', { 
            user: req.user,  // Passa os dados do usuário para o Mustache
            tickets, 
            purchases 
        });
    } catch (error) {
        console.error("Erro ao carregar o dashboard:", error);
        res.status(500).send('Erro ao carregar os ingressos.');
    }
});

// 🔥 ROTA API PARA HISTÓRICO DE COMPRAS 🔥
app.get('/api/purchases/history', authMiddleware.authenticate, async (req, res) => {
    try {
        const purchases = await TicketPurchase.find({ userId: req.user._id }).populate('ticketTypeId');
        res.json(purchases);
    } catch (error) {
        console.error("Erro ao buscar histórico de compras:", error);
        res.status(500).json({ message: 'Erro ao carregar histórico de compras' });
    }
});

app.get('/admin-dashboard', authMiddleware.authenticate, authMiddleware.isAdmin, async (req, res) => {
    try {
        // Recupera todos os ingressos existentes
        const tickets = await TicketType.find();

        // Renderiza a página de administração com os ingressos
        res.render('admin-dashboard', { 
            user: req.session.user, 
            tickets: tickets // Passa os ingressos para o template
        });
    } catch (error) {
        console.error("Erro ao carregar os ingressos:", error);
        res.status(500).send('Erro ao carregar os ingressos.');
    }
});

// Visualizar ingresso específico
app.get('/ticket-detail/:id', authMiddleware.authenticate, async (req, res) => {
    try {
        const ticket = await TicketPurchase.findOne({ _id: req.params.id, userId: req.session.user.id }).populate('ticketTypeId');
        if (!ticket) return res.status(403).json({ error: 'Acesso negado' });
        res.render('ticket-detail', { ticket });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao carregar o ingresso' });
    }
});

// Criar ingresso (somente administradores)
app.post('/tickets/create', authMiddleware.authenticate, authMiddleware.isAdmin, async (req, res) => {
    try {
        const { name, price, quantity } = req.body;

        // Cria um novo ingresso
        const newTicket = new TicketType({
            name,
            price,
            quantity
        });

        // Salva o novo ingresso no banco de dados
        await newTicket.save();

        // Redireciona para a página do painel admin
        res.redirect('/admin-dashboard');
    } catch (error) {
        console.error("Erro ao criar ingresso:", error);
        res.status(500).send('Erro ao criar ingresso.');
    }
});

// Editar ingresso (somente administradores)
app.post('/tickets/edit/:id', authMiddleware.authenticate, authMiddleware.isAdmin, async (req, res) => {
    try {
        const { name, price, quantity } = req.body;
        const ticketId = req.params.id;

        // Encontra o ingresso pelo ID e atualiza os dados
        await TicketType.findByIdAndUpdate(ticketId, { name, price, quantity });

        // Redireciona para o painel admin
        res.redirect('/admin-dashboard');
    } catch (error) {
        console.error("Erro ao editar ingresso:", error);
        res.status(500).send('Erro ao editar ingresso.');
    }
});

app.post('/tickets/delete/:id', authMiddleware.authenticate, authMiddleware.isAdmin, async (req, res) => {
    try {
        const ticketId = req.params.id;
        await TicketType.findByIdAndDelete(ticketId);
        res.redirect('/admin-dashboard'); // Redireciona para o painel após exclusão
    } catch (error) {
        console.error("Erro ao excluir ingresso:", error);
        res.status(500).send("Erro ao excluir ingresso.");
    }
});


// Comprar ingresso (somente usuários autenticados)
app.post('/api/purchase', authMiddleware.authenticate, async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const { ticketTypeId, quantity } = req.body;
    if (!ticketTypeId || !quantity) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }
    try {
        const ticketType = await TicketType.findById(ticketTypeId);
        if (!ticketType) return res.status(404).json({ message: 'Ingresso não encontrado' });

        if (quantity > ticketType.quantity) {
            return res.status(400).json({ message: 'Quantidade indisponível' });
        }

        ticketType.quantity -= quantity;
        await ticketType.save();

        const purchase = new TicketPurchase({
            userId: req.session.user.id,
            ticketTypeId,
            quantity,
        });
        await purchase.save();

        res.redirect('/dashboard'); // 🔥 Alterado para garantir atualização
    } catch (error) {
        res.status(500).json({ message: 'Erro ao processar a compra' });
    }
});

// Inicializa o servidor
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
