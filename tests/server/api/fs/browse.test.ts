// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock os.homedir() to a known, stable test path
vi.mock('os', async () => {
  const actual = await vi.importActual<typeof import('os')>('os')
  return { ...actual, homedir: vi.fn().mockReturnValue('/home/testuser'), tmpdir: vi.fn().mockReturnValue('/tmp') }
})

// Mock fs to simulate the existence of any path so the handler reaches the
// path-restriction check before hitting "file not found" errors.
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs')
  return {
    ...actual,
    existsSync: vi.fn().mockReturnValue(true),
    statSync: vi.fn().mockReturnValue({ isDirectory: () => true }),
    readdirSync: vi.fn().mockReturnValue([]),
  }
})

import handler from '~/server/api/fs/browse.get'

function makeEvent(path?: string) {
  return { _query: path ? { path } : {}, _headers: {}, _params: {} }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('fs/browse.get — path traversal protection', () => {
  // ── Blocked paths ─────────────────────────────────────────────────────────

  it('blocks access to /etc (sensitive system directory)', async () => {
    await expect((handler as Function)(makeEvent('/etc')))
      .rejects.toMatchObject({ statusCode: 403 })
  })

  it('blocks access to /etc/passwd', async () => {
    await expect((handler as Function)(makeEvent('/etc/passwd')))
      .rejects.toMatchObject({ statusCode: 403 })
  })

  it('blocks path traversal via ../ that escapes the home directory', async () => {
    // /home/testuser/../../etc normalises to /etc after resolve()
    await expect((handler as Function)(makeEvent('/home/testuser/../../etc')))
      .rejects.toMatchObject({ statusCode: 403 })
  })

  it('blocks access to another user\'s home directory', async () => {
    await expect((handler as Function)(makeEvent('/home/otheruser')))
      .rejects.toMatchObject({ statusCode: 403 })
  })

  it('blocks access to /var', async () => {
    await expect((handler as Function)(makeEvent('/var')))
      .rejects.toMatchObject({ statusCode: 403 })
  })

  it('does not expose the blocked path in the error message', async () => {
    await expect((handler as Function)(makeEvent('/etc/shadow')))
      .rejects.toMatchObject({ message: 'Access to this path is not allowed.' })
  })

  // ── Allowed paths ─────────────────────────────────────────────────────────

  it('allows browsing the user home directory', async () => {
    const result = await (handler as Function)(makeEvent('/home/testuser'))
    expect(result).toHaveProperty('current', '/home/testuser')
  })

  it('allows browsing a subdirectory inside the home directory', async () => {
    const result = await (handler as Function)(makeEvent('/home/testuser/projects'))
    expect(result).toHaveProperty('current', '/home/testuser/projects')
  })

  it('allows browsing /tmp', async () => {
    const result = await (handler as Function)(makeEvent('/tmp'))
    expect(result).toHaveProperty('current', '/tmp')
  })

  it('allows browsing the filesystem root (/) to navigate', async () => {
    const result = await (handler as Function)(makeEvent('/'))
    expect(result).toHaveProperty('current', '/')
  })

  it('defaults to homedir when no path query param is provided', async () => {
    const result = await (handler as Function)(makeEvent())
    expect(result).toHaveProperty('current', '/home/testuser')
  })
})
