interface ViteTypeOptions {
  // By adding this line, you can make the type of ImportMetaEnv strict
  // to disallow unknown keys.
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
	readonly VITE_APP_URL: string
	readonly VITE_API_URL: string
	readonly VITE_API_OAUTH_CLIENT_ID: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
