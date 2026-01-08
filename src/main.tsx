import * as Phoenix from "@phoenixlan/phoenix.js"
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { Toaster } from 'react-hot-toast'
import AuthContextProvider from './components/AuthContextProvider.tsx'
import App from './App.tsx'
import './main.css'
import { useAuth } from "./hooks/useAuth.ts"
import Login from "./components/Login.tsx"

if (!import.meta.env.VITE_API_URL) throw Error("VITE_API_URL not defined")
Phoenix.init(import.meta.env.VITE_API_URL)

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Toaster />
		<AuthContextProvider>
			<Main/>
		</AuthContextProvider>
	</StrictMode>,
)

export function Main() {
	const Auth = useAuth()
	if (Auth === undefined) throw Error("Failed to create auth context")
	
	if (Auth.isLoggedIn) {
		return <App/>
	} else {
		return <Login/>
	}
}
