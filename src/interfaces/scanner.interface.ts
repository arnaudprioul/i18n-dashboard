export interface IKeyUsage {
	key: string
	filePath: string
	lineNumber: number
	detectedFunction: string
}

export interface IDetectedLanguage {
	code: string
	name: string
	source: 'locales-dir' | 'config-file'
}

export interface IScanResult {
	usages: IKeyUsage[]
	scannedFiles: string[]
	errors: string[]
}
