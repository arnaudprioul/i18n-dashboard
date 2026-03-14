import knex, { type Knex } from 'knex'
import { resolve, basename } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { useRuntimeConfig } from '#imports'

import { OVERRIDE_FILE } from '../consts/db.const'
import { _dirname } from '../../consts/commons.const'

let _db: Knex | null = null

function readOverride(): Record<string, string> | null {
  if (existsSync(OVERRIDE_FILE)) {
    try { return JSON.parse(readFileSync(OVERRIDE_FILE, 'utf-8')) } catch { /* ignore */ }
  }
  return null
}

function buildConnectionFromParams(params: {
  dbClient: string
  dbConnection?: string
  dbHost?: string
  dbPort?: string
  dbUser?: string
  dbPassword?: string
  dbName?: string
}): Knex.Config {
  const client = params.dbClient || 'better-sqlite3'

  if (client === 'better-sqlite3' || client === 'sqlite3') {
    const dbPath = params.dbConnection || './i18n-dashboard.db'
    const resolvedPath = dbPath.startsWith('.') ? resolve(process.cwd(), dbPath) : dbPath
    return {
      client: 'better-sqlite3',
      connection: { filename: resolvedPath },
      useNullAsDefault: true,
    }
  }

  if (client === 'pg' || client === 'postgresql') {
    return {
      client: 'pg',
      connection: {
        host: params.dbHost,
        port: parseInt(params.dbPort || '5432'),
        user: params.dbUser,
        password: params.dbPassword,
        database: params.dbName,
      },
    }
  }

  if (client === 'mysql2' || client === 'mysql') {
    return {
      client: 'mysql2',
      connection: {
        host: params.dbHost,
        port: parseInt(params.dbPort || '3306'),
        user: params.dbUser,
        password: params.dbPassword,
        database: params.dbName,
      },
    }
  }

  throw new Error(`Unsupported database client: ${client}`)
}

function buildConnection(config: ReturnType<typeof useRuntimeConfig>): Knex.Config {
  const override = readOverride()
  const params = {
    dbClient: (override?.dbClient || config.dbClient || 'better-sqlite3') as string,
    dbConnection: (override?.dbConnection || config.dbConnection) as string | undefined,
    dbHost: (override?.dbHost || config.dbHost) as string | undefined,
    dbPort: (override?.dbPort || config.dbPort) as string | undefined,
    dbUser: (override?.dbUser || config.dbUser) as string | undefined,
    dbPassword: (override?.dbPassword || config.dbPassword) as string | undefined,
    dbName: (override?.dbName || config.dbName) as string | undefined,
  }
  return buildConnectionFromParams(params)
}

export function getDb(): Knex {
  if (_db) return _db
  const config = useRuntimeConfig()
  _db = knex(buildConnection(config))
  return _db
}

export async function resetDb(knexConfig: Knex.Config): Promise<void> {
  if (_db) {
    await _db.destroy()
    _db = null
  }
  _db = knex(knexConfig)
  await initDb()
}

export function saveDbOverride(override: Record<string, string>): void {
  writeFileSync(OVERRIDE_FILE, JSON.stringify(override, null, 2))
}

export { buildConnectionFromParams }

// Helper: safely add a column only if it doesn't exist yet
async function addColumnIfMissing(db: Knex, tableName: string, columnName: string, addFn: (table: any) => void) {
  try {
    const exists = await db.schema.hasColumn(tableName, columnName)
    if (!exists) {
      await db.schema.table(tableName, addFn)
    }
  } catch (e: any) {
    if (!e.message?.includes('duplicate column') && !e.message?.includes('already exists')) {
      throw e
    }
  }
}

// Reads a dashboard-ui locale JSON file bundled with the package
function readLocaleFile(lang: string): Record<string, string> {
  const candidates = [
    resolve(process.cwd(), `assets/locales/${lang}.json`),
    resolve(_dirname, `../../assets/locales/${lang}.json`),
    resolve(_dirname, `../assets/locales/${lang}.json`),
  ]
  for (const p of candidates) {
    if (existsSync(p)) {
      try { return JSON.parse(readFileSync(p, 'utf-8')) } catch { /* ignore */ }
    }
  }
  return {}
}

// Dashboard UI strings seeded into the system project (FR default + EN)
const DASHBOARD_UI_STRINGS: Array<{ key: string; fr: string; en: string }> = [
  // Navigation
  { key: 'nav.dashboard', fr: 'Dashboard', en: 'Dashboard' },
  { key: 'nav.translations', fr: 'Traductions', en: 'Translations' },
  { key: 'nav.unused', fr: 'Inutilisées', en: 'Unused' },
  { key: 'nav.languages', fr: 'Langues', en: 'Languages' },
  { key: 'nav.review', fr: 'À réviser', en: 'Review' },
  { key: 'nav.settings', fr: 'Paramètres', en: 'Settings' },
  { key: 'nav.users', fr: 'Utilisateurs', en: 'Users' },
  // Sidebar
  { key: 'sidebar.project_label', fr: 'PROJET', en: 'PROJECT' },
  { key: 'sidebar.no_project', fr: 'Aucun projet configuré', en: 'No project configured' },
  { key: 'sidebar.add_project', fr: 'Ajouter un projet', en: 'Add a project' },
  { key: 'sidebar.manage_projects', fr: 'Gérer les projets', en: 'Manage projects' },
  { key: 'sidebar.scan', fr: 'Scanner le projet', en: 'Scan project' },
  { key: 'sidebar.sync', fr: 'Sync JSON', en: 'Sync JSON' },
  { key: 'sidebar.no_project_selected', fr: 'Sélectionnez un projet pour commencer', en: 'Select a project to get started' },
  { key: 'sidebar.theme', fr: 'Thème', en: 'Theme' },
  { key: 'sidebar.ui_lang', fr: 'Langue interface', en: 'UI Language' },
  // Project empty state
  { key: 'project.none_selected', fr: 'Aucun projet sélectionné', en: 'No project selected' },
  { key: 'project.none_selected_hint', fr: 'Ajoutez votre projet Vue.js pour commencer à gérer vos traductions.', en: 'Add your Vue.js project to start managing your translations.' },
  { key: 'project.add_button', fr: 'Ajouter un projet', en: 'Add a project' },
  // User menu
  { key: 'user.super_admin', fr: 'Super Admin', en: 'Super Admin' },
  { key: 'user.role_user', fr: 'Utilisateur', en: 'User' },
  { key: 'user.profile', fr: 'Mon profil', en: 'My profile' },
  { key: 'user.change_password', fr: 'Changer le mot de passe', en: 'Change password' },
  { key: 'user.logout', fr: 'Se déconnecter', en: 'Log out' },
  { key: 'user.change_password_title', fr: 'Changer le mot de passe', en: 'Change password' },
  { key: 'user.current_password', fr: 'Mot de passe actuel', en: 'Current password' },
  { key: 'user.new_password', fr: 'Nouveau mot de passe', en: 'New password' },
  { key: 'user.confirm_password', fr: 'Confirmer', en: 'Confirm' },
  { key: 'user.password_hint', fr: 'Minimum 8 caractères', en: 'Minimum 8 characters' },
  { key: 'user.save_password', fr: 'Modifier', en: 'Save' },
  { key: 'user.password_changed', fr: 'Mot de passe modifié', en: 'Password changed' },
  // Translations page
  { key: 'translations.title', fr: 'Traductions', en: 'Translations' },
  { key: 'translations.keys_count', fr: 'clés', en: 'keys' },
  { key: 'translations.langs_count', fr: 'langues', en: 'languages' },
  { key: 'translations.search', fr: 'Rechercher une clé...', en: 'Search for a key...' },
  { key: 'translations.add_key', fr: 'Nouvelle clé', en: 'New key' },
  { key: 'translations.translate_all', fr: 'Traduire tout', en: 'Translate all' },
  { key: 'translations.no_results', fr: 'Aucune clé trouvée', en: 'No keys found' },
  { key: 'translations.no_results_hint', fr: 'Essayez un autre terme de recherche.', en: 'Try a different search term.' },
  { key: 'translations.add_description', fr: 'Ajouter une description…', en: 'Add a description…' },
  { key: 'translations.click_to_add', fr: 'Cliquer pour ajouter...', en: 'Click to add...' },
  { key: 'translations.save', fr: 'Sauvegarder', en: 'Save' },
  { key: 'translations.cancel', fr: 'Annuler', en: 'Cancel' },
  { key: 'translations.add_key_title', fr: 'Nouvelle clé de traduction', en: 'New translation key' },
  { key: 'translations.key_label', fr: 'Clé', en: 'Key' },
  { key: 'translations.key_hint', fr: 'Exemple: home.title ou nav.menu.about', en: 'Example: home.title or nav.menu.about' },
  { key: 'translations.description_label', fr: 'Description', en: 'Description' },
  { key: 'translations.description_hint', fr: 'Contexte pour les traducteurs', en: 'Context for translators' },
  { key: 'translations.create', fr: 'Créer', en: 'Create' },
  { key: 'translations.delete_key', fr: 'Supprimer la clé', en: 'Delete key' },
  { key: 'translations.key_deleted', fr: 'Clé supprimée', en: 'Key deleted' },
  { key: 'translations.history', fr: 'Historique par langue', en: 'History by language' },
  { key: 'translations.references', fr: 'référence', en: 'reference' },
  { key: 'translations.references_plural', fr: 'références', en: 'references' },
  // Status
  { key: 'status.all', fr: 'Tout', en: 'All' },
  { key: 'status.draft', fr: 'Brouillon', en: 'Draft' },
  { key: 'status.reviewed', fr: 'Relu', en: 'Reviewed' },
  { key: 'status.approved', fr: 'Approuvé', en: 'Approved' },
  { key: 'status.missing', fr: 'Manquant', en: 'Missing' },
  { key: 'status.unused', fr: 'Inutilisé', en: 'Unused' },
  { key: 'status.rejected', fr: 'Refusé', en: 'Rejected' },
  // Key detail page
  { key: 'key.rejected_notice', fr: 'Cette traduction a été refusée. Merci de la mettre à jour.', en: 'This translation was rejected. Please update it.' },
  { key: 'key.restore', fr: 'Restaurer', en: 'Restore' },
  // Review page
  { key: 'review.title', fr: 'File de révision', en: 'Review queue' },
  { key: 'review.approve_all', fr: 'Tout approuver', en: 'Approve all' },
  { key: 'review.empty_title', fr: 'Aucune traduction en attente', en: 'No translations pending' },
  { key: 'review.empty_hint', fr: 'Toutes les traductions relues ont déjà été approuvées.', en: 'All reviewed translations have already been approved.' },
  { key: 'review.approve', fr: 'Approuver', en: 'Approve' },
  { key: 'review.back_to_draft', fr: 'Repasser en brouillon', en: 'Back to draft' },
  { key: 'review.approved_toast', fr: 'Approuvées', en: 'Approved' },
  // Languages page
  { key: 'languages.title', fr: 'Langues', en: 'Languages' },
  { key: 'languages.subtitle', fr: 'Gérez les langues du projet', en: 'Manage project languages' },
  { key: 'languages.add', fr: 'Ajouter une langue', en: 'Add a language' },
  { key: 'languages.none', fr: 'Aucune langue configurée', en: 'No language configured' },
  { key: 'languages.none_hint', fr: 'Ajoutez des langues pour commencer à traduire.', en: 'Add languages to start translating.' },
  { key: 'languages.default_badge', fr: 'Défaut', en: 'Default' },
  // Settings
  { key: 'settings.title', fr: 'Paramètres', en: 'Settings' },
  { key: 'settings.save', fr: 'Sauvegarder', en: 'Save' },
  // Users
  { key: 'users.title', fr: 'Utilisateurs', en: 'Users' },
  { key: 'users.subtitle', fr: 'Gérez les accès au dashboard', en: 'Manage dashboard access' },
  { key: 'users.add', fr: 'Ajouter un utilisateur', en: 'Add a user' },
  { key: 'users.none', fr: 'Aucun utilisateur', en: 'No users' },
  { key: 'users.never_connected', fr: 'Jamais connecté', en: 'Never logged in' },
  { key: 'users.role_translator', fr: 'Traducteur', en: 'Translator' },
  { key: 'users.role_moderator', fr: 'Modérateur', en: 'Moderator' },
  { key: 'users.role_admin', fr: 'Admin', en: 'Admin' },
  { key: 'users.inactive', fr: 'Inactif', en: 'Inactive' },
  { key: 'users.no_role', fr: 'Aucun rôle', en: 'No role' },
  // Login
  { key: 'login.title', fr: 'Connexion', en: 'Log in' },
  { key: 'login.email', fr: 'Email', en: 'Email' },
  { key: 'login.password', fr: 'Mot de passe', en: 'Password' },
  { key: 'login.submit', fr: 'Se connecter', en: 'Sign in' },
  { key: 'login.error', fr: 'Identifiants incorrects', en: 'Invalid credentials' },
  // Setup
  { key: 'setup.title', fr: 'Configuration initiale', en: 'Initial setup' },
  { key: 'setup.submit', fr: 'Créer le compte administrateur', en: 'Create administrator account' },
  // Dashboard page
  { key: 'dashboard.title', fr: 'Dashboard', en: 'Dashboard' },
  { key: 'dashboard.total_keys', fr: 'clés totales', en: 'total keys' },
  { key: 'dashboard.unused_keys', fr: 'clés inutilisées', en: 'unused keys' },
  { key: 'dashboard.coverage', fr: 'couverture', en: 'coverage' },
  { key: 'dashboard.recent_activity', fr: 'Activité récente', en: 'Recent activity' },
  { key: 'dashboard.no_activity', fr: 'Aucune activité récente', en: 'No recent activity' },
  // Common
  { key: 'common.cancel', fr: 'Annuler', en: 'Cancel' },
  { key: 'common.save', fr: 'Sauvegarder', en: 'Save' },
  { key: 'common.delete', fr: 'Supprimer', en: 'Delete' },
  { key: 'common.add', fr: 'Ajouter', en: 'Add' },
  { key: 'common.edit', fr: 'Modifier', en: 'Edit' },
  { key: 'common.error', fr: 'Erreur', en: 'Error' },
  { key: 'common.close', fr: 'Fermer', en: 'Close' },
  { key: 'common.copied', fr: 'Copié !', en: 'Copied!' },
  { key: 'common.create', fr: 'Créer', en: 'Create' },
  // Onboarding
  { key: 'onboarding.title', fr: 'Bienvenue sur i18n Dashboard', en: 'Welcome to i18n Dashboard' },
  { key: 'onboarding.subtitle', fr: 'Configurons votre espace de travail en quelques étapes', en: 'Let\'s set up your workspace in a few steps' },
  { key: 'onboarding.step_admin', fr: 'Compte admin', en: 'Admin account' },
  { key: 'onboarding.step_languages', fr: 'Langues interface', en: 'UI Languages' },
  { key: 'onboarding.step_project', fr: 'Premier projet', en: 'First project' },
  { key: 'onboarding.step_done', fr: 'Terminé', en: 'Done' },
  { key: 'onboarding.admin_done', fr: 'Compte administrateur créé avec succès.', en: 'Administrator account created successfully.' },
  { key: 'onboarding.languages_title', fr: 'Langues de l\'interface', en: 'Interface languages' },
  { key: 'onboarding.languages_hint', fr: 'Sélectionnez les langues disponibles pour l\'interface du dashboard.', en: 'Select the available languages for the dashboard interface.' },
  { key: 'onboarding.languages_search', fr: 'Rechercher une langue...', en: 'Search for a language...' },
  { key: 'onboarding.languages_selected', fr: 'langue(s) sélectionnée(s)', en: 'language(s) selected' },
  { key: 'onboarding.languages_default', fr: 'Langue par défaut', en: 'Default language' },
  { key: 'onboarding.project_title', fr: 'Votre premier projet', en: 'Your first project' },
  { key: 'onboarding.project_hint', fr: 'Configurez le projet Vue.js que vous souhaitez gérer.', en: 'Configure the Vue.js project you want to manage.' },
  { key: 'onboarding.project_skip', fr: 'Passer cette étape', en: 'Skip this step' },
  { key: 'onboarding.done_title', fr: 'Tout est prêt !', en: 'All set!' },
  { key: 'onboarding.done_hint', fr: 'Votre dashboard est configuré. Vous pouvez maintenant gérer vos traductions.', en: 'Your dashboard is configured. You can now manage your translations.' },
  { key: 'onboarding.go_to_dashboard', fr: 'Aller au dashboard', en: 'Go to dashboard' },
  { key: 'onboarding.next', fr: 'Suivant', en: 'Next' },
  { key: 'onboarding.previous', fr: 'Précédent', en: 'Previous' },
  { key: 'onboarding.finish', fr: 'Terminer', en: 'Finish' },
  // Onboarding — DB step
  { key: 'onboarding.step_db', fr: 'Base de données', en: 'Database' },
  { key: 'onboarding.db_title', fr: 'Base de données', en: 'Database' },
  { key: 'onboarding.db_subtitle', fr: 'Configurez la connexion à votre base de données. Les valeurs sont pré-remplies depuis votre fichier de configuration.', en: 'Configure your database connection. Values are pre-filled from your config file.' },
  { key: 'onboarding.db_type_label', fr: 'Type de base de données', en: 'Database type' },
  { key: 'onboarding.db_type_sqlite', fr: 'SQLite (fichier local)', en: 'SQLite (local file)' },
  { key: 'onboarding.db_type_postgresql', fr: 'PostgreSQL', en: 'PostgreSQL' },
  { key: 'onboarding.db_type_mysql', fr: 'MySQL / MariaDB', en: 'MySQL / MariaDB' },
  { key: 'onboarding.db_file_label', fr: 'Fichier de base de données', en: 'Database file' },
  { key: 'onboarding.db_create_file', fr: 'Créer', en: 'Create' },
  { key: 'onboarding.db_file_found', fr: 'Fichier trouvé', en: 'File found' },
  { key: 'onboarding.db_file_missing', fr: 'Le fichier n\'existe pas encore. Cliquez sur « Créer » pour le créer.', en: 'The file does not exist yet. Click "Create" to create it.' },
  { key: 'onboarding.db_host', fr: 'Hôte', en: 'Host' },
  { key: 'onboarding.db_port', fr: 'Port', en: 'Port' },
  { key: 'onboarding.db_user', fr: 'Utilisateur', en: 'User' },
  { key: 'onboarding.db_password', fr: 'Mot de passe', en: 'Password' },
  { key: 'onboarding.db_name', fr: 'Base de données', en: 'Database name' },
  { key: 'onboarding.db_test', fr: 'Tester la connexion', en: 'Test connection' },
  { key: 'onboarding.db_test_apply', fr: 'Appliquer', en: 'Apply' },
  { key: 'onboarding.db_connected', fr: 'Connexion OK', en: 'Connection OK' },
]

async function ensureDashboardUIProject(db: Knex): Promise<void> {
  // Check if system project exists
  let systemProject = await db('projects').where({ is_system: true }).first()

  if (!systemProject) {
    const [id] = await db('projects').insert({
      name: 'Dashboard UI',
      root_path: '__DASHBOARD_UI__',
      locales_path: '',
      key_separator: '.',
      color: 'violet',
      description: 'Textes de l\'interface du dashboard — gérez les traductions de l\'UI ici.',
      is_system: true,
    })
    systemProject = { id }
    console.log('[i18n-dashboard] Projet système "Dashboard UI" créé.')
  }

  const projectId = systemProject.id

  // Load translations from JSON files (prefer file content over hardcoded fallback)
  const frFromFile = readLocaleFile('fr')
  const enFromFile = readLocaleFile('en')

  // Merge: JSON file takes priority over hardcoded array
  const frMap: Record<string, string> = {}
  const enMap: Record<string, string> = {}
  for (const item of DASHBOARD_UI_STRINGS) {
    frMap[item.key] = item.fr
    enMap[item.key] = item.en
  }
  Object.assign(frMap, frFromFile)
  Object.assign(enMap, enFromFile)

  // All keys from both sources
  const allKeys = [...new Set([...Object.keys(frMap), ...Object.keys(enMap)])]

  // Seed EN as the base language (translations for other languages are added via onboarding/auto-translate)
  for (const lang of [{ code: 'en', name: 'English', isDefault: true }, { code: 'fr', name: 'Français', isDefault: false }]) {
    const exists = await db('languages').where({ project_id: projectId, code: lang.code }).first()
    if (!exists) {
      await db('languages').insert({
        project_id: projectId,
        code: lang.code,
        name: lang.name,
        is_default: lang.isDefault,
      })
    }
  }

  // Seed strings — idempotent: insert missing keys AND missing translations
  for (const key of allKeys) {
    let existingKey = await db('translation_keys').where({ project_id: projectId, key }).first()
    if (!existingKey) {
      const [keyId] = await db('translation_keys').insert({
        project_id: projectId,
        key,
        description: null,
        is_unused: false,
      })
      existingKey = { id: keyId }
    }

    // Ensure EN and FR translations exist (approved — these are the source of truth)
    for (const [langCode, value] of [['en', enMap[key]], ['fr', frMap[key]]] as [string, string][]) {
      if (!value) continue
      const existingTr = await db('translations')
        .where({ key_id: existingKey.id, language_code: langCode })
        .first()
      if (!existingTr) {
        await db('translations').insert({ key_id: existingKey.id, language_code: langCode, value, status: 'approved' })
      }
    }
  }
}

export async function initDb(): Promise<void> {
  const db = getDb()

  // ── projects ──────────────────────────────────────────────────────────
  const hasProjects = await db.schema.hasTable('projects')
  if (!hasProjects) {
    await db.schema.createTable('projects', (table) => {
      table.increments('id').primary()
      table.string('name', 200).notNullable()
      table.text('root_path').notNullable().defaultTo('') // absolute path to project root (empty if remote)
      table.text('source_url').nullable()              // remote URL for fetching locale JSON files
      table.string('locales_path', 500).defaultTo('src/locales') // relative to root_path
      table.string('key_separator', 10).defaultTo('.')
      table.string('color', 30).defaultTo('primary')  // UI accent color
      table.text('description').nullable()
      table.boolean('is_system').defaultTo(false)     // reserved for Dashboard UI project
      table.timestamp('created_at').defaultTo(db.fn.now())
    })
  }

  // ── languages ─────────────────────────────────────────────────────────
  const hasLanguages = await db.schema.hasTable('languages')
  if (!hasLanguages) {
    await db.schema.createTable('languages', (table) => {
      table.increments('id').primary()
      table.integer('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE')
      table.string('code', 35).notNullable() // BCP 47: up to 35 chars (e.g. zh-Hant-TW, sr-Latn-RS)
      table.string('name', 100).notNullable()
      table.boolean('is_default').defaultTo(false)
      table.timestamp('created_at').defaultTo(db.fn.now())
      table.unique(['project_id', 'code'])
    })
  }

  // ── translation_keys ──────────────────────────────────────────────────
  const hasKeys = await db.schema.hasTable('translation_keys')
  if (!hasKeys) {
    await db.schema.createTable('translation_keys', (table) => {
      table.increments('id').primary()
      table.integer('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE')
      table.string('key', 500).notNullable()
      table.text('description').nullable()
      table.boolean('is_unused').defaultTo(false)
      table.timestamp('last_scanned_at').nullable()
      table.timestamp('created_at').defaultTo(db.fn.now())
      table.timestamp('updated_at').defaultTo(db.fn.now())
      table.unique(['project_id', 'key'])
    })
  }

  // ── translations ──────────────────────────────────────────────────────
  const hasTranslations = await db.schema.hasTable('translations')
  if (!hasTranslations) {
    await db.schema.createTable('translations', (table) => {
      table.increments('id').primary()
      table.integer('key_id').notNullable().references('id').inTable('translation_keys').onDelete('CASCADE')
      table.string('language_code', 10).notNullable()
      table.text('value').nullable()
      table.string('status', 20).defaultTo('draft').nullable()
      table.timestamp('created_at').defaultTo(db.fn.now())
      table.timestamp('updated_at').defaultTo(db.fn.now())
      table.unique(['key_id', 'language_code'])
    })
  }

  // ── translation_history ───────────────────────────────────────────────
  const hasHistory = await db.schema.hasTable('translation_history')
  if (!hasHistory) {
    await db.schema.createTable('translation_history', (table) => {
      table.increments('id').primary()
      table.integer('translation_id').notNullable().references('id').inTable('translations').onDelete('CASCADE')
      table.text('old_value').nullable()
      table.text('new_value').nullable()
      table.string('changed_by', 100).defaultTo('user')
      table.timestamp('changed_at').defaultTo(db.fn.now())
    })
  }

  // ── key_usages ────────────────────────────────────────────────────────
  const hasKeyUsages = await db.schema.hasTable('key_usages')
  if (!hasKeyUsages) {
    await db.schema.createTable('key_usages', (table) => {
      table.increments('id').primary()
      table.integer('key_id').notNullable().references('id').inTable('translation_keys').onDelete('CASCADE')
      table.string('file_path', 1000).notNullable()
      table.integer('line_number').nullable()
      table.string('detected_function', 50).nullable()
      table.timestamp('scanned_at').defaultTo(db.fn.now())
      table.index(['key_id'])
    })
  }

  // ── users ──────────────────────────────────────────────────────────────
  const hasUsers = await db.schema.hasTable('users')
  if (!hasUsers) {
    await db.schema.createTable('users', (table) => {
      table.increments('id').primary()
      table.string('email', 255).notNullable().unique()
      table.string('name', 200).notNullable()
      table.string('password_hash', 255).notNullable()
      table.boolean('is_super_admin').defaultTo(false)
      table.boolean('is_active').defaultTo(true)
      table.timestamp('last_login_at').nullable()
      table.timestamp('created_at').defaultTo(db.fn.now())
    })
  }

  // ── user_project_roles ─────────────────────────────────────────────────
  // project_id = NULL → role applies to ALL projects (global user)
  const hasUserRoles = await db.schema.hasTable('user_project_roles')
  if (!hasUserRoles) {
    await db.schema.createTable('user_project_roles', (table) => {
      table.increments('id').primary()
      table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.integer('project_id').nullable().references('id').inTable('projects').onDelete('CASCADE')
      table.string('role', 20).notNullable().defaultTo('translator') // admin | moderator | translator
      table.timestamp('created_at').defaultTo(db.fn.now())
      table.unique(['user_id', 'project_id'])
    })
  }

  // ── settings (global) ─────────────────────────────────────────────────
  const hasSettings = await db.schema.hasTable('settings')
  if (!hasSettings) {
    await db.schema.createTable('settings', (table) => {
      table.string('key', 100).primary()
      table.text('value').nullable()
      table.timestamp('updated_at').defaultTo(db.fn.now())
    })
    await db('settings').insert([
      { key: 'scan_exclude', value: 'node_modules,dist,.nuxt,.output,.git' },
      { key: 'onboarding_completed', value: 'false' },
    ])
  }

  // ── migrations for existing databases ─────────────────────────────────
  // Add status column if missing (older DBs)
  await addColumnIfMissing(db, 'translations', 'status', (t) =>
    t.string('status', 20).defaultTo('draft').nullable(),
  )

  // ── migrate old schema: add project_id to languages / translation_keys ─
  // If tables exist but don't have project_id (pre-multi-project schema),
  // create a default project and assign all existing rows to it.
  const langHasProject = await db.schema.hasColumn('languages', 'project_id')
  const keysHasProject = await db.schema.hasColumn('translation_keys', 'project_id')

  if (!langHasProject || !keysHasProject) {
    // Ensure at least one project exists to assign rows to
    let defaultProjectId: number
    const firstProject = await db('projects').orderBy('id', 'asc').first()
    if (firstProject) {
      defaultProjectId = firstProject.id
    } else {
      const runtimeCfg = useRuntimeConfig()
      const root = (runtimeCfg.projectRoot as string || '').trim() || process.cwd()
      const [id] = await db('projects').insert({
        name: basename(root) || 'Projet par défaut',
        root_path: resolve(root),
        locales_path: (runtimeCfg.localesPath as string) || 'src/locales',
        key_separator: '.',
        color: 'primary',
      })
      defaultProjectId = id
      console.log(`[i18n-dashboard] Migration: projet par défaut créé (id=${defaultProjectId})`)
    }

    if (!langHasProject) {
      await db.schema.table('languages', (t) => t.integer('project_id').defaultTo(defaultProjectId))
      await db('languages').whereNull('project_id').update({ project_id: defaultProjectId })
      console.log('[i18n-dashboard] Migration: project_id ajouté à languages')
    }

    if (!keysHasProject) {
      await db.schema.table('translation_keys', (t) => t.integer('project_id').defaultTo(defaultProjectId))
      await db('translation_keys').whereNull('project_id').update({ project_id: defaultProjectId })
      console.log('[i18n-dashboard] Migration: project_id ajouté à translation_keys')
    }
  }

  // ── migration: is_system column on projects ────────────────────────────
  await addColumnIfMissing(db, 'projects', 'is_system', (t) =>
    t.boolean('is_system').defaultTo(false),
  )

  // ── migration: source_url column on projects ───────────────────────────
  await addColumnIfMissing(db, 'projects', 'source_url', (t) =>
    t.text('source_url').nullable(),
  )

  // ── migration: fallback_code on languages ─────────────────────────────
  await addColumnIfMissing(db, 'languages', 'fallback_code', (t) =>
    t.string('fallback_code', 35).nullable(),
  )

  // ── migration: enlarge languages.code for BCP 47 (PG / MySQL only) ─────
  // SQLite does not enforce VARCHAR length so no action needed there.
  {
    const client = (db.client as any)?.config?.client ?? ''
    if (client === 'pg' || client === 'postgresql') {
      try {
        await db.raw('ALTER TABLE languages ALTER COLUMN code TYPE varchar(35)')
      } catch { /* already 35 or wider */ }
    } else if (client === 'mysql2' || client === 'mysql') {
      try {
        await db.raw('ALTER TABLE languages MODIFY COLUMN code varchar(35) NOT NULL')
      } catch { /* already done */ }
    }
  }

  // ── auto-create default project from I18N_PROJECT_ROOT env var ────────
  // Only when explicitly passed by the CLI (not the empty default)
  const config = useRuntimeConfig()
  const projectRoot = (config.projectRoot as string || '').trim()
  if (projectRoot) {
    const resolvedRoot = resolve(projectRoot)
    const existing = await db('projects').where({ root_path: resolvedRoot }).first()
    if (!existing) {
      const projectName = basename(resolvedRoot) || 'Mon Projet'
      const localesPath = (config.localesPath as string) || 'src/locales'
      const keySep = (config.public?.keySeparator as string) || '.'
      await db('projects').insert({
        name: projectName,
        root_path: resolvedRoot,
        locales_path: localesPath,
        key_separator: keySep,
        color: 'primary',
      })
      console.log(`[i18n-dashboard] Projet auto-créé : "${projectName}" → ${resolvedRoot}`)
    }
  }

  // ── ensure onboarding_completed row exists (migration for older DBs) ───
  const onboardingRow = await db('settings').where({ key: 'onboarding_completed' }).first()
  if (!onboardingRow) {
    await db('settings').insert({ key: 'onboarding_completed', value: 'false' })
  }

  // ── ensure Dashboard UI system project exists with seeds ───────────────
  await ensureDashboardUIProject(db)

  // ── project_number_formats ─────────────────────────────────────────────
  const hasNumberFormats = await db.schema.hasTable('project_number_formats')
  if (!hasNumberFormats) {
    await db.schema.createTable('project_number_formats', (table) => {
      table.increments('id').primary()
      table.integer('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE')
      table.string('locale', 10).notNullable()
      table.string('name', 100).notNullable()
      table.text('options').notNullable().defaultTo('{}') // JSON Intl.NumberFormat options
      table.timestamp('created_at').defaultTo(db.fn.now())
      table.unique(['project_id', 'locale', 'name'])
    })
  }

  // ── project_datetime_formats ────────────────────────────────────────────
  const hasDatetimeFormats = await db.schema.hasTable('project_datetime_formats')
  if (!hasDatetimeFormats) {
    await db.schema.createTable('project_datetime_formats', (table) => {
      table.increments('id').primary()
      table.integer('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE')
      table.string('locale', 10).notNullable()
      table.string('name', 100).notNullable()
      table.text('options').notNullable().defaultTo('{}') // JSON Intl.DateTimeFormat options
      table.timestamp('created_at').defaultTo(db.fn.now())
      table.unique(['project_id', 'locale', 'name'])
    })
  }

  // ── project_modifiers ────────────────────────────────────────────────────
  const hasModifiers = await db.schema.hasTable('project_modifiers')
  if (!hasModifiers) {
    await db.schema.createTable('project_modifiers', (table) => {
      table.increments('id').primary()
      table.integer('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE')
      table.string('name', 100).notNullable()
      table.text('body').notNullable() // JS arrow function string e.g. "(str) => str.toUpperCase()"
      table.timestamp('created_at').defaultTo(db.fn.now())
      table.unique(['project_id', 'name'])
    })
  }

  // ── migration: enable_* columns on projects ──────────────────────────────
  await addColumnIfMissing(db, 'projects', 'enable_number_formats', (t) =>
    t.boolean('enable_number_formats').defaultTo(false),
  )
  await addColumnIfMissing(db, 'projects', 'enable_datetime_formats', (t) =>
    t.boolean('enable_datetime_formats').defaultTo(false),
  )
  await addColumnIfMissing(db, 'projects', 'enable_modifiers', (t) =>
    t.boolean('enable_modifiers').defaultTo(false),
  )

  // ── migration: git columns on projects ───────────────────────────────────
  await addColumnIfMissing(db, 'projects', 'git_url', (t) =>
    t.text('git_url').nullable(),
  )
  await addColumnIfMissing(db, 'projects', 'git_token', (t) =>
    t.text('git_token').nullable(),
  )
  await addColumnIfMissing(db, 'projects', 'git_branch', (t) =>
    t.text('git_branch').nullable(),
  )

  // ── migration: git_repos column on projects ──────────────────────────────
  // Stores a JSON array of { name, url, branch, token } objects
  await addColumnIfMissing(db, 'projects', 'git_repos', (t) =>
    t.text('git_repos').nullable(),
  )
}
