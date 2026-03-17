export interface ScanResult {
	keysFound: number
	keysAdded: number
	langsAdded: number
	scannedFiles: number
}

export interface SyncResult {
	added: number
	updated: number
	total: number
}
