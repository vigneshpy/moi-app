import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import type { GiftRow } from "./gifts";
import type { EventWithTotals } from "./events";

/**
 * Export gifts as CSV and share via the OS share sheet.
 */
export async function exportCSV(
	event: EventWithTotals,
	gifts: GiftRow[],
): Promise<void> {
	const header = "Name,Partner,Amount,Method,Note,Date";
	const rows = gifts.map((g) =>
		[
			esc(g.recipient_name),
			esc(g.partner_name ?? ""),
			g.amount,
			g.payment_method,
			esc(g.note ?? ""),
			new Date(g.gift_date).toLocaleDateString("en-IN"),
		].join(","),
	);
	const total = gifts.reduce((s, g) => s + g.amount, 0);
	rows.push(`,,${total},,,TOTAL`);

	const csv = [header, ...rows].join("\n");
	const name = sanitize(event.event_name);
	const path = `${FileSystem.cacheDirectory}${name}-moi.csv`;
	await FileSystem.writeAsStringAsync(path, csv, {
		encoding: FileSystem.EncodingType.UTF8,
	});
	await Sharing.shareAsync(path, {
		mimeType: "text/csv",
		UTI: "public.comma-separated-values-text",
		dialogTitle: `${event.event_name} — Moi export`,
	});
}

/**
 * Export gifts as a styled PDF and share via the OS share sheet.
 */
export async function exportPDF(
	event: EventWithTotals,
	gifts: GiftRow[],
): Promise<void> {
	const total = gifts.reduce((s, g) => s + g.amount, 0);
	const tableRows = gifts
		.map(
			(g) => `
		<tr>
			<td>${he(g.recipient_name)}${g.partner_name ? ` &amp; ${he(g.partner_name)}` : ""}</td>
			<td style="text-align:right">₹ ${g.amount.toLocaleString("en-IN")}</td>
			<td>${g.payment_method}</td>
			<td>${g.note ? he(g.note) : ""}</td>
			<td>${new Date(g.gift_date).toLocaleDateString("en-IN")}</td>
		</tr>`,
		)
		.join("");

	const dateStr = event.event_date
		? new Date(event.event_date).toLocaleDateString("en-IN", {
				day: "numeric",
				month: "long",
				year: "numeric",
		  })
		: "";

	const html = `
	<html>
	<head>
		<meta charset="utf-8"/>
		<style>
			body { font-family: sans-serif; padding: 24px; color: #2B1810; }
			h1 { color: #8B1A2A; margin-bottom: 4px; }
			.sub { color: #5A4437; font-size: 14px; margin-bottom: 16px; }
			.total-box {
				background: #8B1A2A; color: #C9A96E; padding: 12px 20px;
				border-radius: 8px; text-align: center; margin: 16px 0;
			}
			.total-box .amount { font-size: 28px; font-weight: bold; }
			.total-box .label { font-size: 12px; letter-spacing: 1px; }
			table { width: 100%; border-collapse: collapse; margin-top: 12px; }
			th { background: #FAF4E8; color: #5A4437; text-align: left;
				 padding: 8px; font-size: 12px; letter-spacing: 0.5px; border-bottom: 2px solid #C9A96E; }
			td { padding: 8px; border-bottom: 1px solid #D6C7A8; font-size: 14px; }
			tr:last-child td { border-bottom: none; }
			.footer { margin-top: 24px; font-size: 11px; color: #8A7565; text-align: center; }
		</style>
	</head>
	<body>
		<h1>${he(event.event_name)}</h1>
		<div class="sub">${dateStr}${event.location ? ` · ${he(event.location)}` : ""}</div>

		<div class="total-box">
			<div class="label">TOTAL COLLECTED</div>
			<div class="amount">₹ ${total.toLocaleString("en-IN")}</div>
			<div class="label">${gifts.length} entries</div>
		</div>

		<table>
			<thead>
				<tr>
					<th>NAME</th>
					<th style="text-align:right">AMOUNT</th>
					<th>METHOD</th>
					<th>NOTE</th>
					<th>DATE</th>
				</tr>
			</thead>
			<tbody>${tableRows}</tbody>
		</table>

		<div class="footer">Exported from Moi App</div>
	</body>
	</html>`;

	const { uri } = await Print.printToFileAsync({ html });
	const name = sanitize(event.event_name);
	const dest = `${FileSystem.cacheDirectory}${name}-moi.pdf`;
	await FileSystem.moveAsync({ from: uri, to: dest });
	await Sharing.shareAsync(dest, {
		mimeType: "application/pdf",
		UTI: "com.adobe.pdf",
		dialogTitle: `${event.event_name} — Moi export`,
	});
}

function esc(s: string): string {
	if (s.includes(",") || s.includes('"') || s.includes("\n")) {
		return `"${s.replace(/"/g, '""')}"`;
	}
	return s;
}

function he(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function sanitize(s: string): string {
	return s.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
}
