import mongoose from "mongoose";
import { DATA_BASE_URI } from "./constants";
const clientOptions = {
	serverApi: { version: "1", strict: true, deprecationErrors: true },
	tls: true, // Ensure TLS is enabled
};

const connectDB = async function run() {
	try {
		//@ts-ignore
		await mongoose.connect(DATA_BASE_URI, clientOptions);
		//@ts-ignore
		await mongoose.connection.db.admin().command({ ping: 1 });
		console.log(
			"Pinged your deployment. You successfully connected to MongoDB!"
		);
	} catch (e) {
	} finally {
	}
};

mongoose.connection.on("connected", () => {
	console.log("Mongoose default connection is open");
});

mongoose.connection.on("error", (err) => {
	console.error(`Mongoose connection error: ${err}`);
});

mongoose.connection.on("disconnected", () => {
	console.log("Mongoose default connection is disconnected");
});

export default connectDB;
