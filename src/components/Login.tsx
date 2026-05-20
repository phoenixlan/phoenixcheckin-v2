import { useAuth } from "../hooks/useAuth"
import { useSiteConfig } from "../queries/useSiteConfig"

export default function Login() {
	const Auth = useAuth()!
	const { data: siteConfig } = useSiteConfig()

	const logoUrl = siteConfig?.logo ? `${import.meta.env.VITE_API_URL}/${siteConfig.logo}` : null

	return (
		<main className="login">
			{logoUrl ? <img src={logoUrl} alt="" className="login" /> : <div className="spinner" />}<br/>
			<button onClick={() => Auth.login()} className="login">Logg inn</button>
		</main>
	)
}
