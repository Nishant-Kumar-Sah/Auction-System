const { createUser: insertUser } = require('../repository/userRepository');

async function createUser(email) {
  return await insertUser(email);
}

module.exports = { createUser };