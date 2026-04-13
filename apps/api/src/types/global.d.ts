declare namespace NodeJS {
	interface ProcessEnv {
		DATABASE_USER_NAME: string;
		DATABASE_PASSWORD: string;
		DATABASE_NAME: string;
		DATABASE_CLUSTER_ID: string;
		JWT_SECRET: string;
		NODE_ENV?: "development" | "production";
	}
}
