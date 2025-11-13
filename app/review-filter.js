const DEFAULT_MIN_TEXT_LENGTH = 10;

const DEFAULT_POPULAR_PHRASES = [
    "best",
    "best app",
    "love it",
    "good",
    "okay",
    "ok",
    "oke",
    "top",
    "top app",
    "op",
    "nice",
    "beautiful",
    "cool",
    "mantap",
    "bagus",
    "keren",
    "good apk",
    "good app",
    "bom",
    "класс"
];

export function getReviewSkipReason(review, filtersConfig = {}) {
    if (!review) {
        return null;
    }

    const rating = parseInt(review.rating, 10);
    if (Number.isNaN(rating) || rating !== 5) {
        return null;
    }

    const rawText = typeof review.text === "string" ? review.text : "";
    const trimmedText = rawText.trim();
    const filters = resolveFiltersConfig(filtersConfig);

    if (!trimmedText.length) {
        return "empty_text";
    }

    if (trimmedText.length < filters.minTextLength) {
        return "short_text";
    }

    if (isPopularPhrase(trimmedText, filters.popularPhrases)) {
        return "popular_text";
    }

    return null;
}

export function shouldSkipReview(review, filtersConfig = {}) {
    return getReviewSkipReason(review, filtersConfig) !== null;
}

function resolveFiltersConfig(config) {
    const configObject = extractFiltersObject(config);

    const minTextLength = Number.isInteger(configObject.minTextLength) && configObject.minTextLength > 0
        ? configObject.minTextLength
        : DEFAULT_MIN_TEXT_LENGTH;

    const phrasesSource = Array.isArray(configObject.popularPhrases) && configObject.popularPhrases.length > 0
        ? configObject.popularPhrases
        : DEFAULT_POPULAR_PHRASES;

    const popularPhrases = phrasesSource
        .map((phrase) => normalizeText(typeof phrase === "string" ? phrase : ""))
        .filter(Boolean);

    return {
        minTextLength,
        popularPhrases
    };
}

function extractFiltersObject(config) {
    if (!config || typeof config !== "object") {
        return {};
    }

    if (config.reviewFilters && typeof config.reviewFilters === "object") {
        return extractFiltersObject(config.reviewFilters);
    }

    const hasPhrases = Array.isArray(config.popularPhrases);
    const hasMinLength = Object.prototype.hasOwnProperty.call(config, "minTextLength");

    if (hasPhrases || hasMinLength) {
        return config;
    }

    return {};
}

function isPopularPhrase(text, phrases) {
    const normalizedText = normalizeText(text);

    if (!normalizedText) {
        return false;
    }

    const phraseSet = new Set(phrases);
    if (phraseSet.has(normalizedText)) {
        return true;
    }

    const singleWords = phrases.filter((phrase) => phrase.indexOf(" ") === -1);
    if (!singleWords.length) {
        return false;
    }

    const singleWordSet = new Set(singleWords);
    const tokens = normalizedText.split(" ").filter(Boolean);

    return tokens.length > 0 && tokens.every((token) => singleWordSet.has(token));
}

function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]+/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}

