/**
 * Name normalisation for matching the same person across spellings.
 *
 * The same family shows up in a notebook as "Raja", "Raaja", "ராஜா" and
 * "ராசா". We reduce all of those to one `name_key` so reciprocity search can
 * group them. This is deliberately lossy and deliberately imperfect —
 * Tamil/English transliteration has no single correct answer. Anything the
 * key gets wrong is fixed by the user through a manual merge
 * (see `name_aliases` in db/households.ts); nothing is ever auto-merged
 * across different keys.
 */

/** Honorifics that carry no identity, in both scripts. */
const HONORIFICS = [
	"thiru",
	"thirumathi",
	"tmt",
	"selvi",
	"selvan",
	"mr",
	"mrs",
	"ms",
	"dr",
	"shri",
	"sri",
	"smt",
];

// Longest first — "திருமதி" must be tested before its own prefix "திரு",
// otherwise stripping leaves the fragment "மதி", which is a real name.
const TAMIL_HONORIFICS = [
	"திருமதி",
	"செல்வன்",
	"டாக்டர்",
	"செல்வி",
	"திரு",
];

/**
 * Tamil consonant → folded Latin. These map straight to the *post-folding*
 * form (த → "t", not "th") so both scripts converge on the same key.
 */
const TAMIL_CONSONANTS: Record<string, string> = {
	"க": "k", // க
	"ங": "n", // ங
	"ச": "s", // ச
	"ஞ": "n", // ஞ
	"ட": "t", // ட
	"ண": "n", // ண
	"த": "t", // த
	"ந": "n", // ந
	"ப": "p", // ப
	"ம": "m", // ம
	"ய": "y", // ய
	"ர": "r", // ர
	"ல": "l", // ல
	"வ": "v", // வ
	"ழ": "l", // ழ  (zh — folded to l, "Tamizh"/"Tamil")
	"ள": "l", // ள
	"ற": "r", // ற
	"ன": "n", // ன
	"ஜ": "s", // ஜ  (ja — folded to s, "Raja"/"Raasa")
	"ஷ": "s", // ஷ
	"ஸ": "s", // ஸ
	"ஹ": "h", // ஹ  (dropped later by the h-strip)
	"ஶ": "s", // ஶ
};

/** Independent vowels. Length is dropped — "aa" and "a" must collide. */
const TAMIL_VOWELS: Record<string, string> = {
	"அ": "a", // அ
	"ஆ": "a", // ஆ
	"இ": "i", // இ
	"ஈ": "i", // ஈ
	"உ": "u", // உ
	"ஊ": "u", // ஊ
	"எ": "e", // எ
	"ஏ": "e", // ஏ
	"ஐ": "ai", // ஐ
	"ஒ": "o", // ஒ
	"ஓ": "o", // ஓ
	"ஔ": "au", // ஔ
};

/** Dependent vowel signs (matras) that follow a consonant. */
const TAMIL_SIGNS: Record<string, string> = {
	"ா": "a", // ா
	"ி": "i", // ி
	"ீ": "i", // ீ
	"ு": "u", // ு
	"ூ": "u", // ூ
	"ெ": "e", // ெ
	"ே": "e", // ே
	"ை": "ai", // ை
	"ொ": "o", // ொ
	"ோ": "o", // ோ
	"ௌ": "au", // ௌ
};

const PULLI = "்"; // ் — kills the consonant's inherent vowel
const AYTHAM = "ஃ"; // ஃ

function hasTamil(s: string): boolean {
	return /[஀-௿]/.test(s);
}

/**
 * Transliterate Tamil script to a folded Latin approximation.
 *
 * A bare consonant carries an inherent "a" (க = "ka"); a following pulli
 * removes it (க் = "k") and a following vowel sign replaces it (கா = "ka").
 */
function transliterateTamil(s: string): string {
	let out = "";
	for (let i = 0; i < s.length; i++) {
		const ch = s[i];

		const consonant = TAMIL_CONSONANTS[ch];
		if (consonant) {
			out += consonant;
			const next = s[i + 1];
			if (next === PULLI) {
				i++; // inherent vowel killed — emit nothing
			} else if (next && TAMIL_SIGNS[next]) {
				out += TAMIL_SIGNS[next];
				i++;
			} else {
				out += "a"; // inherent vowel
			}
			continue;
		}

		const vowel = TAMIL_VOWELS[ch];
		if (vowel) {
			out += vowel;
			continue;
		}

		// Stray signs, aytham and ZWJ/ZWNJ carry no identity.
		if (TAMIL_SIGNS[ch] || ch === PULLI || ch === AYTHAM) continue;
		if (ch === "‌" || ch === "‍") continue;

		out += ch; // pass through Latin/digits mixed into a Tamil string
	}
	return out;
}

/**
 * Fold Latin spellings that represent the same Tamil sound.
 *
 * Digraphs go first so "th" becomes "t" before the lone-h strip runs, and
 * doubled letters collapse last so "Raaja" and "Raja" land together.
 */
function foldLatin(s: string): string {
	return s
		// Aspirated digraphs → their plain consonant.
		.replace(/th/g, "t")
		.replace(/dh/g, "t")
		.replace(/gh/g, "k")
		.replace(/kh/g, "k")
		.replace(/bh/g, "p")
		.replace(/ph/g, "p")
		.replace(/ch/g, "s")
		.replace(/sh/g, "s")
		.replace(/zh/g, "l")
		// Voiced/unvoiced pairs Tamil does not distinguish in writing.
		.replace(/[dt]/g, "t")
		.replace(/[gk]/g, "k")
		.replace(/[bp]/g, "p")
		.replace(/[jz]/g, "s")
		.replace(/w/g, "v")
		// Long vowels written as digraphs.
		.replace(/ee/g, "i")
		.replace(/oo/g, "u")
		// A remaining lone 'h' is almost always decorative ("Mahesh"/"Makesh").
		.replace(/h/g, "")
		// Finally collapse any doubled letter.
		.replace(/(.)\1+/g, "$1");
}

/**
 * Reduce a display name to its match key.
 *
 * Returns "" for a name with no usable characters — callers should treat an
 * empty key as "unmatchable" rather than grouping those rows together.
 */
export function normaliseName(raw: string): string {
	if (!raw) return "";

	let s = raw.normalize("NFC").trim().toLowerCase();

	// Strip one Tamil honorific while the script is still intact.
	for (const h of TAMIL_HONORIFICS) {
		if (s.startsWith(h)) {
			s = s.slice(h.length);
			break;
		}
	}

	if (hasTamil(s)) s = transliterateTamil(s);

	// Drop everything that isn't a letter, then strip Latin honorifics from
	// the resulting word list.
	const words = s
		.split(/[^a-zÀ-ɏ]+/)
		.filter(Boolean)
		.filter((w) => !HONORIFICS.includes(w));

	if (!words.length) return "";

	return foldLatin(words.join(""));
}

/**
 * Key used for prefix search. Same normalisation, but callers match with
 * LIKE 'key%' so a partial name still hits.
 */
export function searchKey(raw: string): string {
	return normaliseName(raw);
}

/** True when two display names normalise to the same key. */
export function sameName(a: string, b: string): boolean {
	const ka = normaliseName(a);
	return ka !== "" && ka === normaliseName(b);
}
