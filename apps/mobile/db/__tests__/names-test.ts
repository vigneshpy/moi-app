import { normaliseName, sameName } from "../names";

describe("normaliseName", () => {
	it("collapses English long-vowel spellings of the same name", () => {
		expect(normaliseName("Raja")).toBe(normaliseName("Raaja"));
		expect(normaliseName("Ravi")).toBe(normaliseName("Ravvi"));
	});

	it("matches Tamil and English spellings of the same name", () => {
		expect(normaliseName("ராஜா")).toBe(normaliseName("Raja"));
		expect(normaliseName("ராமன்")).toBe(normaliseName("Raman"));
	});

	it("folds consonants Tamil script does not distinguish", () => {
		// த is written the same whether it sounds like "tha" or "dha".
		expect(normaliseName("Sathya")).toBe(normaliseName("Satya"));
		// ப covers both "ba" and "pa".
		expect(normaliseName("Bala")).toBe(normaliseName("Pala"));
	});

	it("is case and whitespace insensitive", () => {
		expect(normaliseName("  RAJA  ")).toBe(normaliseName("raja"));
	});

	it("strips honorifics in both scripts", () => {
		expect(normaliseName("Thiru Raja")).toBe(normaliseName("Raja"));
		expect(normaliseName("Mr. Raja")).toBe(normaliseName("Raja"));
		expect(normaliseName("திரு ராஜா")).toBe(normaliseName("ராஜா"));
	});

	it("does not mistake a longer honorific for its own prefix", () => {
		// Stripping "திரு" off "திருமதி" would leave "மதி" — a real name.
		expect(normaliseName("திருமதி ராஜா")).toBe(normaliseName("ராஜா"));
		expect(normaliseName("திருமதி ராஜா")).not.toBe(normaliseName("மதி ராஜா"));
	});

	it("returns an empty key for input with no usable characters", () => {
		expect(normaliseName("")).toBe("");
		expect(normaliseName("   ")).toBe("");
		expect(normaliseName("123 !!")).toBe("");
		// An honorific on its own carries no identity.
		expect(normaliseName("Mr")).toBe("");
	});

	it("keeps genuinely different names apart", () => {
		expect(normaliseName("Raja")).not.toBe(normaliseName("Kumar"));
		expect(normaliseName("Meena")).not.toBe(normaliseName("Kala"));
	});
});

describe("sameName", () => {
	it("treats two spellings of one name as equal", () => {
		expect(sameName("Raaja", "ராஜா")).toBe(true);
	});

	it("never matches on an empty key", () => {
		// Two unusable names must not collapse into one person.
		expect(sameName("", "")).toBe(false);
		expect(sameName("!!", "??")).toBe(false);
	});
});
