import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { AWS_ACCESS_KEY, AWS_SECRET_ACCESS_KEY } from "../connection/constants";

export const s3 = new S3Client({
	region: process.env.MY_AWS_REGION,
	credentials: {
		accessKeyId: AWS_ACCESS_KEY,
		secretAccessKey: AWS_SECRET_ACCESS_KEY,
	},
});

export const uploadToS3 = async (buffer: any) => {
	const key = `covers/${uuidv4()}.png`;
	const uploadParams: any = {
		Bucket: process.env.MY_AWS_S3_BUCKET,
		Key: key,
		Body: buffer,
		ContentType: "image/png",
	};

	await s3.send(new PutObjectCommand(uploadParams));
	return key; // Return only the key, not the full URL
};

export const generatePreSignURL = async (key: string) => {
	try {
		const command = new GetObjectCommand({
			Bucket: process.env.MY_AWS_S3_BUCKET,
			Key: extractS3Key(key),
		});
		if (key) {
			const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1-hour expiry
			console.log("url: ", url);
			return url;
		}
	} catch (error) {
		console.error("Error generating pre-signed URL:", error);
		throw new Error("Could not generate pre-signed URL");
	}
};

const extractS3Key = (url: string): string => {
	const bucketName = process.env.MY_AWS_S3_BUCKET;
	const prefix = `https://${bucketName}.s3.ap-south-1.amazonaws.com/`;

	return url.replace(prefix, "");
};

export const deleteS3Image = async (s3URL: string) => {
	const fileKey = extractS3Key(s3URL);
	const command = new DeleteObjectCommand({
		Bucket: process.env.MY_AWS_S3_BUCKET,
		Key: fileKey,
	});

	try {
		await s3.send(command);
		console.log(`File ${fileKey} deleted successfully from S3`);
	} catch (err) {
		console.error("Error deleting the file from S3", err);
		throw new Error("Failed to delete the file from S3");
	}
};
