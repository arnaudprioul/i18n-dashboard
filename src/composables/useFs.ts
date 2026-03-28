import { fsService } from '../services/fs.service'
import type { IFsBrowseResult } from '../services/fs.service'

export function useFs() {
  const loading = ref(false)
  const browseError = ref('')
  const data = ref<IFsBrowseResult | null>(null)

  async function browse(path?: string): Promise<void> {
    loading.value = true
    browseError.value = ''
    try {
      data.value = await fsService.browse(path)
    }
    catch (e: any) {
      browseError.value = e?.message ?? 'Cannot browse this path'
    }
    finally {
      loading.value = false
    }
  }

  return { loading, browseError, data, browse }
}
