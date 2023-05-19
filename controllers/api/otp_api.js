const Otp = require("../../models/OTP");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

module.exports.generateOtp = async function (
	req,
	res
) {
	try {
		// Validate the request body
		console.log(req.body, "line 5");
		if (!req.body.email) {
			res.status(400).send(
				"Email is required"
			);
			return;
		}

		// Check if the user has already generated an OTP in the last minute
		const otpArray = await Otp.find({
			email: req.body.email,
		});

		if (otpArray.length > 0) {
			const lastOtpObj =
				otpArray[otpArray.length - 1];
			console.log(otpArray[0], lastOtpObj);
			console.log(
				lastOtpObj.createdAt.getTime(),
				Date.now(),
				Date.now() -
					lastOtpObj.createdAt.getTime()
			);

			if (
				lastOtpObj &&
				Date.now() -
					lastOtpObj.createdAt <
					60000
			) {
				res.status(400).send(
					"You can only generate an OTP once per minute"
				);
				return;
			}
		}
		// otp && Date.now() < otp.createdAt + 60000
		// Generate a new OTP
		const otpCode =
			Math.floor(Math.random() * 90000) +
			10000;

		console.log(otpCode);

		// Save the OTP to the database
		const otpModel = new Otp({
			email: req.body.email,
			otp: otpCode,
			createdAt: Date.now(),
			expiresAt: Date.now() + 300000, // 5 minutes
		});

		otpModel.save((err) => {
			if (err) {
				res.status(500).send(err);
				return;
			}

			// Send the OTP to the user
			const transporter =
				nodemailer.createTransport({
					service: "gmail",
					host: "smtp.gmail.com",
					port: 465,
					secure: true,
					auth: {
						user: "test12349830@gmail.com",
						pass: "bjakjlivnsszhdxm",
					},
				});

			transporter.sendMail({
				from: "hpnikita10@gmail.com",
				to: req.body.email,
				subject: "Your OTP",
				text: `Your OTP is ${otpCode}`,
			});

			console.log(typeof otpCode);
			res.status(200).send("OTP sent");
		});
	} catch (error) {
		console.log("Error", error);
		return res.json(500, {
			message: "Internal Server Error",
		});
	}
};

module.exports.login = async function (req, res) {
	try {
		// Validate the request body
		if (!req.body.email || !req.body.otp) {
			res.status(400).send(
				"Email and OTP are required"
			);
			return;
		}

		// Check if the OTP is valid
		const otp = await Otp.findOne({
			email: req.body.email,
			otp: req.body.otp,
		});

		if (!otp || otp.expiresAt < Date.now()) {
			res.status(401).send("Invalid OTP");
			return;
		}

		// Check if the user has exceeded the number of allowed failed attempts
		const failedAttempts = await Otp.count({
			email: req.body.email,
			expiresAt: {$gt: Date.now()},
		});

		if (failedAttempts >= 5) {
			res.status(403).send(
				"5 Failed Attempts! Your account has been blocked for 1 hour"
			);
			return;
		}

		// Generate a new JWT token
		const jwtToken = jwt.sign(
			{email: req.body.email},
			"secret",
			{expiresIn: "1h"}
		);

    // Ensures doesn't get reused
    Otp.deleteOne({email: req.body.email, otp: req.body.otp});

		// Send the JWT token back to the user
		res.status(200).send({
			jwtToken,
		});
	} catch (error) {
		console.log("Error", error);
		return res.json(500, {
			message: "Internal Server Error",
		});
	}
};
