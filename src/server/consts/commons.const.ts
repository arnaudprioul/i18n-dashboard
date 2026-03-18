import { dirname } from 'path'
import { fileURLToPath } from 'url'

export const __DIRNAME = typeof __dirname !== 'undefined'
	? __dirname
	: dirname(fileURLToPath(import.meta.url))
