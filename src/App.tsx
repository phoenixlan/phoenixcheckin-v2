import './App.css'
import * as Phoenix from "@phoenixlan/phoenix.js"
import { useEffect, useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { QrScanner } from './components/QrScanner'
import toast from 'react-hot-toast'
import Login from "./components/Login"
import type { IDetectedBarcode } from '@yudiel/react-qr-scanner'
import type { ChangeEvent } from 'react'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faAddressCard, faCalendar } from "@fortawesome/free-regular-svg-icons"
import { faHashtag, faMars, faQrcode, faSignOut, faVenus } from "@fortawesome/free-solid-svg-icons"
import { QRCodeSVG } from "qrcode.react"

export default function App() {
	if (!import.meta.env.VITE_API_URL) throw Error("VITE_API_URL not defined")
	Phoenix.init(import.meta.env.VITE_API_URL)

	const Auth = useAuth()!

	const [showQrScanner, setShowQrScanner] = useState<boolean>(false)
	const [inputValue, setInputValue] = useState<string>("")
	const [ticketId, setTicketId] = useState<number>(-1)
	const [currentEvent, setCurrentEvent] = useState<Phoenix.Event|null>()
	const [ticket, setTicket] = useState<Phoenix.Ticket.FullTicket|undefined>()
	const [ticketOwner, setTicketOwner] = useState<Phoenix.User.FullUser|undefined>()
	const [ticketCount, setTicketCount] = useState<{ checkedIn:number, total:number; }>({checkedIn: 0, total: 0})

	// On page load
	useEffect(() => {
		const loadPageData = async () => {
			const currentEventResult = await Phoenix.getCurrentEvent()
			setCurrentEvent(currentEventResult)
			await fetchTicketCount()
		}
		loadPageData()
	}, [])

	// On inputValue change
	useEffect(() => {
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

	const fetchTicketCount = async () => {
		if (!currentEvent) return
		const allTickets = await Phoenix.getEventTickets(currentEvent.uuid)
		const checkedInTickets = allTickets.filter(ticket => ticket.checked_in)
		setTicketCount({checkedIn: checkedInTickets.length, total: allTickets.length})
	}

	// On ticketId change
	useEffect(() => {
		const loadTicket = async () => {
			await fetchTicket()
			await fetchTicketCount()
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
			try {
				await Phoenix.Ticket.checkInTicket(ticketId)
			} catch (error) {
				if (error instanceof Phoenix.ApiPostError) {
					console.error(error)
					toast.error(error.message)
					return
				}
				console.error(error)
			}
			
			await fetchTicket()
			await fetchTicketCount()

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
	
	if(!Auth.authUser) {
		return <Login/>
	}
	
	return (<>
	<nav className="navbar">
		<div>
			<img src="/phoenix_logo.svg" alt="" className="logo"/>
			<span>Innsjekk</span>
		</div>
		<span className="event-name">{currentEvent?.name}</span>
		<button onClick={() => Auth.logout()}><FontAwesomeIcon icon={faSignOut} size="xl"/><br/>Logg ut</button>
	</nav>
	<main>
		<section className="completion">
			<progress max={ticketCount.total} value={ticketCount.checkedIn}></progress>
		</section>
		<div className="inputgroup">
			<div className='textinput'>
				<label htmlFor="ticketid">Billet ID</label>
				<input type="number" inputMode='numeric' id="ticketid" placeholder='#ID' min="1" value={inputValue} onChange={handleOnSearchChange} title="Søk etter billett #ID"/>
			</div>
			<div>
				<label htmlFor='scanbutton'>Scan</label>
				<button id='scanbutton' onClick={handleShowScanner} title="Scan billett"><FontAwesomeIcon icon={faQrcode} size="2x"/></button>
			</div>
		</div>
		{!ticket || !ticketOwner ? <></> : <>
			<h2 className='heading'>Personalia</h2>
			<section className="personalia">
				<div>
					<FontAwesomeIcon icon={faHashtag}/>
					<div>
						<small>Brukernavn</small>
						<span>{ticketOwner.username}</span>
					</div>
				</div>
				<div>
					<FontAwesomeIcon icon={faAddressCard}/>
					<div>
						<small>Fornavn, Etternavn</small>
						<span>{Phoenix.User.getFullName(ticketOwner)}</span>
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
			</section>
			<h2 className='heading'>Billett</h2>
			<div className="ticket">
				<div className="left">
					<div className="inner innerleft">
						<span className="eventname">{ticket.event.name}</span>
						<span>{Phoenix.User.getFullName(ticket.owner)}</span>
						<span>Rad {ticket.seat?.row.row_number} Sete {ticket.seat?.number}</span>
					</div>
				</div>
				<div className={`right ${ticket.checked_in ? "checked-in" : ""}`} onClick={handleCheckinTicket}>
					<div className="inner innerright">
						<img src="/phoenix_logo.svg" alt="" className="logo"/>
						<b># {ticketId}</b>
						<QRCodeSVG value={`phoenix-lan-ticket:${ticket.ticket_id}`} size={60} />
					</div>
				</div>
			</div>
		</>}
		<QrScanner show={showQrScanner} handleOnScan={handleOnScan}/>
	</main>
	</>)
}
