const express = require('express');
const router = express.Router();
const { resetAllTables } = require('../repository/testRepository');

router.post('/reset', async (req, res) => {
  try {
    await resetAllTables();
    console.log('[test] all tables truncated');
    res.json({ status: 'ok', message: 'all tables reset' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;