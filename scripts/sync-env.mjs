#!/usr/bin/env node

/**
 * Environment synchronization script
 * Reads .env.local and generates /web/env.js as an ES module
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = join(__dirname, '..');
const envFile = join(rootDir, '.env.local');
const outputFile = join(rootDir, 'web', 'env.js');

try {
  // Read .env.local file
  const envContent = readFileSync(envFile, 'utf8');
  
  // Parse environment variables
  const vars = {};
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        vars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  // Generate ES module content
  let jsContent = '/**\n * Auto-generated environment configuration\n * DO NOT EDIT MANUALLY - Run `node scripts/sync-env.mjs` to update\n */\n\n';
  
  // Add URL and key as strings
  if (vars.SUPABASE_URL) {
    jsContent += `export const SUPABASE_URL = '${vars.SUPABASE_URL}';\n`;
  }
  
  if (vars.SUPABASE_ANON_KEY) {
    jsContent += `export const SUPABASE_ANON_KEY = '${vars.SUPABASE_ANON_KEY}';\n`;
  }
  
  // Add whitelisted emails as array
  if (vars.WHITELISTED_EMAILS) {
    const emails = vars.WHITELISTED_EMAILS.split(',').map(email => email.trim());
    const emailArray = emails.map(email => `'${email}'`).join(', ');
    jsContent += `export const WHITELISTED_EMAILS = [${emailArray}];\n`;
  }
  
  // Add ENV object with all variables including DEBUG flag
  const ENV = {
    SUPABASE_URL: vars.SUPABASE_URL,
    SUPABASE_ANON_KEY: vars.SUPABASE_ANON_KEY,
    WHITELISTED_EMAILS: vars.WHITELISTED_EMAILS,
    DEBUG: String(vars.DEBUG ?? 'false') === 'true'
  };
  
  jsContent += `\nexport const ENV = ${JSON.stringify(ENV, null, 2)};\n`;
  
  // Write output file
  writeFileSync(outputFile, jsContent);
  console.log('✅ Environment variables synced to web/env.js with DEBUG =', ENV.DEBUG);
  
} catch (error) {
  console.error('❌ Error syncing environment:', error.message);
  process.exit(1);
}