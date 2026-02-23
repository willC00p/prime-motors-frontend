import express from 'express';
import cors from 'cors';

const app = express();
const port = 4001;  // Different port

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'GET test successful' });
});

app.post('/api/test', (req, res) => {
  console.log('Received POST data:', req.body);
  res.json({ 
    message: 'POST test successful',
    received: req.body
  });
});

app.listen(port, () => {
  console.log(`Test server running on http://localhost:${port}`);
});
