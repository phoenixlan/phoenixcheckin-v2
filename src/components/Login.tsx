import { useAuth } from "../hooks/useAuth"

export default function Login() {
	const Auth = useAuth()!

	return (<>
		<img src="/phoenix_logo.svg" alt="" /><br/>
		<button onClick={() => Auth.login()}>Logg inn</button>
	</>)
}