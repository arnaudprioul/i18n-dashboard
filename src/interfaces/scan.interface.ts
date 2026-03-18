export interface IScanResult {
	keysFound: number
	keysAdded: number
	langsAdded: number
	scannedFiles: number
}

export interface ISyncResult {
	added: number
	updated: number
	total: number
}
