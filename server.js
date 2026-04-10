import express from 'express';
import db from './models/index.js';  // initilizes Sequelize and imports all models with associations

const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
  res.send('Hello World! 🚀 My Express Server is Running');
});

// Another simple route
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to the API',
    status: 'success',
    time: new Date().toISOString()
  });
});

// POST example
app.post('/api/hello', (req, res) => {
  const { name } = req.body;
  
  res.json({
    message: `Hello ${name || 'there'}!`,
    received: req.body
  });
});

// Start server only after the database schema is ready.
const startServer = async () => {
  try {
    await db.sequelize.sync();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();