import AWS from "aws-sdk";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

AWS.config.update({
	region: "ap-south-1",
	accessKeyId: process.env.MY_AWS_ACCESS_KEY,
	secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
});

const sns = new AWS.SNS();

export const sendOTP = async (phoneNumber: string, otp: string) => {
	try {
		const params = {
			Message: `Your OTP is: ${otp}`,
			PhoneNumber: phoneNumber,
			MessageAttributes: {
				"AWS.SNS.SMS.SMSType": {
					DataType: "String",
					StringValue: "Transactional", // Ensures OTP delivery
				},
			},
		};

		console.log("Sending OTP:", otp);
		const response = await sns.publish(params).promise();

		return response;
	} catch (error) {
		console.error("Error sending OTP via SNS:", error);
		return false;
	}
};

export const generateOTP = (length = 6) => {
	return crypto.randomInt(10 ** (length - 1), 10 ** length).toString();
};
