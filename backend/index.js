require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/verix-ai';

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/detect', require('./routes/detect'));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'VeriX AI Authentication Backend is running' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
