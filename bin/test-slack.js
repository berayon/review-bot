#! /usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as reviewBot from '../app/app.js';

const program = new Command();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultConfigPath = path.resolve(__dirname, '../defaultConfig.json');

program
  .argument('[file]', 'Path to config JSON', defaultConfigPath)
  .parse(process.argv);

const configFile = program.args[0] || defaultConfigPath;
let config;

try {
  const resolvedPath = path.resolve(process.cwd(), configFile);
  const raw = fs.readFileSync(resolvedPath, 'utf-8');
  config = JSON.parse(raw);
} catch (error) {
  console.error(`Failed to read config file: ${error.message}`);
  process.exit(1);
}

reviewBot.testSlack(config);