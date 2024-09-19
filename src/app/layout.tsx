import type { Metadata } from "next";
import NavBar from "./components/navbar/NavBar";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";
import { Roboto } from "next/font/google";

const roboto = Roboto({
	weight: ["300", "400", "500", "700"],
	subsets: ["latin"],
	display: "swap",
	variable: "--font-roboto",
});

export const metadata: Metadata = {
	title: "Moi App",
	description: "Gift tracking system",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			</head>
			<body className={roboto.variable}>
				{" "}
				<AppRouterCacheProvider>
					<ThemeProvider theme={theme}>
						<NavBar />
						{children}
					</ThemeProvider>
				</AppRouterCacheProvider>
			</body>
		</html>
	);
}
