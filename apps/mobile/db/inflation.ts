/**
 * Rough present-day equivalents for older moi amounts.
 *
 * A ₹101 moi in 1985 was a different gesture than ₹101 today, and a notebook
 * spanning decades reads wrong without that context. This is a fixed table
 * bundled in the app — no network, no live data — built from approximate
 * annual Indian consumer price inflation.
 *
 * It is an approximation and the UI must always label it as one. It is never
 * used for arithmetic the user is shown as fact, only as a secondary hint
 * beside the real recorded amount.
 */

/** Everything is expressed in rupees of this year. */
export const BASE_YEAR = 2026;

/**
 * Approximate annual CPI inflation, as a fraction. Years before 1990 use
 * decade averages; recent years track published figures closely enough for a
 * hint that is rounded to two significant figures before display anyway.
 */
const ANNUAL_INFLATION: Record<number, number> = {
	2025: 0.045,
	2024: 0.049,
	2023: 0.054,
	2022: 0.067,
	2021: 0.055,
	2020: 0.062,
	2019: 0.048,
	2018: 0.034,
	2017: 0.036,
	2016: 0.045,
	2015: 0.049,
	2014: 0.064,
	2013: 0.109,
	2012: 0.093,
	2011: 0.089,
	2010: 0.12,
	2009: 0.109,
	2008: 0.083,
	2007: 0.064,
	2006: 0.062,
	2005: 0.042,
	2004: 0.038,
	2003: 0.038,
	2002: 0.043,
	2001: 0.038,
	2000: 0.04,
};

/** Decade averages for anything older than the per-year table. */
const DECADE_AVERAGE: Array<{ from: number; rate: number }> = [
	{ from: 1990, rate: 0.095 },
	{ from: 1980, rate: 0.09 },
	{ from: 1970, rate: 0.085 },
];

/** Oldest year we will estimate for. Anything older is clamped to this. */
export const EARLIEST_YEAR = 1970;

function rateFor(year: number): number {
	const exact = ANNUAL_INFLATION[year];
	if (exact !== undefined) return exact;
	for (const band of DECADE_AVERAGE) {
		if (year >= band.from) return band.rate;
	}
	return DECADE_AVERAGE[DECADE_AVERAGE.length - 1].rate;
}

/** year -> multiplier that converts that year's rupees into BASE_YEAR rupees. */
const MULTIPLIERS: Record<number, number> = (() => {
	const table: Record<number, number> = { [BASE_YEAR]: 1 };
	let acc = 1;
	for (let y = BASE_YEAR - 1; y >= EARLIEST_YEAR; y--) {
		acc *= 1 + rateFor(y);
		table[y] = acc;
	}
	return table;
})();

/**
 * Only show an equivalent once it is far enough back to be meaningful.
 * Below this the two figures are near-identical and the extra line is noise.
 */
const MIN_YEARS_BACK = 3;

/**
 * Present-day equivalent of `amount` recorded in `year`, or null when the
 * entry is recent enough that the hint would add nothing.
 *
 * Rounded to a round-ish figure: the precision of the underlying table does
 * not justify showing rupees and paise.
 */
export function presentDayEquivalent(
	amount: number,
	year: number,
): number | null {
	if (!Number.isFinite(amount) || amount <= 0) return null;
	if (!Number.isFinite(year)) return null;
	if (BASE_YEAR - year < MIN_YEARS_BACK) return null;

	const clamped = Math.max(EARLIEST_YEAR, Math.min(BASE_YEAR, Math.round(year)));
	const multiplier = MULTIPLIERS[clamped];
	if (!multiplier || multiplier <= 1) return null;

	const raw = amount * multiplier;
	return roundToSignificant(raw);
}

/** Round to a figure that doesn't imply false precision. */
function roundToSignificant(value: number): number {
	if (value < 100) return Math.round(value / 10) * 10;
	if (value < 1000) return Math.round(value / 50) * 50;
	if (value < 10000) return Math.round(value / 100) * 100;
	if (value < 100000) return Math.round(value / 500) * 500;
	return Math.round(value / 1000) * 1000;
}

/** Convenience for callers holding an epoch-millis timestamp. */
export function yearOf(timestamp: number): number {
	return new Date(timestamp).getFullYear();
}
