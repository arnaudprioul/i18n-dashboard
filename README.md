# i18n-dashboard

> A full-featured web dashboard to manage [vue-i18n](https://vue-i18n.intlify.dev/) translation keys. Run it alongside your project, manage all your translations in one place, and consume them via a ready-to-use API.

[![npm version](https://img.shields.io/npm/v/i18n-dashboard)](https://www.npmjs.com/package/i18n-dashboard)
[![license](https://img.shields.io/npm/l/i18n-dashboard)](./LICENSE)
[![node](https://img.shields.io/node/v/i18n-dashboard)](https://nodejs.org/)

---

## Features

### Core
- **Multi-project** — manage multiple Vue.js projects from one dashboard, each with its own languages, keys, and settings
- **Translation editor** — inline editing per language, keyboard shortcuts (`Ctrl+Enter` to save, `Esc` to cancel)
- **Plural forms** — dedicated plural editor supporting 2-form (EN/DE), 3-form (FR/ES), 4-form (Slavic), or custom rules
- **Key linking** — insert `@:key` linked references with optional modifiers (`.lower`, `.upper`, `.capitalize`) via a searchable modal picker
- **Escape helpers** — quick-insert toolbar for vue-i18n special characters (`{'@'}`, `{'{'}`, `\\{`, etc.)
- **Translation history** — every change (manual, sync, auto-translate) is tracked; restore any previous version
- **Inline auto-translate** — Google Translate per key (free tier, no API key required)
- **Batch auto-translate** — translate all missing keys for an entire language at once
- **Review workflow** — `Draft → Reviewed → Approved` status pipeline with role-based access control
- **Dashboard widgets** — customizable overview: coverage, total keys, unused keys, recent activity, per-language progress

### Languages
- **BCP 47 support** — full regional codes: `fr-CA`, `en-GB`, `pt-BR`, `zh-CN`, `sr-Latn`, etc. (170+ locales)
- **Fallback chains** — configure explicit fallbacks per language (`fr-CA → fr → en`); automatic BCP 47 parent resolution
- **Auto-detect** — scan or sync automatically detects locale files and creates the corresponding languages
- **Default language** — designate one language as the source for auto-translate

### Scan & Sync
- **Source scan (local)** — browse your file system with the built-in folder picker, detect all `$t()`, `t()`, `<i18n-t>`, `v-t`, and `<i18n>` block usages across `.vue`, `.ts`, `.js` files
- **Source scan (Git)** — clone any Git repository (public or private) using a URL, branch, and access token, then scan the source files without needing a local checkout
- **Source scan (URL)** — fetch `en.json`, `fr.json`… from any remote URL and import all keys
- **Sync** — import existing `.json` locale files (local path or remote URL) into the database
- **Unused key detection** — keys not found in source files are automatically flagged

### Advanced Formats
*(enable per project in Settings)*
- **Number formats** — configure `$n(value, 'currency')` presets using `Intl.NumberFormat` with live preview
- **Datetime formats** — configure `$d(date, 'short')` presets using `Intl.DateTimeFormat` with live preview
- **Custom modifiers** — define `@.modifier:key` transform functions with a built-in test runner
- **Snippet generator** — generates a ready-to-paste `createI18n()` configuration block

### Projects
- **Inline settings** — edit project name, root path, source URLs, Git repository info, locales folder, key separator, color, and description directly from the project settings page
- **Folder browser** — navigate your file system visually to pick the project root path
- **Project snapshot** — export a complete backup (config + languages + all keys + translations) as a single JSON file, import it on any other instance (merge or replace mode)

### Users & Authentication
- **Role-based access** — `Super Admin`, `Admin`, `Moderator`, `Translator` — per-project assignments
- **Onboarding wizard** — guided setup on first launch
- **Multi-language UI** — the dashboard interface itself is translatable

### Technical
- **Multi-database** — SQLite (default, zero config), PostgreSQL, MySQL/MariaDB
- **Auto-migration** — schema is created and updated automatically on startup
- **REST API** — full API for all operations, consume locale JSON from your Vue app
- **CORS auto-detection** — multiple app URLs per project; all are checked for CORS on `/locale/[lang].json`
- **Dark mode** — system preference + manual toggle

---

## Requirements

- **Node.js** >= 18
- **npm** >= 9

---

## Installation

### As a dev dependency (recommended — per project)

```bash
npm install i18n-dashboard --save-dev
```

### Globally (use across multiple projects)

```bash
npm install -g i18n-dashboard
```

---

## Quick Start

### 1 — Initialize

Run the interactive setup wizard from your project root:

```bash
npx i18n-dashboard init
```

This creates an `i18n-dashboard.config.js` file at the root of your project.

### 2 — Start

```bash
npx i18n-dashboard start
```

Open **http://localhost:3333** in your browser.

The onboarding wizard will guide you through:
1. Creating an administrator account
2. Selecting the dashboard UI language
3. Configuring your first project

### 3 — Import existing locale files (optional)

If you already have `.json` locale files, import them into the database:

```bash
npx i18n-dashboard sync
```

> The dashboard must be running for this command to work.

### 4 — Use the API in your Vue app

```js
// src/i18n.js
import { createI18n } from 'vue-i18n'

export const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: await fetch('http://localhost:3333/locale/en.json').then(r => r.json()),
    fr: await fetch('http://localhost:3333/locale/fr.json').then(r => r.json()),
  },
})
```

### 5 — Add a script to your package.json

```json
{
  "scripts": {
    "dev": "vite",
    "i18n": "i18n-dashboard start"
  }
}
```

---

## Configuration

### i18n-dashboard.config.js

```js
// i18n-dashboard.config.js
export default {
  // Port the dashboard will run on
  port: 3333,

  // Key separator for nested keys ('home.title' uses '.')
  keySeparator: '.',

  // URL path pattern for serving locale JSON files
  apiPath: '/locale/[lang].json',

  // Root path of your Vue project (absolute or relative)
  projectRoot: './',

  // Database configuration
  database: {
    // Options: 'better-sqlite3' (default), 'pg', 'mysql2'
    client: 'better-sqlite3',

    // SQLite: path to the .db file
    connection: './i18n-dashboard.db',

    // PostgreSQL / MySQL: use a connection object instead:
    // connection: {
    //   host: 'localhost',
    //   port: 5432,
    //   user: 'myuser',
    //   password: 'mypassword',
    //   database: 'i18n_dashboard',
    // },
  },

  // Google Translate API key (optional — free tier works without a key)
  // googleTranslate: {
  //   apiKey: process.env.GOOGLE_TRANSLATE_API_KEY,
  // },
}
```

### Environment variables

All options can be passed as environment variables (useful for CI/CD and Docker):

| Variable | Description | Default |
|---|---|---|
| `I18N_PORT` | Server port | `3333` |
| `I18N_DB_CLIENT` | DB driver (`better-sqlite3` / `pg` / `mysql2`) | `better-sqlite3` |
| `I18N_DB_CONNECTION` | SQLite file path | `./i18n-dashboard.db` |
| `I18N_DB_HOST` | PostgreSQL/MySQL host | `localhost` |
| `I18N_DB_PORT` | PostgreSQL/MySQL port | `5432` |
| `I18N_DB_USER` | Database user | — |
| `I18N_DB_PASSWORD` | Database password | — |
| `I18N_DB_NAME` | Database name | `i18n_dashboard` |
| `I18N_KEY_SEPARATOR` | Key separator | `.` |
| `I18N_API_PATH` | Locale API path pattern | `/locale/[lang].json` |
| `I18N_PROJECT_ROOT` | Project root path | `process.cwd()` |
| `I18N_LOCALES_PATH` | Locales folder (relative to root) | `src/locales` |
| `GOOGLE_TRANSLATE_API_KEY` | Google Translate API key | — |
| `SESSION_SECRET` | Session encryption secret | *(default, change in prod)* |
| `SMTP_HOST` | SMTP server for email | — |
| `DASHBOARD_URL` | Public URL of the dashboard | `http://localhost:3333` |

---

## CLI Commands

```
i18n-dashboard <command> [options]

Commands:
  start     Start the dashboard server
  stop      Stop a running detached dashboard
  build     Build for production
  init      Run the interactive setup wizard
  sync      Import locale JSON files into the database

Options for start:
  -p, --port <port>   Server port (default: 3333)
  --detach            Run in the background (writes PID file)

Global options:
  -V, --version       Show version
  -h, --help          Show help
```

### Background mode

```bash
# Start in background
npx i18n-dashboard start --detach

# Stop the background process
npx i18n-dashboard stop
```

---

## Interface

### Dashboard

Customizable widget grid. Available widgets:
- **Total keys** — overall key count
- **Coverage** — global translation coverage percentage
- **Languages** — number of configured languages
- **Unused keys** — keys not found in source code
- **Language coverage** — per-language progress bars
- **Recent activity** — latest translation edits
- **Review queue** — translations awaiting approval
- **Projects** — quick project overview

Click **Edit** to add, remove, or rearrange widgets.

### Translations

The main translation table with:
- Search by key name (real-time)
- Filter by language and status (`All`, `Draft`, `Reviewed`, `Approved`, `Missing`, `Unused`)
- Status badge per language
- Auto-translate per key (Google Translate)
- Batch auto-translate for an entire language

Click any key to open its **detail page**:
- Edit each language with the full toolbar (params, escape helpers, plural editor, linked key picker)
- View translation history with one-click restore
- See which source files reference this key (after scan)

#### Plural editor

Switch any translation to plural mode to get a template-based form:

| Template | Languages | Example |
|---|---|---|
| 2 forms — standard | English, German, Dutch… | `car \| cars` |
| 3 forms — zero/one/many | French, Spanish, Italian… | `no cars \| {count} car \| {count} cars` |
| 4 forms — Slavic | Russian, Polish, Ukrainian… | `0 машин \| {n} машина \| {n} машины \| {n} машин` |
| Custom | Any | Define your own forms |

The `{count}` and `{n}` parameters are always available implicitly.

### Languages

- Add languages from 170+ BCP 47 locale codes (`fr`, `fr-CA`, `en-GB`, `zh-CN`, `sr-Latn`…)
- Type any custom BCP 47 code if it's not in the list
- Set a default language (source for auto-translate)
- Configure fallback chains:
  - **Automatic** — `fr-CA → fr` (BCP 47 parent)
  - **Manual** — pick any other configured language
  - **None** — no fallback
- The API resolves the fallback chain transparently and merges translations

### Scan

Click **Scan project** in the sidebar to open the scan modal. Three modes are available:

**Local mode** — browse your file system with the folder picker and scan `.vue`, `.ts`, `.js` files for:
- `$t('key')`, `$tc()`, `$te()`, `$tm()`
- `t('key')` via `useI18n()`
- `<i18n-t keypath="key">`
- `v-t="'key'"`
- `<i18n>` SFC blocks

**Git mode** — provide a repository URL, branch (default: `main`), and a personal access token. The dashboard clones the repo (shallow, depth 1) into a temp directory, scans the source files exactly like local mode, then cleans up automatically. Useful for CI environments or when you don't have a local checkout.

> Required token permission: **Contents → Read** (GitHub fine-grained PAT) or **repo** scope (classic PAT).

**URL mode** — enter the base URL of your app; the scanner fetches each configured locale file (`/locale/en.json`, `/locale/fr.json`…) and imports all keys it finds.

Results (keys found, new keys, unused keys, files scanned) are displayed inline.

### Settings

Per-project settings (editable inline):
- **Project name, root path, locales folder, key separator, color, description**
- **App URLs** — one URL per line; all are accepted for CORS on `/locale/[lang].json`, the first is used for URL-based scan/sync
- **Git repository** — URL, branch, and access token for Git scan mode (token stored in DB, never exposed in the UI after save)
- **Advanced features** — enable/disable Number formats, Datetime formats, Custom modifiers pages
- **Scanner** — configure excluded directories
- **Google Translate** — optional API key
- **Export** — download locale JSON files per language or all at once
- **Snapshot** — export/import a full project backup

### Number Formats *(requires enable in Settings)*

Configure `$n(value, 'formatName')` presets:
- Group by locale
- Style: `decimal`, `currency`, `percent`, `unit`
- Currency / unit selection
- Live `Intl.NumberFormat` preview

### Datetime Formats *(requires enable in Settings)*

Configure `$d(date, 'formatName')` presets:
- Shortcut styles: `dateStyle` / `timeStyle`
- Individual fields: `year`, `month`, `day`, `hour`, `minute`, `second`, `weekday`, `era`, `timeZone`
- Live `Intl.DateTimeFormat` preview

### Modifiers *(requires enable in Settings)*

Define custom `@.modifier:key` transform functions:
- Write JS function body
- Live test runner
- Quick templates: `snakeCase`, `camelCase`, `kebabCase`, `titleCase`

### Snippet generator

Available on all format pages — generates a ready-to-paste `createI18n()` configuration including all your number formats, datetime formats, and custom modifiers.

### Project Snapshot

Export a complete project backup:

```json
{
  "version": 1,
  "exportedAt": "2026-01-01T00:00:00.000Z",
  "project": { "name": "My App", "locales_path": "src/locales", "key_separator": "." },
  "languages": [{ "code": "en", "name": "English", "is_default": true }],
  "keys": [
    {
      "key": "home.title",
      "description": "Homepage title",
      "translations": {
        "en": { "value": "Welcome", "status": "approved" },
        "fr": { "value": "Bienvenue", "status": "reviewed" }
      }
    }
  ]
}
```

Import modes:
- **Merge** — add/update keys without touching existing ones
- **Replace** — delete everything and reimport clean

---

## vue-i18n Integration

### Basic (load all on startup)

```js
// src/i18n.js
import { createI18n } from 'vue-i18n'

const DASHBOARD = 'http://localhost:3333'

export const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: await fetch(`${DASHBOARD}/locale/en.json`).then(r => r.json()),
    fr: await fetch(`${DASHBOARD}/locale/fr.json`).then(r => r.json()),
  },
})
```

### With lazy loading

```js
import { createI18n } from 'vue-i18n'

const DASHBOARD = 'http://localhost:3333'

export const i18n = createI18n({ locale: 'en', fallbackLocale: 'en', messages: {} })

export async function setLocale(locale) {
  if (!i18n.global.availableLocales.includes(locale)) {
    const messages = await fetch(`${DASHBOARD}/locale/${locale}.json`).then(r => r.json())
    i18n.global.setLocaleMessage(locale, messages)
  }
  i18n.global.locale.value = locale
}
```

### With BCP 47 fallbacks

The API automatically resolves fallback chains. If `fr-CA` isn't fully translated, missing keys fall back to `fr`, then to the next configured fallback:

```
GET /locale/fr-CA.json   →  merges fr + fr-CA (fr-CA takes precedence)
X-I18n-Fallback-Chain: fr-CA → fr
```

No configuration needed on the client side.

### For production

Export locale files into your project and include them in your build:

```bash
curl http://localhost:3333/locale/en.json -o src/locales/en.json
curl http://localhost:3333/locale/fr.json -o src/locales/fr.json
```

Or deploy the dashboard on an internal server and keep using the API.

---

## Database

### SQLite (default — zero config)

```js
database: {
  client: 'better-sqlite3',
  connection: './i18n-dashboard.db',
}
```

The `.db` file is created automatically. No setup needed.

### PostgreSQL

```bash
npm install pg
```

```js
database: {
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5432,
    user: 'myuser',
    password: 'mypassword',
    database: 'i18n_dashboard',
  },
}
```

### MySQL / MariaDB

```bash
npm install mysql2
```

```js
database: {
  client: 'mysql2',
  connection: {
    host: 'localhost',
    port: 3306,
    user: 'myuser',
    password: 'mypassword',
    database: 'i18n_dashboard',
  },
}
```

### Schema

Tables are created and migrated automatically on startup:

```
projects          — multi-project support
languages         — per-project language list (BCP 47 codes, fallback_code)
translation_keys  — key registry (key, description, is_unused, usages)
translations      — values per key per language (value, status)
translation_history — full edit history (old_value, new_value, changed_by)
key_usages        — source file references (file_path, line_number, function)
settings          — global settings (scan_exclude, google_translate_api_key)
users             — dashboard users (name, email, role, bcrypt password)
project_number_formats   — Intl.NumberFormat presets
project_datetime_formats — Intl.DateTimeFormat presets
project_modifiers        — custom @.modifier functions
```

---

## REST API

All endpoints require a `project_id` parameter.

### Locale export (main endpoint for vue-i18n)

```http
GET /locale/:lang.json?project_id=1
```

Returns nested JSON with all translations for the given language. Resolves fallback chains automatically.

**Response headers:**
- `X-I18n-Fallback-Chain: fr-CA → fr` — debug the resolved chain

### Projects

```http
GET    /api/projects
POST   /api/projects
PUT    /api/projects/:id
DELETE /api/projects/:id
```

### Languages

```http
GET    /api/languages?project_id=1
POST   /api/languages
PUT    /api/languages/:id
DELETE /api/languages/:code?project_id=1
```

### Translation keys

```http
GET    /api/keys?project_id=1&search=&lang=&status=&page=1&limit=50
GET    /api/keys/:id
POST   /api/keys
PATCH  /api/keys/:id
DELETE /api/keys/:id
```

### Translations

```http
POST /api/translations          # Save a translation value
POST /api/translations/status   # Update status only
POST /api/translations/batch-translate   # Auto-translate all missing for a language
```

### Scan & Sync

```http
POST /api/scan   # body: { project_id, mode: 'local'|'git'|'url', root_path?, url?, git_url?, git_branch?, git_token? }
POST /api/sync   # body: { project_id }
```

### Project Snapshot

```http
GET  /api/project-snapshot?project_id=1         # Export
POST /api/project-snapshot                       # Import
     body: { snapshot, project_id?, mode: 'merge'|'replace' }
```

### Advanced formats

```http
GET  /api/formats/number?project_id=1
POST /api/formats/number
PUT  /api/formats/number/:id
DELETE /api/formats/number/:id

GET  /api/formats/datetime?project_id=1
POST /api/formats/datetime
PUT  /api/formats/datetime/:id
DELETE /api/formats/datetime/:id

GET  /api/formats/modifiers?project_id=1
POST /api/formats/modifiers
PUT  /api/formats/modifiers/:id
DELETE /api/formats/modifiers/:id

GET  /api/formats/snippet?project_id=1   # Generate createI18n() config snippet
```

### Settings

```http
GET  /api/settings
POST /api/settings
```

### File system browser

```http
GET /api/fs/browse?path=/some/path   # List subdirectories; defaults to home dir
```

---

## User Roles

| Role | Permissions |
|---|---|
| **Super Admin** | Full access to all projects, users, and global settings |
| **Admin** | Full access to assigned projects |
| **Moderator** | Edit translations, approve/reject in review queue |
| **Translator** | Edit translations, mark as reviewed (cannot approve) |

---

## Recommended Workflows

### New project from scratch

```bash
# 1. Install
npm install i18n-dashboard --save-dev

# 2. Initialize
npx i18n-dashboard init

# 3. Start
npx i18n-dashboard start

# 4. In the UI:
#    - Add languages (Languages tab)
#    - Add translation keys (Translations tab)
#    - Use the API in your Vue app
```

### Migrate from existing JSON files

```bash
# 1. Install and initialize
npm install i18n-dashboard --save-dev
npx i18n-dashboard init

# 2. Start
npx i18n-dashboard start

# 3. Sync your existing locale files
npx i18n-dashboard sync

# 4. All keys and translations are now in the database
```

### Team workflow with review

1. **Translators** edit keys → status: `Draft`
2. **Translators** mark ready → status: `Reviewed`
3. **Moderators/Admins** approve → status: `Approved`
4. Only `Approved` translations are exported (or all, depending on your needs)

### Move between environments (local → production)

```bash
# On local machine: export snapshot
# Dashboard UI → Settings → Snapshot → Export

# On production server: import snapshot
# Dashboard UI → Settings → Snapshot → Import (Merge or Replace mode)
```

---

## Stack

| Technology | Version | Role |
|---|---|---|
| [Nuxt 3](https://nuxt.com/) | 3.21+ | Full-stack framework (Nitro backend + Vue 3 frontend) |
| [Nuxt UI](https://ui.nuxt.com/) | 3.3+ | UI components (Tailwind CSS v4 + Reka UI) |
| [Knex.js](https://knexjs.org/) | 3.x | Multi-database abstraction |
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | 11.x | SQLite driver |
| [@vitalets/google-translate-api](https://github.com/vitalets/google-translate-api) | 9.x | Google Translate (free tier) |
| [Commander.js](https://github.com/tj/commander.js) | 13.x | CLI |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | 2.x | Password hashing |

---

## Contributing

Contributions are welcome. Please open an issue before submitting a pull request for significant changes.

```bash
git clone https://github.com/arnaudprioul/i18n-dashboard.git
cd i18n-dashboard
npm install

# Register the project git hooks (one-time, per clone)
git config core.hooksPath .githooks
```

### Commit message convention

Every push to `main` must include at least one commit message with a version bump indicator:

| Indicator | Bump | Example |
|---|---|---|
| `[patch]` | `0.3.8 → 0.3.9` | `fix: correct typo in error message [patch]` |
| `[minor]` | `0.3.8 → 0.4.0` | `feat: add git scan mode [minor]` |
| `[major]` | `0.3.8 → 1.0.0` | `feat!: breaking API change [major]` |

The pre-push hook will block the push if:
- No `[major]`, `[minor]`, or `[patch]` indicator is found in the commits
- `README.md` has not been updated

If both checks pass, the CI automatically bumps `package.json`, creates the git tag, and triggers the npm publish workflow.

---

## License

[MIT](./LICENSE)
