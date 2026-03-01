const pool = require('../clients/postgres');
const { User } = require('../models');

async function createUser(email) {
  const result = await pool.query(
    'INSERT INTO users (email) VALUES ($1) RETURNING *',
    [email]
  );
  return new User(result.rows[0]);
}

module.exports = { createUser };