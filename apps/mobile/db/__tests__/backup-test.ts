// parseBackup and summarise are pure, but they live alongside the export and
// import routines that open the database. Stub the native modules so the
// format tests run without a device.
jest.mock("expo-sqlite", () => ({ openDatabaseAsync: jest.fn() }));
jest.mock("expo-sharing", () => ({ shareAsync: jest.fn() }));
jest.mock("expo-file-system", () => ({
	documentDirectory: "file:///doc/",
	cacheDirectory: "file:///cache/",
	EncodingType: { UTF8: "utf8" },
	writeAsStringAsync: jest.fn(),
	getInfoAsync: jest.fn(),
}));

import { parseBackup, summarise, BackupError } from "../backup";
import { SCHEMA_VERSION } from "../schema";

function validFile(overrides: Record<string, unknown> = {}): string {
	return JSON.stringify({
		format: "moi-backup",
		formatVersion: 1,
		schemaVersion: SCHEMA_VERSION,
		exportedAt: "2026-08-20T00:00:00.000Z",
		events: [
			{ id: "e1", event_name: "Ravi wedding", direction: "HOSTED" },
			{ id: "e2", event_name: "Kumar wedding", direction: "ATTENDED" },
		],
		gifts: [
			{
				id: "g1",
				event_id: "e1",
				recipient_name: "Raja",
				amount: 501,
				gift_date: Date.UTC(2011, 0, 1),
			},
			{
				id: "g2",
				event_id: "e2",
				recipient_name: "Kumar",
				amount: 1001,
				gift_date: Date.UTC(2019, 5, 4),
			},
		],
		households: [],
		householdMembers: [],
		nameAliases: [],
		notebookPages: [],
		...overrides,
	});
}

describe("parseBackup", () => {
	it("accepts a well-formed file", () => {
		const backup = parseBackup(validFile());
		expect(backup.events).toHaveLength(2);
		expect(backup.gifts).toHaveLength(2);
	});

	it("never claims photos are bundled", () => {
		// References only — a restore must not imply the images came along.
		expect(parseBackup(validFile()).photosIncluded).toBe(false);
	});

	it("rejects text that is not JSON", () => {
		expect(() => parseBackup("not json at all")).toThrow(BackupError);
		try {
			parseBackup("{{{");
		} catch (e) {
			expect((e as BackupError).code).toBe("MALFORMED");
		}
	});

	it("rejects JSON that is not a Moi backup", () => {
		try {
			parseBackup(JSON.stringify({ some: "other app" }));
			throw new Error("should have thrown");
		} catch (e) {
			expect((e as BackupError).code).toBe("MALFORMED");
		}
	});

	it("rejects a schema version newer than this build understands", () => {
		try {
			parseBackup(validFile({ schemaVersion: SCHEMA_VERSION + 1 }));
			throw new Error("should have thrown");
		} catch (e) {
			expect((e as BackupError).code).toBe("UNSUPPORTED_VERSION");
		}
	});

	it("accepts an older schema version, which migrations bring forward", () => {
		expect(() => parseBackup(validFile({ schemaVersion: 1 }))).not.toThrow();
	});

	it("rejects a file with no functions and no entries", () => {
		try {
			parseBackup(validFile({ events: [], gifts: [] }));
			throw new Error("should have thrown");
		} catch (e) {
			expect((e as BackupError).code).toBe("EMPTY");
		}
	});

	it("rejects entry rows missing required fields", () => {
		try {
			parseBackup(
				validFile({ gifts: [{ id: "g1", event_id: "e1", amount: 5 }] }),
			);
			throw new Error("should have thrown");
		} catch (e) {
			expect((e as BackupError).code).toBe("MALFORMED");
		}
	});

	it("carries a translation key for every error", () => {
		try {
			parseBackup("garbage");
		} catch (e) {
			expect((e as BackupError).i18nKey).toBe("backup.errors.MALFORMED");
		}
	});
});

describe("summarise", () => {
	it("reports the counts and date range shown before a restore", () => {
		const s = summarise(parseBackup(validFile()));
		expect(s.eventCount).toBe(2);
		expect(s.giftCount).toBe(2);
		expect(new Date(s.earliest!).getFullYear()).toBe(2011);
		expect(new Date(s.latest!).getFullYear()).toBe(2019);
	});

	it("handles a file whose entries carry no usable dates", () => {
		const s = summarise(
			parseBackup(
				validFile({
					gifts: [
						{ id: "g1", event_id: "e1", recipient_name: "Raja", amount: 501 },
					],
				}),
			),
		);
		expect(s.earliest).toBeNull();
		expect(s.latest).toBeNull();
	});
});
