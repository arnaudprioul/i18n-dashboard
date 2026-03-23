import { getPasswordPolicy } from '../../utils/password.util'

// Public endpoint — the password policy must be readable by unauthenticated users
// (login page, reset-password page) to show real-time validation hints.
export default defineEventHandler(async () => {
  return getPasswordPolicy()
})
