# Documentation

## Installation

```bash
npm install i18n-dashboard --save-dev
```

or

```bash
npm install -g i18n-dashboard --save-dev
```

---

## CLI

```bash
i18n-dashboard start
i18n-dashboard init
i18n-dashboard sync
```

---

## Configuration

Example:

```js
export default {
  port: 3333,
  keySeparator: '.',
  apiPath: '/locale/[lang].json'
}
```

---

## API

### Get locale

```
GET /locale/:lang.json?project_id=1
```

---

## Database

Supports:

- SQLite (default)
- PostgreSQL
- MySQL

---

## Features

- Translation editor
- Auto-translate
- History
- Roles & permissions
- Git sync
- Multi-project support

---

## Notes

- Works with vue-i18n
- No migration required
