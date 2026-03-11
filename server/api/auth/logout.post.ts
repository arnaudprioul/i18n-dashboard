import { getSession } from '../../utils/auth.util'

export default defineEventHandler(async (event) => {
  const session = await getSession(event)
  await session.clear()
  return { success: true }
})
