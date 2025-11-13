import assert from "assert";
import { getReviewSkipReason, shouldSkipReview } from "../app/review-filter.js";

const REVIEW_TEMPLATE = {
    id: "test",
    rating: 5,
    text: "placeholder"
};

function buildReview(overrides = {}) {
    return {
        ...REVIEW_TEMPLATE,
        ...overrides
    };
}

function testShouldNotSkipNonFiveStar() {
    const review = buildReview({ rating: 4, text: "Not perfect" });
    assert.strictEqual(getReviewSkipReason(review), null, "Non five-star review should not be skipped");
    assert.strictEqual(shouldSkipReview(review), false);
}

function testSkipShortFiveStar() {
    const review = buildReview({ text: "Nice app" });
    assert.strictEqual(getReviewSkipReason(review), "short_text", "Short five-star review must be skipped");
    assert.strictEqual(shouldSkipReview(review), true);
}

function testSkipPopularPhrase() {
    const review = buildReview({ text: "Best app!!!" });
    assert.strictEqual(getReviewSkipReason(review), "popular_text", "Popular phrase must be detected");
}

function testAllowLongNonPopularFiveStar() {
    const review = buildReview({ text: "This application solved my problem quickly." });
    assert.strictEqual(getReviewSkipReason(review), null);
    assert.strictEqual(shouldSkipReview(review), false);
}

function testCustomFilters() {
    const review = buildReview({ text: "Okay product" });
    const filters = { minTextLength: 5, popularPhrases: ["super"] };
    assert.strictEqual(getReviewSkipReason(review, filters), null, "Custom filters should override defaults");
}

function testPopularSingleWordTokens() {
    const review = buildReview({ text: "Ok ok ok ok" });
    assert.strictEqual(getReviewSkipReason(review), "popular_text", "Repeated popular words must be skipped");
}

function runTests() {
    testShouldNotSkipNonFiveStar();
    testSkipShortFiveStar();
    testSkipPopularPhrase();
    testAllowLongNonPopularFiveStar();
    testCustomFilters();
    testPopularSingleWordTokens();
}

runTests();

console.log("review-filter tests passed");

