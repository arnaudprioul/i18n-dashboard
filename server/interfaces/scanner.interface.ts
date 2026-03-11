export interface KeyUsage {
	key: string
	filePath: string
	lineNumber: number
	detectedFunction: string
}

export interface DetectedLanguage {
	code: string
	name: string
	source: 'locales-dir' | 'config-file'
}

export interface ScanResult {
	usages: KeyUsage[]
	scannedFiles: string[]
	errors: string[]
}
