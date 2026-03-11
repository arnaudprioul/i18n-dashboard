import { authService } from '../services/auth.service'

export interface AuthUser {
  id: number
  email: string
  name: string
  is_super_admin: boolean
  is_active: boolean
  roles: Array<{ role: string; project_id: number | null; project_name?: string }>
}

const _currentUser = ref<AuthUser | null>(null)

export function useAuth() {
  const currentUser = _currentUser

  const fetchMe = async () => {
    try {
      const user = await authService.me()
      _currentUser.value = user
      return user
    } catch {
      _currentUser.value = null
      return null
    }
  }

  const login = async (email: string, password: string) => {
    const user = await authService.login(email, password)
    _currentUser.value = user
    return user
  }

  const logout = async () => {
    await authService.logout()
    _currentUser.value = null
    return null
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await authService.changePassword(currentPassword, newPassword)
  }

  const getRoleForProject = (projectId: number): string | null => {
    if (!_currentUser.value) return null
    if (_currentUser.value.is_super_admin) return 'super_admin'
    const specific = _currentUser.value.roles.find((r) => r.project_id === projectId)
    if (specific) return specific.role
    const global_ = _currentUser.value.roles.find((r) => r.project_id === null)
    return global_?.role || null
  }

  const canApprove = (projectId: number): boolean => {
    const role = getRoleForProject(projectId)
    return role === 'super_admin' || role === 'admin' || role === 'moderator'
  }

  const canManageProject = (projectId: number): boolean => {
    const role = getRoleForProject(projectId)
    return role === 'super_admin' || role === 'admin'
  }

  const canManageUsers = (projectId?: number): boolean => {
    if (!_currentUser.value) return false
    if (_currentUser.value.is_super_admin) return true
    if (!projectId) return false
    const role = getRoleForProject(projectId)
    return role === 'admin'
  }

  return { currentUser, fetchMe, login, logout, changePassword, getRoleForProject, canApprove, canManageProject, canManageUsers }
}
