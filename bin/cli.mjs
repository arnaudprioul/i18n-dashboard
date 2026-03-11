#!/usr/bin/env node
import { spawn } from 'child_process'
import { Command } from 'commander'
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs'
import { resolve } from 'path'
import { tmpdir } from 'os'

import { _dirname } from '../consts/commons.const.ts'
import { buildEnv, loadUserConfig } from '../utils/config.util.ts'

const packageRoot = resolve(_dirname, '..')

const program = new Command()

program
    .name('i18n-dashboard')
    .description('Dashboard to manage vue-i18n translation keys')
    .version(JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf-8')).version)

// PID file stored per working directory (hashed to avoid conflicts)
function getPidFile() {
    const cwd = process.cwd().replace(/[/\\:]/g, '_')
    return resolve(tmpdir(), `i18n-dashboard_${cwd}.pid`)
}

// ── start ──────────────────────────────────────────────────────────────────
program
    .command('start')
    .description('Start the i18n dashboard server')
    .option('-p, --port <port>', 'Port to listen on (default: 3333)')
    .option('--host <host>', 'Host to listen on (default: localhost)')
    .option('-d, --detach', 'Run in background (detached)')
    .action(async (options) => {
        const userConfig = await loadUserConfig()
        const env = buildEnv(userConfig)

        if (options.port) env.I18N_PORT = options.port
        if (options.host) env.I18N_HOST = options.host

        const port = env.I18N_PORT || '3333'
        const host = env.I18N_HOST || 'localhost'

        console.log(`\n🌐 Starting vue-i18n-dashboard on http://${host}:${port}`)
        console.log(`📁 Project root: ${env.I18N_PROJECT_ROOT}\n`)

        const outputDir = resolve(packageRoot, '.output')
        const isBuilt = existsSync(resolve(outputDir, 'server/index.mjs'))

        let proc
        if (isBuilt) {
            proc = spawn('node', [resolve(outputDir, 'server/index.mjs')], {
                env: { ...env, PORT: port, HOST: host },
                stdio: options.detach ? 'ignore' : 'inherit',
                cwd: packageRoot,
                detached: options.detach || false,
            })
        } else {
            proc = spawn('npx', ['nuxt', 'dev', '--port', port, '--host', host], {
                env,
                stdio: options.detach ? 'ignore' : 'inherit',
                cwd: packageRoot,
                detached: options.detach || false,
            })
        }

        // Save PID for stop command
        const pidFile = getPidFile()
        writeFileSync(pidFile, String(proc.pid))

        if (options.detach) {
            proc.unref()
            console.log(`✅ Dashboard started in background (PID: ${proc.pid})`)
            console.log(`   Stop it with: vue-i18n-dashboard stop\n`)
        } else {
            proc.on('exit', (code) => {
                if (existsSync(pidFile)) unlinkSync(pidFile)
                process.exit(code ?? 0)
            })
            // Clean up PID on SIGINT
            process.on('SIGINT', () => {
                if (existsSync(pidFile)) unlinkSync(pidFile)
                proc.kill('SIGINT')
            })
        }
    })

// ── stop ───────────────────────────────────────────────────────────────────
program
    .command('stop')
    .description('Stop the i18n dashboard server')
    .option('-p, --port <port>', 'Port the server is running on (default: 3333)')
    .action(async (options) => {
        const pidFile = getPidFile()

        if (existsSync(pidFile)) {
            const pid = parseInt(readFileSync(pidFile, 'utf-8').trim())
            try {
                process.kill(pid, 'SIGTERM')
                unlinkSync(pidFile)
                console.log(`\n✅ Dashboard stopped (PID: ${pid})\n`)
            } catch (e) {
                if (e.code === 'ESRCH') {
                    console.log('\nProcess was already stopped.')
                } else {
                    console.error('Could not stop process:', e.message)
                }
                if (existsSync(pidFile)) unlinkSync(pidFile)
            }
            return
        }

        // Fallback: try to kill by port using lsof (macOS/Linux)
        const port = options.port || process.env.I18N_PORT || '3333'
        console.log(`\nNo PID file found. Trying to find process on port ${port}...`)
        const lsof = spawn('lsof', ['-ti', `tcp:${port}`], { stdio: ['ignore', 'pipe', 'ignore'] })
        let pids = ''
        lsof.stdout.on('data', (d) => { pids += d.toString() })
        lsof.on('close', () => {
            const found = pids.trim().split('\n').filter(Boolean)
            if (!found.length) {
                console.log('No dashboard process found on that port.\n')
                return
            }
            for (const p of found) {
                try {
                    process.kill(parseInt(p), 'SIGTERM')
                    console.log(`✅ Killed PID ${p}\n`)
                } catch (_) {}
            }
        })
    })

// ── build ──────────────────────────────────────────────────────────────────
program
    .command('build')
    .description('Build the dashboard for production (run once after install)')
    .action(async () => {
        console.log('\n🔨 Building vue-i18n-dashboard for production...\n')
        const proc = spawn('npx', ['nuxt', 'build'], {
            env: process.env,
            stdio: 'inherit',
            cwd: packageRoot,
        })
        proc.on('exit', (code) => {
            if (code === 0) {
                console.log('\n✅ Build complete!')
                console.log('   Run "vue-i18n-dashboard start" to launch the dashboard.\n')
            } else {
                console.error('\n❌ Build failed.\n')
            }
            process.exit(code ?? 0)
        })
    })

// ── init ───────────────────────────────────────────────────────────────────
program
    .command('init')
    .description('Initialize configuration file interactively')
    .option('--db <client>', 'Database client: sqlite3 (default), postgresql, mysql')
    .action(async (options) => {
        const { createInterface } = await import('readline')
        const rl = createInterface({ input: process.stdin, output: process.stdout })
        const question = (q) => new Promise((resolve) => rl.question(q, resolve))

        console.log('\nvue-i18n-dashboard — Initialisation\n')

        const dbClient = options.db || await question('Base de données [sqlite3/postgresql/mysql] (défaut: sqlite3): ') || 'sqlite3'
        const localesPath = await question('Dossier des locales (défaut: src/locales): ') || 'src/locales'
        const keySeparator = await question('Séparateur de clés (défaut: .): ') || '.'

        let configContent = `// i18n-dashboard.config.js
export default {
  port: 3333,
  // projectRoot: './',        // Chemin absolu ou relatif vers votre projet Vue
  localesPath: '${localesPath}',  // Relatif à projectRoot
  keySeparator: '${keySeparator}',
  apiPath: '/locale/[lang].json',

`

        if (dbClient === 'sqlite3' || dbClient === 'better-sqlite3') {
            const dbPath = await question('Chemin de la base SQLite (défaut: ./i18n-dashboard.db): ') || './i18n-dashboard.db'
            configContent += `  database: {
    client: 'better-sqlite3',
    connection: '${dbPath}',
  },

`
        } else if (dbClient === 'postgresql' || dbClient === 'pg') {
            const host = await question('Host PostgreSQL (défaut: localhost): ') || 'localhost'
            const port = await question('Port PostgreSQL (défaut: 5432): ') || '5432'
            const user = await question('Utilisateur PostgreSQL: ')
            const password = await question('Mot de passe PostgreSQL: ')
            const database = await question('Base de données (défaut: i18n_dashboard): ') || 'i18n_dashboard'
            configContent += `  database: {
    client: 'pg',
    connection: {
      host: '${host}',
      port: ${port},
      user: '${user}',
      password: '${password}',
      database: '${database}',
    },
  },

`
        } else if (dbClient === 'mysql' || dbClient === 'mysql2') {
            const host = await question('Host MySQL (défaut: localhost): ') || 'localhost'
            const port = await question('Port MySQL (défaut: 3306): ') || '3306'
            const user = await question('Utilisateur MySQL: ')
            const password = await question('Mot de passe MySQL: ')
            const database = await question('Base de données (défaut: i18n_dashboard): ') || 'i18n_dashboard'
            configContent += `  database: {
    client: 'mysql2',
    connection: {
      host: '${host}',
      port: ${port},
      user: '${user}',
      password: '${password}',
      database: '${database}',
    },
  },

`
        }

        const googleApiKey = await question('Clé API Google Translate (optionnel, laisser vide pour le tier gratuit): ')
        if (googleApiKey) {
            configContent += `  googleTranslate: {
    apiKey: '${googleApiKey}',
  },

`
        }

        configContent += `}`

        writeFileSync(resolve(process.cwd(), 'i18n-dashboard.config.js'), configContent)

        console.log('\n✅ Fichier de configuration créé : i18n-dashboard.config.js')
        console.log('   Lancez le dashboard avec : vue-i18n-dashboard start\n')

        rl.close()
    })

// ── sync (CLI shortcut) ────────────────────────────────────────────────────
program
    .command('sync')
    .description('Sync JSON locale files to the database (dashboard must be running)')
    .option('-p, --port <port>', 'Port the dashboard is running on (default: 3333)')
    .action(async (options) => {
        const port = options.port || process.env.I18N_PORT || '3333'
        console.log(`\nSyncing locale files via http://localhost:${port}...`)
        try {
            // We need the project_id — fetch projects first
            const projectsRes = await fetch(`http://localhost:${port}/api/projects`)
            const projects = await projectsRes.json()
            if (!projects?.length) {
                console.error('No projects found. Add a project first via the dashboard UI.\n')
                return
            }
            // Use the first project (or the one matching CWD)
            const cwd = process.cwd()
            const project = projects.find((p) => p.root_path === cwd) || projects[0]
            console.log(`Using project: ${project.name} (${project.root_path})`)

            const res = await fetch(`http://localhost:${port}/api/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project_id: project.id }),
            })
            const data = await res.json()
            console.log(`✅ Sync done: ${data.added} ajoutées · ${data.updated} mises à jour · ${data.total} total\n`)
        } catch (e) {
            console.error('Could not connect to dashboard. Is it running?\n  vue-i18n-dashboard start\n')
        }
    })

program.parse()
