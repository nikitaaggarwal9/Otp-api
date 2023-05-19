const express = require("express");

const router = express.Router();

const otpApi = require("../../controllers/api/otp_api");

router.post("/generate", otpApi.generateOtp);
router.post("/login", otpApi.login);

module.exports = router;