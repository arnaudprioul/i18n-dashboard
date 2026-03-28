export interface IScanResult {
	keysFound: number
	keysAdded: number
	langsAdded: number
	scannedFiles: number
}

export interface IScanModalProject {
	languages?: Array<{ code: string; name: string }>
	root_path?: string
	git_repo?: import('./project.interface').IGitRepo | null
}

export interface IScanModalProps {
	projectId: number
	project?: IScanModalProject
}

export interface IScanModalEmits {
	done: []
}

export interface ISyncResult {
	added: number
	updated: number
	total: number
}
