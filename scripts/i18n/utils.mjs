import fs from 'fs';
import path from 'path';

/**
 * Safely write a JSON translation file with proper UTF-8 encoding.
 * NEVER use fs.writeFileSync without explicit utf8; this is the only safe wrapper.
 */
export function writeTranslationFile(filePath, data) {
  const json = `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(filePath, json, { encoding: 'utf8' });
  console.log(`Written: ${filePath}`);
}

export function readTranslationFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }));
}

export function getLocaleDir(locale) {
  return path.resolve(process.cwd(), 'src', 'messages', locale);
}

export const SUPPORTED_LOCALES = ['he', 'en', 'ru', 'ar'];
