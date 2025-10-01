# @mjs/i18n

A comprehensive internationalization package for translating application messages across multiple languages using Google AI.

## Features

- Translate messages for specific apps or all apps at once
- Support for multiple languages (de, es, fr, it, ja, ko, pt, ru, zh)
- Automated translation using Google AI API
- Support for multiple applications: globals, web, docs, token

## Prerequisites

Before using the translation functionality, ensure you have:

1. **Google AI API Key**: Set up your `GOOGLE_AI_API_KEY` in a `.env.local` file in the project root
2. **Dependencies**: Install required packages using `pnpm install`

## Translation Usage

### Basic Syntax

```bash
pnpm translate --app=<app> --locale=<locale>
```

### Parameters

- `--app`: The application to translate (required)

  - `globals`: Translate global messages
  - `web`: Translate web app messages
  - `docs`: Translate documentation messages
  - `token`: Translate token messages
  - `all`: Translate messages for all apps

- `--locale`: Target language(s) (optional, defaults to 'all')
  - `all`: Translate to all supported languages
  - `de`: German
  - `es`: Spanish
  - `fr`: French
  - `it`: Italian
  - `ja`: Japanese
  - `ko`: Korean
  - `pt`: Portuguese
  - `ru`: Russian
  - `zh`: Chinese
  - Multiple locales: `de,es,fr` (comma-separated)

### Examples

#### Translate specific app to all languages

```bash
# Translate web app messages to all supported languages
pnpm translate --app=web

# Translate token app messages to all supported languages
pnpm translate --app=token
```

#### Translate specific app to specific language

```bash
# Translate web app messages to German only
pnpm translate --app=web --locale=de

# Translate docs app messages to Spanish and French
pnpm translate --app=docs --locale=es,fr
```

#### Translate all apps

```bash
# Translate all apps to all languages
pnpm translate --app=all

# Translate all apps to specific languages
pnpm translate --app=all --locale=ja,ko
```

### Default Behavior

- If no `--app` is specified, defaults to `globals`
- If no `--locale` is specified, defaults to `all` (all supported languages)
- English (`en`) is used as the source language and is never translated

## File Structure

The translation process works with the following structure:

```
packages/i18n/
├── messages/
│   ├── globals/
│   │   ├── en.json
│   │   ├── de.json
│   │   ├── es.json
│   │   └── ...
│   ├── web/
│   │   ├── en.json
│   │   ├── de.json
│   │   └── ...
│   └── ...
└── prompts/
    ├── v1.md
    └── tone.md
```

## Error Handling

The script will:

- Validate that the provided app name is valid
- Check for the required `GOOGLE_AI_API_KEY` environment variable
- Handle translation errors gracefully and continue with other locales
- Provide detailed console output for monitoring progress

## Troubleshooting

1. **Missing API Key**: Ensure `GOOGLE_AI_API_KEY` is set in `.env.local`
2. **Invalid App**: Use one of the supported app names: `globals`, `web`, `docs`, `token`, or `all`
3. **Translation Errors**: Check console output for specific error messages and retry individual locales if needed
