const express = require('express');
const protect = require('../middleware/authMiddleware');
const { sendMessage } = require('../controllers/messageControllers');

const router = express.Router();

router.post('/', protect, sendMessage);

module.exports = router;