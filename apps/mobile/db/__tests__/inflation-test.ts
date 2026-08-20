import {
	presentDayEquivalent,
	BASE_YEAR,
	EARLIEST_YEAR,
} from "../inflation";

describe("presentDayEquivalent", () => {
	it("returns null for recent entries, where the hint adds nothing", () => {
		expect(presentDayEquivalent(501, BASE_YEAR)).toBeNull();
		expect(presentDayEquivalent(501, BASE_YEAR - 1)).toBeNull();
	});

	it("estimates upward for older entries", () => {
		const value = presentDayEquivalent(101, 1990);
		expect(value).not.toBeNull();
		expect(value!).toBeGreaterThan(101);
	});

	it("grows monotonically the further back the entry is", () => {
		const y2000 = presentDayEquivalent(1000, 2000)!;
		const y1990 = presentDayEquivalent(1000, 1990)!;
		const y1980 = presentDayEquivalent(1000, 1980)!;
		expect(y1990).toBeGreaterThan(y2000);
		expect(y1980).toBeGreaterThan(y1990);
	});

	it("scales with the amount", () => {
		const small = presentDayEquivalent(100, 1995)!;
		const large = presentDayEquivalent(1000, 1995)!;
		expect(large).toBeGreaterThan(small * 5);
	});

	it("clamps years older than the table rather than exploding", () => {
		const oldest = presentDayEquivalent(101, EARLIEST_YEAR)!;
		const older = presentDayEquivalent(101, EARLIEST_YEAR - 30)!;
		expect(older).toBe(oldest);
	});

	it("rejects amounts that are not usable", () => {
		expect(presentDayEquivalent(0, 1990)).toBeNull();
		expect(presentDayEquivalent(-50, 1990)).toBeNull();
		expect(presentDayEquivalent(NaN, 1990)).toBeNull();
		expect(presentDayEquivalent(101, NaN)).toBeNull();
	});

	it("rounds to a figure that does not imply false precision", () => {
		// Whatever the multiplier, the result must not carry rupees-and-paise
		// detail the underlying table cannot support.
		const value = presentDayEquivalent(101, 1985)!;
		expect(Number.isInteger(value)).toBe(true);
		expect(value % 10).toBe(0);
	});
});
