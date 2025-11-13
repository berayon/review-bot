import Slack from './slack.js';
import { runBot } from './run-bot.js';

export function start(config) {
    for (var i = 0; i < config.apps.length; i++) {
        var app = config.apps[i];

        const reviewFilters = buildReviewFilters(config, app);

        runBot({
            slackHook: config.slackHook,
            verbose: config.verbose,
            interval: config.interval,
            botIcon: app.botIcon || config.botIcon,
            showAppIcon: app.showAppIcon || config.showAppIcon,
            channel: app.channel || config.channel,
            publisherKey: app.publisherKey,
            appId: app.appId,
            appName: app.appName,
            regions: app.regions,
            log: config.log || "./logs/",
            store: config.store,
            cache: config.cache,
            reviewFilters
        });
    }
}

export function testSlack(config) {
    Slack.test(config);
}

function buildReviewFilters(config, app) {
    const filters = {
        ...(config.reviewFilters || {}),
        ...(app.reviewFilters || {})
    };

    const popularPhrasesCandidate = app.popularPhrases || config.popularPhrases;
    if (Array.isArray(popularPhrasesCandidate) && !Array.isArray(filters.popularPhrases)) {
        filters.popularPhrases = popularPhrasesCandidate;
    }

    const minTextLengthCandidate = resolveNumber(app.minTextLength, config.minTextLength);
    if (typeof filters.minTextLength === "undefined" && typeof minTextLengthCandidate === "number") {
        filters.minTextLength = minTextLengthCandidate;
    }

    return filters;
}

function resolveNumber(...values) {
    for (let i = 0; i < values.length; i++) {
        const value = values[i];
        if (value === null || typeof value === "undefined") {
            continue;
        }

        const numberValue = typeof value === "number" ? value : parseInt(value, 10);
        if (!Number.isNaN(numberValue)) {
            return numberValue;
        }
    }

    return undefined;
}
