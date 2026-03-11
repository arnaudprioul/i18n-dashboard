// i18n-dashboard.config.js - Copy this file to your project root
export default {
  // Port on which the dashboard will run
  port: 3333,

  // Character used to separate nested keys (e.g. 'home.title' uses '.')
  keySeparator: '.',

  // URL path for serving locale JSON files
  // [lang] will be replaced with the language code
  apiPath: '/locale/[lang].json',

  // Path to your project's locale files (relative to project root)
  // The dashboard will use this for syncing keys
  projectRoot: './',

  // Database configuration
  database: {
    // Options: 'better-sqlite3' (default), 'pg' (PostgreSQL), 'mysql2' (MySQL)
    client: 'better-sqlite3',

    // For SQLite: path to the database file
    connection: './i18n-dashboard.db',

    // For PostgreSQL or MySQL, use an object instead:
    // connection: {
    //   host: 'localhost',
    //   port: 5432,       // or 3306 for MySQL
    //   user: 'myuser',
    //   password: 'mypassword',
    //   database: 'i18n_dashboard',
    // },
  },

  // Optional: Google Translate API key
  // Leave empty to use the free tier (no API key required)
  // googleTranslate: {
  //   apiKey: process.env.GOOGLE_TRANSLATE_API_KEY,
  // },
}
