/**
 * Reconstruct a nested object from flat dot-separated keys
 * e.g. { 'a.b': 'hello' } => { a: { b: 'hello' } }
 */
export function unflattenObject(flat: Record<string, string>, separator: string): Record<string, any> {
	const result: Record<string, any> = {}

	for (const [key, value] of Object.entries(flat)) {
		const parts = key.split(separator)
		let current = result

		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i]
			if (!(part in current) || typeof current[part] !== 'object') {
				current[part] = {}
			}
			current = current[part]
		}

		current[parts[parts.length - 1]] = value
	}

	return result
}
