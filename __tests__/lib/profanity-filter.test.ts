import {
	filterProfanity,
	containsProfanity,
	getProfaneWords,
} from "@/lib/profanity-filter";

describe("Profanity Filter", () => {
	describe("filterProfanity", () => {
		it("should filter out profane words", () => {
			const dirtyText = "This is a damn good product";
			const cleanText = filterProfanity(dirtyText);

			expect(cleanText).not.toEqual(dirtyText);
			expect(cleanText).toContain("****");
		});

		it("should filter custom marketplace words", () => {
			const scamText = "This is not a scam, I promise";
			const cleanText = filterProfanity(scamText);

			expect(cleanText).toContain("****");
			expect(cleanText).not.toContain("scam");
		});

		it("should return clean text unchanged", () => {
			const cleanText = "This is a wonderful organic apple";
			const filteredText = filterProfanity(cleanText);

			expect(filteredText).toEqual(cleanText);
		});

		it("should handle empty strings", () => {
			expect(filterProfanity("")).toBe("");
		});

		it("should handle null and undefined inputs", () => {
			expect(filterProfanity(null as any)).toBe(null);
			expect(filterProfanity(undefined as any)).toBe(undefined);
		});

		it("should handle non-string inputs", () => {
			expect(filterProfanity(123 as any)).toBe(123);
			expect(filterProfanity({} as any)).toEqual({});
		});

		it("should filter fraud-related words", () => {
			const fraudText = "This is definitely not fraud";
			const cleanText = filterProfanity(fraudText);

			expect(cleanText).toContain("****");
			expect(cleanText).not.toContain("fraud");
		});

		it("should filter fake-related words", () => {
			const fakeText = "These are not fake products";
			const cleanText = filterProfanity(fakeText);

			expect(cleanText).toContain("****");
			expect(cleanText).not.toContain("fake");
		});
	});

	describe("containsProfanity", () => {
		it("should detect profanity in text", () => {
			const dirtyText = "This damn thing is broken";
			expect(containsProfanity(dirtyText)).toBe(true);
		});

		it("should detect custom marketplace words", () => {
			expect(containsProfanity("This is a scam")).toBe(true);
			expect(containsProfanity("These items are stolen")).toBe(true);
			expect(containsProfanity("This looks fake to me")).toBe(true);
		});

		it("should return false for clean text", () => {
			const cleanText = "This is a beautiful organic product";
			expect(containsProfanity(cleanText)).toBe(false);
		});

		it("should handle empty strings", () => {
			expect(containsProfanity("")).toBe(false);
		});

		it("should handle null and undefined inputs", () => {
			expect(containsProfanity(null as any)).toBe(false);
			expect(containsProfanity(undefined as any)).toBe(false);
		});

		it("should handle non-string inputs", () => {
			expect(containsProfanity(123 as any)).toBe(false);
			expect(containsProfanity({} as any)).toBe(false);
		});

		it("should be case insensitive", () => {
			expect(containsProfanity("This SCAM is obvious")).toBe(true);
			expect(containsProfanity("This Fake product")).toBe(true);
		});
	});

	describe("getProfaneWords", () => {
		it("should return array of profane words found", () => {
			const text = "This damn scam is fake";
			const profaneWords = getProfaneWords(text);

			expect(Array.isArray(profaneWords)).toBe(true);
			expect(profaneWords.length).toBeGreaterThan(0);
			expect(profaneWords).toContain("scam");
			expect(profaneWords).toContain("fake");
		});

		it("should return empty array for clean text", () => {
			const cleanText = "This is a wonderful organic product";
			const profaneWords = getProfaneWords(cleanText);

			expect(Array.isArray(profaneWords)).toBe(true);
			expect(profaneWords).toHaveLength(0);
		});

		it("should handle punctuation correctly", () => {
			const text = "This scam! is fake.";
			const profaneWords = getProfaneWords(text);

			expect(profaneWords).toContain("scam!");
			expect(profaneWords).toContain("fake.");
		});

		it("should handle empty strings", () => {
			const profaneWords = getProfaneWords("");
			expect(Array.isArray(profaneWords)).toBe(true);
			expect(profaneWords).toHaveLength(0);
		});

		it("should handle null and undefined inputs", () => {
			expect(getProfaneWords(null as any)).toEqual([]);
			expect(getProfaneWords(undefined as any)).toEqual([]);
		});

		it("should handle non-string inputs", () => {
			expect(getProfaneWords(123 as any)).toEqual([]);
			expect(getProfaneWords({} as any)).toEqual([]);
		});

		it("should find multiple instances of the same word", () => {
			const text = "This scam and that scam are both fake";
			const profaneWords = getProfaneWords(text);

			// Should find both instances of 'scam'
			expect(profaneWords.filter((word) => word === "scam")).toHaveLength(2);
			expect(profaneWords).toContain("fake");
		});

		it("should be case insensitive in detection", () => {
			const text = "This FRAUD and Fake item";
			const profaneWords = getProfaneWords(text);

			expect(profaneWords).toContain("fraud");
			expect(profaneWords).toContain("fake");
		});
	});
});
