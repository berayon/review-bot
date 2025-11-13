#! /usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PlayStoreWatcher from './../watcher/google/PlayStoreWatcher.js';
import { getReviewSkipReason } from '../app/review-filter.js';

const program = new Command();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultConfigPath = path.resolve(__dirname, '../defaultConfig.json');

program
  .argument('[file]', 'Path to config JSON', defaultConfigPath)
  .option('--app-index <index>', 'Select app index from config.apps', '0')
  .option('--dry-run', 'Run filter on sample data without external requests', false)
  .parse(process.argv);

const options = program.opts();
const configFile = program.args[0] || defaultConfigPath;
const resolvedConfigPath = path.resolve(process.cwd(), configFile);

let config;
try {
  const raw = fs.readFileSync(resolvedConfigPath, 'utf-8');
  config = JSON.parse(raw);
} catch (error) {
  console.error(`Failed to read config file: ${error.message}`);
  process.exit(1);
}

if (!Array.isArray(config.apps) || config.apps.length === 0) {
  console.error('No apps found in the provided config');
  process.exit(1);
}

const appIndex = Number.parseInt(options.appIndex, 10) || 0;
const app = config.apps[appIndex];

if (!app) {
  console.error(`App with index ${appIndex} not found in config`);
  process.exit(1);
}

const watcherConfig = buildWatcherConfig(config, app, resolvedConfigPath);

if (options.dryRun) {
  runDryRun(watcherConfig);
  process.exit(0);
}

const watcher = new PlayStoreWatcher(watcherConfig);
watcher.watchTick()
  .then(() => {
    console.log('PlayStore watcher tick finished');
  })
  .catch((error) => {
    console.error('PlayStore watcher failed:', error.message);
    process.exit(1);
  });

function buildWatcherConfig(rootConfig, appConfig, configPath) {
  const base = {
    slackHook: rootConfig.slackHook,
    verbose: rootConfig.verbose,
    interval: rootConfig.interval,
    botIcon: appConfig.botIcon ?? rootConfig.botIcon,
    showAppIcon: appConfig.showAppIcon ?? rootConfig.showAppIcon,
    channel: appConfig.channel ?? rootConfig.channel,
    publisherKey: resolvePath(appConfig.publisherKey, configPath),
    appId: appConfig.appId,
    appName: appConfig.appName,
    regions: appConfig.regions,
    log: resolvePath(appConfig.log ?? rootConfig.log ?? './log/', configPath),
    store: 'google-play',
    cache: resolvePath(rootConfig.cache ?? './cache/android.json', configPath)
  };

  const reviewFilters = {
    ...(rootConfig.reviewFilters ?? {}),
    ...(appConfig.reviewFilters ?? {})
  };

  const popularPhrasesCandidate = appConfig.popularPhrases ?? rootConfig.popularPhrases;
  if (!reviewFilters.popularPhrases && Array.isArray(popularPhrasesCandidate)) {
    reviewFilters.popularPhrases = popularPhrasesCandidate;
  }

  const minTextLengthCandidate = resolveNumber(appConfig.minTextLength, rootConfig.minTextLength);
  if (typeof reviewFilters.minTextLength === 'undefined' && typeof minTextLengthCandidate === 'number') {
    reviewFilters.minTextLength = minTextLengthCandidate;
  }

  return {
    ...base,
    reviewFilters
  };
}

function resolvePath(targetPath, baseFile) {
  if (!targetPath) {
    return targetPath;
  }

  if (path.isAbsolute(targetPath)) {
    return targetPath;
  }

  return path.resolve(path.dirname(baseFile), targetPath);
}

function resolveNumber(...values) {
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (value === null || typeof value === 'undefined') {
      continue;
    }

    const numberValue = typeof value === 'number' ? value : Number.parseInt(value, 10);
    if (!Number.isNaN(numberValue)) {
      return numberValue;
    }
  }

  return undefined;
}

function runDryRun(config) {
  const samples = [
    { id: 'sample_popular', rating: 5, text: 'Best app' },
    { id: 'sample_short', rating: 5, text: 'Nice' },
    { id: 'sample_ok', rating: 5, text: 'Great features and support, thank you!' }
  ];

  console.log('Running dry-run with sample reviews:');
  samples.forEach((review) => {
    const reason = getReviewSkipReason(review, config);
    if (reason) {
      console.log(`- Review ${review.id} skipped (${reason}) -> "${review.text}"`);
    } else {
      console.log(`- Review ${review.id} will be sent -> "${review.text}"`);
    }
  });
}