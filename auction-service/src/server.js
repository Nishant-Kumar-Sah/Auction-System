const express = require('express');
const pool = require('./clients/postgres');
const config = require('./config/server.config');
const routes = require('./routes');

const app = express();
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'not connected' });
  }
});

app.use('/api', routes);

app.listen(config.PORT, () => {
  console.log(`App running at PORT ${config.PORT}`);
});