const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.register = async (req, res) => {
    const { name, email, password, isAdmin } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "Usuário já existe" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser  = new User({ name, email, password: hashedPassword, isAdmin });

        await newUser.save();

        res.json({ message: "Usuário registrado com sucesso!" });
    } catch (error) {
        res.status(500).json({ message: "Erro ao registrar usuário" });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Usuário não encontrado" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Senha inválida" });

        const token = jwt.sign(
            { userId: user._id, isAdmin: user.isAdmin },
            process.env.JWT_SECRET,
            { expiresIn: '10h' }
        );

        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: "Erro ao fazer login" });
    }
};

