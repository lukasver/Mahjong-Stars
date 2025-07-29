import { parseArgs } from 'util';
import { Translator, getPrompt } from '@mjs/utils';
import dotenv from 'dotenv';
import {
  getAppsFromDirs,
  getLocalesFromDirs,
  getMessagesPath,
  getPromptsPath,
  readJsonSafe,
} from './utils';

/**
 * Script to translate application localization messages from English to other languages.
 *
 * Usage:
 * ```bash
 * # Translate messages for a specific app
 * pnpm translate --app=<app> --locale=<locale>
 *
 * # Where <app> can be:
 * # - globals: Translate global messages
 * # - web: Translate web app messages
 * # - docs: Translate documentation messages
 * # - token: Translate token messages
 * # - all: Translate messages for all apps
 * ```
 *
 * Requires GOOGLE_AI_API_KEY to be set in .env.local file.
 */

dotenv.config({ path: '.env.local' });

if (!process.env.GOOGLE_AI_API_KEY) {
  throw new Error('GOOGLE_AI_API_KEY is not set');
}

const translator = new Translator(process.env.GOOGLE_AI_API_KEY);

const APPS = ['globals', 'web', 'docs', 'token'];
/**
 * Validates if the provided app name is valid
 */
function isValidApp(app: string): app is (typeof APPS)[number] {
  return [...APPS, 'all'].includes(app);
}

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    app: {
      type: 'string',
      default: 'globals', // globals, web, docs, token, all
    },
    locale: {
      type: 'string',
      default: 'all', // all, de, es, fr, it, ja, ko, pt, ru, zh
    },
  },
  strict: true,
  allowPositionals: true,
});

if (!isValidApp(values.app)) {
  throw new Error(
    `Invalid app "${values.app}". Must be one of: globals, web, docs, token or all`
  );
}

async function main() {
  const APPS = (await getAppsFromDirs()).filter(
    (app) => app === values.app || values.app === 'all'
  );

  // We need to read the english version of each app and translate to all other languages.

  // Get english version of apps to use as base
  const [base, locales] = await Promise.all([
    Promise.all(
      APPS.map((app) => readJsonSafe(getMessagesPath(app, 'en.json')))
    ),
    Promise.all(APPS.map((app) => getLocalesFromDirs(getMessagesPath(app)))),
  ]);

  await Promise.all(
    APPS.map(async (app, index) => {
      const localesToTranslate =
        values.locale === 'all'
          ? Array.from(locales[index] || [])
          : values.locale?.split(',');

      const appLocales = localesToTranslate.filter((locale) => locale !== 'en');

      const appBaseMessages = base[index] || [];

      try {
        const results = await Promise.all(
          appLocales.map(async (locale) => {
            console.group(`${app} ${locale}`);
            const prompt = await getPrompt(getPromptsPath('v1.md'), {
              persona: await getPrompt(getPromptsPath('tone.md')),
              target_language: locale,
              structure: JSON.stringify(appBaseMessages, null, 2),
            });

            if (!prompt) {
              console.error(`No prompt for ${app} ${locale}`);
              return;
            }

            return translator
              .translateAndSave(
                locale,
                prompt,
                null, // getMessagesPath(app, `${locale}.json`));
                getMessagesPath(app, `${locale}.json`),
                { mimeType: 'application/json' }
              )
              .then((r) => {
                console.debug('FINISHED', locale);
                console.groupEnd();
                return r;
              })
              .catch((_e) => {
                console.error(`Error translating ${app} ${locale}`);
              });
          })
        );
        console.debug('RESULTS', results.length);
      } catch (e) {
        console.error(
          `Error translating ${app}`,
          e instanceof Error ? e.message : e
        );
      }
    })
  );
  console.debug('FINISHED ALL');
}

try {
  await main();
  process.exit(0);
} catch (e) {
  console.error(e);
  process.exit(1);
}
