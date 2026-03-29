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

export interface IDetectedFormats {
	numberFormats: Record<string, Record<string, Record<string, any>>>
	datetimeFormats: Record<string, Record<string, Record<string, any>>>
	modifiers: Record<string, string>
	sourceFile: string | null
}
