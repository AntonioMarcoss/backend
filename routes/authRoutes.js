const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', async (req, res) => {
    const { name, email, password, isAdmin } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: isAdmin ? 'admin' : 'user',
        });

        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '10h' });

        res.json({ 
            token,
            user: {
                id: user._id,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Usuário não encontrado' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Senha incorreta' });
        }

        req.session.user = {
            id: user._id,
            name: user.name,
            role: user.role
        };

        res.json({ 
            message: 'Login bem-sucedido!',
            user: req.session.user
        });

    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor', error });
    }
});


router.get('/me', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
    }
    res.json(req.session.user);
});


module.exports = router;

