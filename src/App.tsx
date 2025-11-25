import * as Phoenix from "@phoenixlan/phoenix.js"
import { useEffect, useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { QrScanner } from './components/QrScanner'
import toast from 'react-hot-toast'
import Login from "./components/Login"
import './App.css'
import type { IDetectedBarcode } from '@yudiel/react-qr-scanner'
import type { ChangeEvent } from 'react'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faAddressCard, faCalendar, faUser } from "@fortawesome/free-regular-svg-icons"
import { faMapPin, faMars, faQrcode, faSignOut, faVenus } from "@fortawesome/free-solid-svg-icons"

export default function App() {
	if (!import.meta.env.VITE_API_URL) throw Error("VITE_API_URL not defined")
	Phoenix.init(import.meta.env.VITE_API_URL)

	const Auth = useAuth()!

	const [showQrScanner, setShowQrScanner] = useState<boolean>(false)
	const [inputValue, setInputValue] = useState<string>("")
	const [ticketId, setTicketId] = useState<number>(-1)
	const [currentEvent, setCurrentEvent] = useState<Phoenix.Event|undefined>()
	const [ticket, setTicket] = useState<Phoenix.Ticket.FullTicket|undefined>()
	const [ticketOwner, setTicketOwner] = useState<Phoenix.User.FullUser|undefined>()

	useEffect(() => { // On auth change
		const loadPageData = async () => {
			if(Auth.authUser) {
				const currentEventResult = await Phoenix.getCurrentEvent()
				setCurrentEvent(currentEventResult)
			}
		}
		loadPageData()
	}, [Auth.authUser])

	useEffect(() => { // On inputValue change
		const debounceInputHandler = setTimeout(() => {
			const id = Number.parseInt(inputValue)
			if (Number.isNaN(id)) {
				return
			}
			setTicketId(id)
		}, 500)

		return () => {
			clearTimeout(debounceInputHandler)
		}
	}, [inputValue])

	const fetchTicket = async () => {
		if (Math.sign(ticketId) === -1) return // No negative numbers
		let ticketResult
		try {
			ticketResult = await Phoenix.Ticket.getTicket(ticketId)
		} catch (error) {
			console.log(error)
			toast.error("Unable to find ticket with id: " + ticketId)
			setTicket(undefined)
			return
		}

		const ticketOwnerResult = await Phoenix.User.getUser(ticketResult.owner.uuid)

		setTicket(ticketResult)
		setTicketOwner(ticketOwnerResult)
		setInputValue("")
	}

	useEffect(() => { // On ticketId change
		const loadTicket = async () => {
			await fetchTicket()
		}
		loadTicket()
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ticketId])

	function handleOnSearchChange(event: ChangeEvent) {
		setShowQrScanner(false)
		const inputElement = event.target as HTMLInputElement
		setInputValue(inputElement.value)
	}
	
	function handleOnScan(results: IDetectedBarcode[]) {
		const scanResult = results[0]
		const scannedValue = scanResult.rawValue.split(":") // This should be in the format of 'phoenix-lan-ticket:999'
		const id = Number.parseInt(scannedValue[1])
		if (scanResult.format !== "qr_code" || scannedValue[0] !== "phoenix-lan-ticket" || Number.isNaN(id)) {
			toast.error("Not a valid ticket QR-code")
			return
		}
		setTicketId(id)
		setInputValue(id.toString())
		setShowQrScanner(false)
	}

	function handleShowScanner() {
		setShowQrScanner(!showQrScanner)
		setTicket(undefined)
	}

	async function handleCheckinTicket() {

		if (!ticket?.checked_in && confirm(`Er du sikker på at du vil sjekke inn billet #${ticketId}?`)) {
			await Phoenix.Ticket.checkInTicket(ticketId)
			await fetchTicket()
			toast.success("Sjekket inn billet: " + ticketId)
		}
	}

	function calculateAge(dateString: string) {
		const today = new Date()
		const birthDate = new Date(dateString)

		let age = today.getFullYear() - birthDate.getFullYear();
    	const month = today.getMonth() - birthDate.getMonth();

		if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
			age--;
		}

		return age
	}
	
	const validRoles = ["ticket_checkin", "ticket_admin", "admin"]

	if(!Auth.authUser || !validRoles.some(value => Auth.roles.includes(value))) {
		return <Login/>
	}
	
	return (
	<main>
		<nav className="navbar">
			<div>
				<img src="/phoenix_logo.svg" alt="" className="logo"/>
				<span>Innsjekk</span>
			</div>
			<span className="event-name">{currentEvent?.name}</span>
			<button onClick={() => Auth.logout()}><FontAwesomeIcon icon={faSignOut} size="xl"/></button>
		</nav>
		<div className="inputgroup">
			<input type="number" inputMode='numeric' id="ticketid" placeholder='#ID' value={inputValue} onChange={handleOnSearchChange} />
			<button onClick={handleShowScanner}><FontAwesomeIcon icon={faQrcode} size="2x" /></button>
		</div>
		{!ticket || !ticketOwner ? <></> : <>
			<h3>Personalia</h3>
			<section className="personalia">
				<div>
					<FontAwesomeIcon icon={faUser}/>
					<div>
						<small>Fornavn, Etternavn</small>
						<span>{Phoenix.User.getFullName(ticketOwner)}</span>
					</div>
				</div>
				<div>
					<FontAwesomeIcon icon={faAddressCard}/>
					<div>
						<small>Brukernavn</small>
						<span>{ticketOwner.username}</span>
					</div>
				</div>
				<div>
					<FontAwesomeIcon icon={ticketOwner.gender === "Gender.male" ? faMars : faVenus}/>
					<div>
						<small>Kjønn</small>
						<span>{ticketOwner.gender === "Gender.male" ? "Gutt" : "Jente"}</span>
					</div>
				</div>
				<div>
					<FontAwesomeIcon icon={faCalendar}/>
					<div>
						<small>Alder</small>
						<span>{ticketOwner.birthdate} ({calculateAge(ticketOwner.birthdate)} år)</span>
					</div>
				</div>
				<div>
					<FontAwesomeIcon icon={faMapPin}/>
					<div>
						<small>Adresse</small>
						<span>{ticketOwner.address}</span>
					</div>
				</div>
			</section>
			<h3>Billett</h3>
			<div className="ticket">
				<div className="left">
					<div className="inner innerleft">
						<span>{ticket.event.name}</span>
						<span>#{ticket.ticket_id}</span>

						<span>{ticket.owner.firstname}</span>
						<span>{ticket.owner.lastname}</span>
						<span>{ticket.owner.username}</span>
					</div>
				</div>
				<div className={`right ${ticket.checked_in && 'checked-in'}`} onClick={handleCheckinTicket}>
					<div className="inner innerright">
						<img src="/phoenix_logo.svg" alt="" className="logo"/>
						<span>#{ticketId}</span>
						<FontAwesomeIcon icon={faQrcode} size="xl"/>
					</div>
				</div>
			</div>
		</>}
		<section>
			<QrScanner show={showQrScanner} handleOnScan={handleOnScan}/>
		</section>
		<section className="completionbar">{/* TODO */}
			<h3>Fremgang</h3>
			<progress value="70" max="100"></progress>
		</section>
	</main>
	)
}
