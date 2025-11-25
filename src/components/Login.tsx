import { useAuth } from "../hooks/useAuth"

export default function Login() {
	const Auth = useAuth()!

	return (
		<main className="login">
			<img src="/phoenix_logo.svg" alt="" className="login"/><br/>
			<button onClick={() => Auth.login()} className="login">Logg inn</button>
		</main>
	)
}