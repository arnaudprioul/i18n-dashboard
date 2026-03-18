import knex, { type Knex } from 'knex'
import { resolve, basename } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { useRuntimeConfig } from '#imports'

import { OVERRIDE_FILE } from '../consts/db.const'
import { __DIRNAME } from '../../consts/commons.const'

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
    resolve(__DIRNAME, `../../assets/locales/${lang}.json`),
    resolve(__DIRNAME, `../assets/locales/${lang}.json`),
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
  // ── Additional keys (auto-synced from en.json) ──────────────────────────────
  { key: 'nav.projects', fr: 'Projects', en: 'Projects' },
  { key: 'nav.all_projects', fr: 'All projects', en: 'All projects' },
  { key: 'nav.administration', fr: 'Administration', en: 'Administration' },
  { key: 'nav.format_numbers', fr: 'Number formats', en: 'Number formats' },
  { key: 'nav.format_dates', fr: 'Date formats', en: 'Date formats' },
  { key: 'nav.modifiers', fr: 'Modifiers', en: 'Modifiers' },
  { key: 'sidebar.scan_disabled_hint', fr: 'Requires a local path to be configured', en: 'Requires a local path to be configured' },
  { key: 'sidebar.sync_disabled_hint', fr: 'Requires a local path or a remote URL', en: 'Requires a local path or a remote URL' },
  { key: 'user.passwords_mismatch', fr: 'Passwords do not match', en: 'Passwords do not match' },
  { key: 'keys.created', fr: 'Key created', en: 'Key created' },
  { key: 'keys.deleted', fr: 'Key deleted', en: 'Key deleted' },
  { key: 'keys.description_updated', fr: 'Description updated', en: 'Description updated' },
  { key: 'keys.version_restored', fr: 'Version restored', en: 'Version restored' },
  { key: 'keys.translate_done', fr: 'Auto-translate complete', en: 'Auto-translate complete' },
  { key: 'keys.translated', fr: 'translated', en: 'translated' },
  { key: 'keys.skipped', fr: 'skipped', en: 'skipped' },
  { key: 'translations.history_by_lang', fr: 'History by language', en: 'History by language' },
  { key: 'translations.reference', fr: 'reference', en: 'reference' },
  { key: 'translations.unused_tooltip', fr: 'Key not found in source code', en: 'Key not found in source code' },
  { key: 'translations.insert_plural_sep', fr: 'Insert a plural form separator | (e.g. car | cars)', en: 'Insert a plural form separator | (e.g. car | cars)' },
  { key: 'translations.translate_to', fr: 'Translate to', en: 'Translate to' },
  { key: 'translations.no_source', fr: 'No source available', en: 'No source available' },
  { key: 'translations.translated', fr: 'Translated', en: 'Translated' },
  { key: 'translations.translate_error', fr: 'Google Translate error', en: 'Google Translate error' },
  { key: 'translations.status_missing', fr: 'Missing — click to add', en: 'Missing — click to add' },
  { key: 'translations.status_draft_approver', fr: 'Draft — click to mark as reviewed', en: 'Draft — click to mark as reviewed' },
  { key: 'translations.status_draft_translator', fr: 'Draft — click to mark as reviewed', en: 'Draft — click to mark as reviewed' },
  { key: 'translations.status_reviewed_approver', fr: 'Reviewed — click to approve', en: 'Reviewed — click to approve' },
  { key: 'translations.status_reviewed_translator', fr: 'Reviewed (approval reserved for moderators)', en: 'Reviewed (approval reserved for moderators)' },
  { key: 'translations.status_approved_approver', fr: 'Approved — click to revert to draft', en: 'Approved — click to revert to draft' },
  { key: 'translations.status_approved', fr: 'Approved', en: 'Approved' },
  { key: 'translations.line', fr: 'line', en: 'line' },
  { key: 'translations.delete_key_confirm', fr: 'Are you sure you want to delete this key?', en: 'Are you sure you want to delete this key?' },
  { key: 'translations.delete_key_warning', fr: 'This will permanently remove the key and all its translations.', en: 'This will permanently remove the key and all its translations.' },
  { key: 'review.marked_reviewed', fr: 'Marked as reviewed', en: 'Marked as reviewed' },
  { key: 'review.translations_reviewed', fr: 'translation(s) marked as reviewed', en: 'translation(s) marked as reviewed' },
  { key: 'review.pending_count', fr: '{count} translation pending review', en: '{count} translation pending review' },
  { key: 'review.pending_count_plural', fr: '{count} translations pending review', en: '{count} translations pending review' },
  { key: 'review.pending_label', fr: 'pending review', en: 'pending review' },
  { key: 'review.mark_all_reviewed', fr: 'Mark all as reviewed', en: 'Mark all as reviewed' },
  { key: 'review.reject', fr: 'Reject', en: 'Reject' },
  { key: 'review.mark_reviewed', fr: 'Mark as reviewed', en: 'Mark as reviewed' },
  { key: 'languages.deleted', fr: 'Language deleted', en: 'Language deleted' },
  { key: 'languages.translating', fr: 'Translating', en: 'Translating' },
  { key: 'languages.translate_done', fr: 'Translation complete', en: 'Translation complete' },
  { key: 'languages.with_errors', fr: 'with errors', en: 'with errors' },
  { key: 'settings.saved', fr: 'Settings saved', en: 'Settings saved' },
  { key: 'settings.root_path', fr: 'Root path', en: 'Root path' },
  { key: 'settings.locales_folder', fr: 'Locales folder', en: 'Locales folder' },
  { key: 'key.params_label', fr: 'Params:', en: 'Params:' },
  { key: 'key.escapes_label', fr: 'Escapes:', en: 'Escapes:' },
  { key: 'key.modifiers_label', fr: 'Modifiers:', en: 'Modifiers:' },
  { key: 'key.escape_at', fr: '@ → {\'@\'} — prevents link interpretation', en: '@ → {\'@\'} — prevents link interpretation' },
  { key: 'key.escape_open_brace', fr: '{ → {\'{\'} — prevents interpolation opening', en: '{ → {\'{\'} — prevents interpolation opening' },
  { key: 'key.escape_close_brace', fr: '} → {\'}\'} — prevents interpolation closing', en: '} → {\'}\'} — prevents interpolation closing' },
  { key: 'key.escape_dollar', fr: '$ → {\'$\'} — prevents modifier interpretation', en: '$ → {\'$\'} — prevents modifier interpretation' },
  { key: 'key.escape_pipe', fr: '| → {\'|\'} — literal pipe (≠ plural separator)', en: '| → {\'|\'} — literal pipe (≠ plural separator)' },
  { key: 'key.escape_backslash_open', fr: '\\{ — backslash escape (v11.3+), alternative to {\'{\'} ', en: '\\{ — backslash escape (v11.3+), alternative to {\'{\'} ' },
  { key: 'key.escape_backslash_close', fr: '\\} — backslash escape (v11.3+), alternative to {\'}\'}', en: '\\} — backslash escape (v11.3+), alternative to {\'}\'}' },
  { key: 'key.escape_backslash_at', fr: '\\@ — backslash escape (v11.3+), alternative to {\'@\'}', en: '\\@ — backslash escape (v11.3+), alternative to {\'@\'}' },
  { key: 'key.escape_backslash', fr: '\\\\ — literal backslash', en: '\\\\ — literal backslash' },
  { key: 'key.modifier_simple', fr: '@:key — inserts the value as-is', en: '@:key — inserts the value as-is' },
  { key: 'key.modifier_lower', fr: '@.lower:key — converts to lowercase', en: '@.lower:key — converts to lowercase' },
  { key: 'key.modifier_upper', fr: '@.upper:key — converts to UPPERCASE', en: '@.upper:key — converts to UPPERCASE' },
  { key: 'key.modifier_capitalize', fr: '@.capitalize:key — capitalizes first letter', en: '@.capitalize:key — capitalizes first letter' },
  { key: 'key.back_to_simple', fr: 'Back to simple text', en: 'Back to simple text' },
  { key: 'key.switch_to_plural', fr: 'Switch to plural mode', en: 'Switch to plural mode' },
  { key: 'key.forms', fr: 'forms', en: 'forms' },
  { key: 'key.plural', fr: 'Plural', en: 'Plural' },
  { key: 'key.plural_forms', fr: 'plural forms', en: 'plural forms' },
  { key: 'key.link_key_tooltip', fr: 'Link a key (@:key) with optional modifier', en: 'Link a key (@:key) with optional modifier' },
  { key: 'key.link_key_title', fr: 'Link a key', en: 'Link a key' },
  { key: 'key.link_modifier_label', fr: 'Render modifier', en: 'Render modifier' },
  { key: 'key.generated_syntax', fr: 'Generated syntax:', en: 'Generated syntax:' },
  { key: 'key.search_placeholder', fr: 'Search for a key...', en: 'Search for a key...' },
  { key: 'key.none_found', fr: 'No key found', en: 'No key found' },
  { key: 'key.key_placeholder', fr: 'key', en: 'key' },
  { key: 'plural.template_title', fr: 'Pluralization template', en: 'Pluralization template' },
  { key: 'plural.forms', fr: 'forms', en: 'forms' },
  { key: 'plural.implicit_params_title', fr: 'Implicit parameters:', en: 'Implicit parameters:' },
  { key: 'plural.and', fr: 'and', en: 'and' },
  { key: 'plural.implicit_params_hint', fr: 'are automatically available in any pluralized key — you don\'t need to pass them explicitly.', en: 'are automatically available in any pluralized key — you don\'t need to pass them explicitly.' },
  { key: 'plural.forms_title', fr: 'Forms', en: 'Forms' },
  { key: 'plural.remove', fr: 'Remove', en: 'Remove' },
  { key: 'plural.add_form', fr: 'Add a form', en: 'Add a form' },
  { key: 'plural.empty', fr: 'empty', en: 'empty' },
  { key: 'plural.selection_rule', fr: 'Selection rule: English rule by default (count=1 → form [1] for 2 forms, count=0 → [0], count=1 → [1], count≥2 → [2] for 3 forms).', en: 'Selection rule: English rule by default (count=1 → form [1] for 2 forms, count=0 → [0], count=1 → [1], count≥2 → [2] for 3 forms).' },
  { key: 'plural.raw_value', fr: 'Raw value:', en: 'Raw value:' },
  { key: 'plural.tpl_2_standard', fr: '2 forms — standard', en: '2 forms — standard' },
  { key: 'plural.tpl_2_langs', fr: 'English, German, Dutch…', en: 'English, German, Dutch…' },
  { key: 'plural.tpl_3_zero', fr: '3 forms — zero / one / many', en: '3 forms — zero / one / many' },
  { key: 'plural.tpl_3_langs', fr: 'French, Spanish, Italian…', en: 'French, Spanish, Italian…' },
  { key: 'plural.tpl_4_slavic', fr: '4 forms — Slavic languages', en: '4 forms — Slavic languages' },
  { key: 'plural.tpl_4_langs', fr: 'Russian, Polish, Ukrainian…', en: 'Russian, Polish, Ukrainian…' },
  { key: 'plural.tpl_custom', fr: 'Custom', en: 'Custom' },
  { key: 'plural.tpl_custom_hint', fr: 'Define your own forms', en: 'Define your own forms' },
  { key: 'plural.tpl_custom_preview', fr: 'form 1 | form 2 | …', en: 'form 1 | form 2 | …' },
  { key: 'plural.singular', fr: 'singular', en: 'singular' },
  { key: 'plural.plural_form', fr: 'plural', en: 'plural' },
  { key: 'plural.zero', fr: 'zero', en: 'zero' },
  { key: 'plural.few', fr: 'few', en: 'few' },
  { key: 'plural.form', fr: 'form', en: 'form' },
  { key: 'plural.others', fr: 'others', en: 'others' },
  { key: 'formats.preview', fr: 'Preview', en: 'Preview' },
  { key: 'formats.number_title', fr: 'Number formats', en: 'Number formats' },
  { key: 'formats.datetime_title', fr: 'Date & time formats', en: 'Date & time formats' },
  { key: 'formats.modifiers_title', fr: 'Modifiers', en: 'Modifiers' },
  { key: 'users.created', fr: 'User created', en: 'User created' },
  { key: 'users.invitation_sent', fr: 'Invitation sent to', en: 'Invitation sent to' },
  { key: 'users.access_updated', fr: 'Access updated', en: 'Access updated' },
  { key: 'users.deactivated', fr: 'User deactivated', en: 'User deactivated' },
  { key: 'users.reactivated', fr: 'User reactivated', en: 'User reactivated' },
  { key: 'users.deleted', fr: 'User deleted', en: 'User deleted' },
  { key: 'users.all_title', fr: 'All users', en: 'All users' },
  { key: 'users.project_members', fr: 'Project members', en: 'Project members' },
  { key: 'users.none_in_project', fr: 'No members in this project', en: 'No members in this project' },
  { key: 'users.add_user_title', fr: 'Add a user', en: 'Add a user' },
  { key: 'users.add_to_project_title', fr: 'Add a user to the project', en: 'Add a user to the project' },
  { key: 'users.add_to_project', fr: 'Add to project', en: 'Add to project' },
  { key: 'users.create_new_user', fr: 'Create a new user', en: 'Create a new user' },
  { key: 'users.back_to_select', fr: 'Back', en: 'Back' },
  { key: 'users.search_placeholder', fr: 'Search by name or email…', en: 'Search by name or email…' },
  { key: 'users.no_match', fr: 'No user matches your search', en: 'No user matches your search' },
  { key: 'users.all_already_members', fr: 'All users are already members of this project', en: 'All users are already members of this project' },
  { key: 'users.full_name', fr: 'Full name', en: 'Full name' },
  { key: 'users.role_label', fr: 'Role', en: 'Role' },
  { key: 'users.project_label', fr: 'Project', en: 'Project' },
  { key: 'users.temp_password_info', fr: 'A temporary password will be generated. Share it with the user so they can log in and change it.', en: 'A temporary password will be generated. Share it with the user so they can log in and change it.' },
  { key: 'users.temp_password_label', fr: 'Temporary password', en: 'Temporary password' },
  { key: 'users.edit_role_title', fr: 'Edit role', en: 'Edit role' },
  { key: 'users.role_in_project', fr: 'Role in this project', en: 'Role in this project' },
  { key: 'users.remove_user_title', fr: 'Remove user', en: 'Remove user' },
  { key: 'users.remove_confirm', fr: 'Are you sure you want to remove this user from the project?', en: 'Are you sure you want to remove this user from the project?' },
  { key: 'users.remove_from_project', fr: 'Remove from project', en: 'Remove from project' },
  { key: 'users.remove_account_kept', fr: 'The account will be kept, only the project access will be removed.', en: 'The account will be kept, only the project access will be removed.' },
  { key: 'users.remove_btn', fr: 'Remove', en: 'Remove' },
  { key: 'users.edit_role', fr: 'Edit role', en: 'Edit role' },
  { key: 'users.deactivate', fr: 'Deactivate', en: 'Deactivate' },
  { key: 'users.reactivate', fr: 'Reactivate', en: 'Reactivate' },
  { key: 'users.remove_from_project_action', fr: 'Remove from project', en: 'Remove from project' },
  { key: 'users.global_access', fr: 'Global access', en: 'Global access' },
  { key: 'users.global_access_label', fr: 'Global access', en: 'Global access' },
  { key: 'users.project_access_label', fr: 'Project access', en: 'Project access' },
  { key: 'users.manage_access_title', fr: 'Manage access', en: 'Manage access' },
  { key: 'users.manage_access', fr: 'Manage access', en: 'Manage access' },
  { key: 'users.delete_user_title', fr: 'Delete user', en: 'Delete user' },
  { key: 'users.delete_confirm', fr: 'Are you sure you want to delete this user?', en: 'Are you sure you want to delete this user?' },
  { key: 'users.delete_warning', fr: 'This action is irreversible. The account and all associated data will be permanently deleted.', en: 'This action is irreversible. The account and all associated data will be permanently deleted.' },
  { key: 'users.global_access_all', fr: 'All projects', en: 'All projects' },
  { key: 'users.no_access', fr: 'No access', en: 'No access' },
  { key: 'projects.created', fr: 'Project added', en: 'Project added' },
  { key: 'projects.updated', fr: 'Project updated', en: 'Project updated' },
  { key: 'projects.deleted', fr: 'Project deleted', en: 'Project deleted' },
  { key: 'projects.subtitle', fr: 'Manage your translation projects', en: 'Manage your translation projects' },
  { key: 'projects.add', fr: 'Add a project', en: 'Add a project' },
  { key: 'projects.none', fr: 'No project', en: 'No project' },
  { key: 'projects.none_hint', fr: 'Start by adding your first translation project.', en: 'Start by adding your first translation project.' },
  { key: 'projects.add_first', fr: 'Add my first project', en: 'Add my first project' },
  { key: 'projects.keys_stat', fr: 'keys', en: 'keys' },
  { key: 'projects.separator', fr: 'separator', en: 'separator' },
  { key: 'projects.git_repos_count', fr: 'git repo(s)', en: 'git repo(s)' },
  { key: 'projects.more_repos', fr: 'more repo(s)', en: 'more repo(s)' },
  { key: 'projects.no_description', fr: 'No description', en: 'No description' },
  { key: 'projects.name_taken', fr: 'This name is already taken', en: 'This name is already taken' },
  { key: 'projects.scan_requires_local', fr: 'Requires a local path or git repo', en: 'Requires a local path or git repo' },
  { key: 'projects.scan_tooltip', fr: 'Scan source files to detect translation keys', en: 'Scan source files to detect translation keys' },
  { key: 'projects.sync_requires_source', fr: 'Requires a local path or remote URL', en: 'Requires a local path or remote URL' },
  { key: 'projects.sync_tooltip', fr: 'Import locale JSON files into the database', en: 'Import locale JSON files into the database' },
  { key: 'projects.open', fr: 'Open', en: 'Open' },
  { key: 'projects.edit_modal_title', fr: 'Edit project', en: 'Edit project' },
  { key: 'projects.add_modal_title', fr: 'Add a project', en: 'Add a project' },
  { key: 'projects.name_label', fr: 'Project name', en: 'Project name' },
  { key: 'projects.name_placeholder', fr: 'My project', en: 'My project' },
  { key: 'projects.source_title', fr: 'Source', en: 'Source' },
  { key: 'projects.local_path_hint', fr: 'Absolute path to the project root on your file system', en: 'Absolute path to the project root on your file system' },
  { key: 'projects.local_path_label', fr: 'Local path', en: 'Local path' },
  { key: 'projects.remote_url_hint', fr: 'URL of the repository or locale files (optional)', en: 'URL of the repository or locale files (optional)' },
  { key: 'projects.remote_url_label', fr: 'Remote URL', en: 'Remote URL' },
  { key: 'projects.no_source_warning', fr: 'No source configured. Sync and scan will be unavailable.', en: 'No source configured. Sync and scan will be unavailable.' },
  { key: 'projects.local_active', fr: 'Local path active', en: 'Local path active' },
  { key: 'projects.remote_active', fr: 'Remote URL active', en: 'Remote URL active' },
  { key: 'projects.both_active', fr: 'Local + Remote active', en: 'Local + Remote active' },
  { key: 'projects.locales_path_hint', fr: 'Relative path from root to locale files folder', en: 'Relative path from root to locale files folder' },
  { key: 'projects.locales_path_label', fr: 'Locales folder', en: 'Locales folder' },
  { key: 'projects.key_separator_label', fr: 'Key separator', en: 'Key separator' },
  { key: 'projects.color_label', fr: 'Color', en: 'Color' },
  { key: 'projects.description_placeholder', fr: 'Short description…', en: 'Short description…' },
  { key: 'projects.locales_path_preview', fr: 'Preview:', en: 'Preview:' },
  { key: 'projects.delete_title', fr: 'Delete project', en: 'Delete project' },
  { key: 'projects.delete_confirm', fr: 'Are you sure you want to delete this project?', en: 'Are you sure you want to delete this project?' },
  { key: 'projects.delete_warning', fr: 'All keys, translations and languages will be permanently deleted.', en: 'All keys, translations and languages will be permanently deleted.' },
  { key: 'projects.color_blue', fr: 'Blue', en: 'Blue' },
  { key: 'projects.color_green', fr: 'Green', en: 'Green' },
  { key: 'projects.color_orange', fr: 'Orange', en: 'Orange' },
  { key: 'projects.color_red', fr: 'Red', en: 'Red' },
  { key: 'projects.color_purple', fr: 'Purple', en: 'Purple' },
  { key: 'projects.color_pink', fr: 'Pink', en: 'Pink' },
  { key: 'projects.color_yellow', fr: 'Yellow', en: 'Yellow' },
  { key: 'projects.color_gray', fr: 'Gray', en: 'Gray' },
  { key: 'projects.git_repo_title', fr: 'Git repository', en: 'Git repository' },
  { key: 'projects.step_source', fr: 'Source', en: 'Source' },
  { key: 'projects.step_info', fr: 'Info', en: 'Info' },
  { key: 'projects.step_languages', fr: 'Languages', en: 'Languages' },
  { key: 'projects.step_source_hint', fr: 'Enter a local path and/or a git repository to auto-detect project configuration.', en: 'Enter a local path and/or a git repository to auto-detect project configuration.' },
  { key: 'projects.detecting', fr: 'Detecting...', en: 'Detecting...' },
  { key: 'projects.detect_next', fr: 'Detect & Next', en: 'Detect & Next' },
  { key: 'projects.creating_languages', fr: 'Adding languages...', en: 'Adding languages...' },
  { key: 'projects.scanning_files', fr: 'Scanning source files...', en: 'Scanning source files...' },
  { key: 'projects.syncing_translations', fr: 'Syncing translations...', en: 'Syncing translations...' },
  { key: 'projects.no_source_hint', fr: 'Enter a local path or git repo URL to continue.', en: 'Enter a local path or git repo URL to continue.' },
  { key: 'projects.step_languages_hint', fr: 'Add the languages for this project. The first one will be set as default. You can add more later.', en: 'Add the languages for this project. The first one will be set as default. You can add more later.' },
  { key: 'languages.selected', fr: 'Selected languages', en: 'Selected languages' },
  { key: 'languages.set_as_default', fr: 'Set as default', en: 'Set as default' },
  { key: 'projects.git_repos_title', fr: 'Git repositories', en: 'Git repositories' },
  { key: 'projects.git_token_set', fr: 'token set', en: 'token set' },
  { key: 'projects.git_repo_url_label', fr: 'Repository URL', en: 'Repository URL' },
  { key: 'projects.git_repo_branch_label', fr: 'Branch', en: 'Branch' },
  { key: 'projects.git_repo_name_label', fr: 'Name (optional)', en: 'Name (optional)' },
  { key: 'projects.git_repo_name_placeholder', fr: 'e.g. frontend', en: 'e.g. frontend' },
  { key: 'projects.git_token_label', fr: 'Access token (optional)', en: 'Access token (optional)' },
  { key: 'projects.git_token_placeholder', fr: 'ghp_...', en: 'ghp_...' },
  { key: 'projects.git_add_btn', fr: 'Add repository', en: 'Add repository' },
  { key: 'profile.updated', fr: 'Account updated', en: 'Account updated' },
  { key: 'profile.access_updated', fr: 'Access updated', en: 'Access updated' },
  { key: 'profile.member_since', fr: 'Member since', en: 'Member since' },
  { key: 'profile.last_login', fr: 'Last login', en: 'Last login' },
  { key: 'profile.edit_account', fr: 'Edit account', en: 'Edit account' },
  { key: 'profile.projects_roles', fr: 'Projects & roles', en: 'Projects & roles' },
  { key: 'profile.no_roles', fr: 'No role assigned', en: 'No role assigned' },
  { key: 'profile.no_languages', fr: 'No languages', en: 'No languages' },
  { key: 'profile.no_translations', fr: 'No translations yet', en: 'No translations yet' },
  { key: 'profile.not_found', fr: 'User not found', en: 'User not found' },
  { key: 'profile.back', fr: 'Back', en: 'Back' },
  { key: 'profile.edit_modal_title', fr: 'Edit account', en: 'Edit account' },
  { key: 'profile.name_label', fr: 'Full name', en: 'Full name' },
  { key: 'profile.name_placeholder', fr: 'John Doe', en: 'John Doe' },
  { key: 'profile.stats_title', fr: 'Activity', en: 'Activity' },
  { key: 'profile.total_translations', fr: 'Total translations', en: 'Total translations' },
  { key: 'profile.period_1d', fr: 'Last 24 hours', en: 'Last 24 hours' },
  { key: 'profile.period_7d', fr: 'Last 7 days', en: 'Last 7 days' },
  { key: 'profile.period_30d', fr: 'Last 30 days', en: 'Last 30 days' },
  { key: 'profile.period_365d', fr: 'Last year', en: 'Last year' },
  { key: 'profile.period_all', fr: 'Since account creation', en: 'Since account creation' },
  { key: 'profile.general', fr: 'General', en: 'General' },
  { key: 'profile.name_email_required', fr: 'Name and email are required', en: 'Name and email are required' },
  { key: 'dashboard.hello', fr: 'Hello', en: 'Hello' },
  { key: 'dashboard.add_widget', fr: 'Add a widget', en: 'Add a widget' },
  { key: 'dashboard.configure_widget', fr: 'Configure widget', en: 'Configure widget' },
  { key: 'dashboard.data_source', fr: 'Data source', en: 'Data source' },
  { key: 'dashboard.specific_project', fr: 'Specific project', en: 'Specific project' },
  { key: 'dashboard.select_project', fr: 'Select a project', en: 'Select a project' },
  { key: 'dashboard.custom_title', fr: 'Custom title', en: 'Custom title' },
  { key: 'dashboard.default_title', fr: 'Default title', en: 'Default title' },
  { key: 'dashboard.edit', fr: 'Edit', en: 'Edit' },
  { key: 'dashboard.done', fr: 'Done', en: 'Done' },
  { key: 'dashboard.no_widgets', fr: 'No widgets', en: 'No widgets' },
  { key: 'dashboard.stat_total_keys', fr: 'Total keys', en: 'Total keys' },
  { key: 'dashboard.stat_coverage', fr: 'Coverage', en: 'Coverage' },
  { key: 'dashboard.stat_languages', fr: 'Languages', en: 'Languages' },
  { key: 'dashboard.stat_unused', fr: 'Unused', en: 'Unused' },
  { key: 'dashboard.languages_coverage', fr: 'Language coverage', en: 'Language coverage' },
  { key: 'dashboard.no_languages', fr: 'No language configured', en: 'No language configured' },
  { key: 'dashboard.missing', fr: 'missing', en: 'missing' },
  { key: 'common.errors', fr: 'errors', en: 'errors' },
  { key: 'common.or', fr: 'or', en: 'or' },
  { key: 'common.irreversible', fr: 'This action is irreversible.', en: 'This action is irreversible.' },
  { key: 'common.back', fr: 'Back', en: 'Back' },
  { key: 'common.next', fr: 'Next', en: 'Next' },
  { key: 'common.just_now', fr: 'just now', en: 'just now' },
  { key: 'common.ago', fr: 'ago', en: 'ago' },
  { key: 'onboarding.create_admin_hint', fr: 'This account will have full access to the dashboard.', en: 'This account will have full access to the dashboard.' },
  { key: 'onboarding.super_admin_role', fr: 'Super admin', en: 'Super admin' },
  { key: 'onboarding.create_admin_hint2', fr: 'You can create additional users later.', en: 'You can create additional users later.' },
  { key: 'onboarding.langs_will_be_translated', fr: 'Selected languages will be available for the dashboard interface.', en: 'Selected languages will be available for the dashboard interface.' },
  { key: 'onboarding.translating_in_progress', fr: 'Translation in progress…', en: 'Translation in progress…' },
  { key: 'onboarding.confirm_password', fr: 'Confirm password', en: 'Confirm password' },
  { key: 'onboarding.db_create_file_error', fr: 'Could not create database file.', en: 'Could not create database file.' },
  { key: 'onboarding.all_fields_required', fr: 'All fields are required.', en: 'All fields are required.' },
  { key: 'onboarding.password_min_length', fr: 'Password must be at least 8 characters.', en: 'Password must be at least 8 characters.' },
  { key: 'onboarding.passwords_mismatch', fr: 'Passwords do not match.', en: 'Passwords do not match.' },
  { key: 'onboarding.admin_creation_error', fr: 'Error creating administrator account.', en: 'Error creating administrator account.' },
  { key: 'onboarding.project_name_path_required', fr: 'Project name and path are required.', en: 'Project name and path are required.' },
  { key: 'onboarding.project_creation_error', fr: 'Error creating project.', en: 'Error creating project.' },
  { key: 'settings.snapshot_title', fr: 'Project snapshot', en: 'Project snapshot' },
  { key: 'settings.snapshot_hint', fr: 'Export a complete snapshot of this project (config, languages, all translation keys and values) as a single JSON file. Import it on any other instance to restore.', en: 'Export a complete snapshot of this project (config, languages, all translation keys and values) as a single JSON file. Import it on any other instance to restore.' },
  { key: 'settings.snapshot_export', fr: 'Export snapshot', en: 'Export snapshot' },
  { key: 'settings.snapshot_export_hint', fr: 'Full backup: config + languages + all keys', en: 'Full backup: config + languages + all keys' },
  { key: 'settings.snapshot_export_btn', fr: 'Export', en: 'Export' },
  { key: 'settings.snapshot_import', fr: 'Import snapshot', en: 'Import snapshot' },
  { key: 'settings.snapshot_import_hint', fr: 'Merge or replace the current project with an exported snapshot', en: 'Merge or replace the current project with an exported snapshot' },
  { key: 'settings.snapshot_import_btn', fr: 'Import', en: 'Import' },
  { key: 'settings.snapshot_mode_merge', fr: 'Merge', en: 'Merge' },
  { key: 'settings.snapshot_mode_replace', fr: 'Replace', en: 'Replace' },
  { key: 'settings.snapshot_replace_warning', fr: 'Replace mode: all existing keys and translations will be deleted before import.', en: 'Replace mode: all existing keys and translations will be deleted before import.' },
  { key: 'settings.snapshot_parse_error', fr: 'Invalid JSON file', en: 'Invalid JSON file' },
  { key: 'settings.snapshot_import_success', fr: 'Snapshot imported', en: 'Snapshot imported' },
  { key: 'settings.snapshot_import_error', fr: 'Import failed', en: 'Import failed' },
  { key: 'pathpicker.title', fr: 'Select a folder', en: 'Select a folder' },
  { key: 'pathpicker.empty', fr: 'No subfolder', en: 'No subfolder' },
  { key: 'pathpicker.select', fr: 'Select this folder', en: 'Select this folder' },
  { key: 'sync.toast_title', fr: 'Sync', en: 'Sync' },
  { key: 'sync.added', fr: 'added', en: 'added' },
  { key: 'sync.updated', fr: 'updated', en: 'updated' },
  { key: 'sync.total', fr: 'total', en: 'total' },
  { key: 'scan.toast_title', fr: 'Scan', en: 'Scan' },
  { key: 'scan.langs_added', fr: 'language(s) added', en: 'language(s) added' },
  { key: 'scan.modal_title', fr: 'Scan project', en: 'Scan project' },
  { key: 'scan.mode_local', fr: 'Local', en: 'Local' },
  { key: 'scan.mode_git', fr: 'Git repo', en: 'Git repo' },
  { key: 'scan.local_hint', fr: 'Select the root folder of your Vue.js project. The scanner will detect all $t(), t(), <i18n-t> and v-t usages.', en: 'Select the root folder of your Vue.js project. The scanner will detect all $t(), t(), <i18n-t> and v-t usages.' },
  { key: 'scan.local_path_label', fr: 'Project root folder', en: 'Project root folder' },
  { key: 'scan.git_hint', fr: 'Enter the URL of a Git repository. The dashboard will clone it and scan source files for translation keys.', en: 'Enter the URL of a Git repository. The dashboard will clone it and scan source files for translation keys.' },
  { key: 'scan.git_url_label', fr: 'Repository URL', en: 'Repository URL' },
  { key: 'scan.git_url_hint', fr: 'Example: https://github.com/user/my-app', en: 'Example: https://github.com/user/my-app' },
  { key: 'scan.git_branch_label', fr: 'Branch', en: 'Branch' },
  { key: 'scan.git_branch_hint', fr: 'Leave empty to use the default branch', en: 'Leave empty to use the default branch' },
  { key: 'scan.git_token_label', fr: 'Access token', en: 'Access token' },
  { key: 'scan.git_token_hint', fr: 'For private repositories', en: 'For private repositories' },
  { key: 'scan.git_save', fr: 'Save this repository to the project', en: 'Save this repository to the project' },
  { key: 'scan.git_saved', fr: 'Saved repositories', en: 'Saved repositories' },
  { key: 'scan.git_repo_name_label', fr: 'Repository name', en: 'Repository name' },
  { key: 'scan.git_repo_name_placeholder', fr: 'My App', en: 'My App' },
  { key: 'scan.results', fr: 'Results', en: 'Results' },
  { key: 'scan.keys_found', fr: 'keys found', en: 'keys found' },
  { key: 'scan.keys_added', fr: 'new keys', en: 'new keys' },
  { key: 'scan.unused', fr: 'unused', en: 'unused' },
  { key: 'scan.files_scanned', fr: 'files scanned', en: 'files scanned' },
  { key: 'scan.errors', fr: 'errors', en: 'errors' },
  { key: 'scan.run', fr: 'Scan', en: 'Scan' },
  { key: 'scan.translations_synced', fr: 'translations imported', en: 'translations imported' },
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

  // ── migration: approved_value column on translations ────────────────────
  // Stores the last approved value independently from the working `value`.
  // The locale JSON endpoint serves this column so that in-progress drafts
  // are never exposed to end-users; only explicitly approved content is published.
  await addColumnIfMissing(db, 'translations', 'approved_value', (t) =>
    t.text('approved_value').nullable(),
  )
  // Backfill: seed approved_value for translations that are already approved
  await db('translations')
    .where('status', 'approved')
    .whereNull('approved_value')
    .update({ approved_value: db.ref('value') })

  // ── refresh_tokens ────────────────────────────────────────────────────────
  const hasRefreshTokens = await db.schema.hasTable('refresh_tokens')
  if (!hasRefreshTokens) {
    await db.schema.createTable('refresh_tokens', (table) => {
      table.increments('id').primary()
      table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('token_hash', 64).notNullable() // SHA-256 hex of the raw token
      table.timestamp('expires_at').notNullable()
      table.timestamp('created_at').defaultTo(db.fn.now())
      table.index(['user_id'])
      table.index(['token_hash'])
    })
  }
}
