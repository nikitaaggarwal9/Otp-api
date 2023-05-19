const express = require('express');

const router = express.Router();

router.use('/otp', require('./otp'));

module.exports = router;