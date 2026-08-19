const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);

app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

module.exports = app;
