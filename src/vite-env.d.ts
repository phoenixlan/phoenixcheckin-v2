interface ViteTypeOptions {
  // By adding this line, you can make the type of ImportMetaEnv strict
  // to disallow unknown keys.
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
	readonly VITE_APP_URL: string|undefined
	readonly VITE_API_URL: string|undefined
	readonly VITE_API_OAUTH_CLIENT_ID: string|undefined
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
