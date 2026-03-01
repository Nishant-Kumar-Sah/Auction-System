const userService = require('../services/userService');

const createUser = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ status: 'error', message: 'email is required' });

    const user = await userService.createUser(email);
    res.status(201).json({ status: 'success', user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: 'error', message: e.message });
  }
};

module.exports = { createUser };