import express from 'express';

const app = express();
const PORT = 5000;

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

// Start Server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});