const express = require('express');
const session = require('express-session');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

let users = [
    { id: 1, name: 'Admin User', email: 'admin@example.com', password: 'admin123', role: 'Admin' },
    { id: 2, name: 'Regular User', email: 'user@example.com', password: 'user123', role: 'User' }
];

const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
};

// Middleware для проверки роли
const authorizeRole = (role) => (req, res, next) => {
    if (req.session.user.role !== role) {
        return res.status(403).json({ message: 'Access denied' });
    }
    next();
};

// Вход в систему
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        return res.status(403).json({ message: 'Invalid credentials' });
    }

    req.session.user = user;
    res.status(200).json({ message: 'Login successful', user });
});

// Выход из системы
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.status(200).json({ message: 'Logged out' });
});

// 1. GET /users - только для Admin
app.get('/users', requireAuth, authorizeRole('Admin'), (req, res) => {
    res.status(200).json(users);
});

// 2. GET /users/:id - доступно для всех авторизованных
app.get('/users/:id', requireAuth, (req, res) => {
    const userId = parseInt(req.params.id);
    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
});

// 3. POST /users - только для Admin
app.post('/users', requireAuth, authorizeRole('Admin'), (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const newUser = {
        id: users.length + 1,
        name,
        email,
        password,
        role
    };

    users.push(newUser);
    res.status(201).json(newUser);
});

// 4. PATCH /users/:id - доступно для всех авторизованных
app.patch('/users/:id', requireAuth, (req, res) => {
    const userId = parseInt(req.params.id);
    const { name, email } = req.body;

    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email;

    res.status(200).json(user);
});

// 5. DELETE /users/:id - только для Admin
app.delete('/users/:id', requireAuth, authorizeRole('Admin'), (req, res) => {
    const userId = parseInt(req.params.id);

    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
    }

    users.splice(userIndex, 1);
    res.status(204).send();
});

// Слухаємо на порту
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});