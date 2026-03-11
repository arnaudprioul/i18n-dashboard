import { buildEnv, loadUserConfig } from '../utils/config.util'

export function useConfig () {
	const config = ref(null)

	onMounted(async () => {
		const userConfig = await loadUserConfig()
		config.value = buildEnv(userConfig)
	})

	return {
		config
	}
}
