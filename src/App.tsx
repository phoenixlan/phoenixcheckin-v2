import './App.css'
import * as Phoenix from "@phoenixlan/phoenix.js"
import { useEffect, useState } from 'react'
import { QrScanner } from './components/QrScanner'
import toast from 'react-hot-toast'
import type { IDetectedBarcode } from '@yudiel/react-qr-scanner'
import type { ChangeEvent } from 'react'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faAddressCard, faCalendar } from "@fortawesome/free-regular-svg-icons"
import { faCheck, faHashtag, faMars, faQrcode, faSignOut, faVenus } from "@fortawesome/free-solid-svg-icons"
import { QRCodeSVG } from "qrcode.react"
import { useAuth } from './hooks/useAuth'
import { useSiteConfig } from './queries/useSiteConfig'

export default function App() {
	const Auth = useAuth()!
	const { data: siteConfig } = useSiteConfig()
	const logoUrl = siteConfig?.logo ? `${import.meta.env.VITE_API_URL}/${siteConfig.logo}` : null
	const [showQrScanner, setShowQrScanner] = useState<boolean>(false)
	const [inputValue, setInputValue] = useState<string>("")
	const [ticketAuth, setTicketAuth] = useState<{id: number, totp: string|null}>({id: -1, totp: null})
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
			setTicketAuth(prev => ({...prev, id}))
		}, 500)

		return () => {
			clearTimeout(debounceInputHandler)
		}
	}, [inputValue])

	const fetchTicket = async () => {
		if (Math.sign(ticketAuth.id) === -1) return // No negative numbers
		let ticketResult
		try {
			ticketResult = await Phoenix.Ticket.getTicket(ticketAuth.id, ticketAuth.totp??undefined)
		} catch (error) {
			console.log(error)
			toast.error("Unable to find ticket with id: " + ticketAuth.id)
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
	}, [ticketAuth.id])

	function handleOnSearchChange(event: ChangeEvent) {
		setShowQrScanner(false)
		const inputElement = event.target as HTMLInputElement
		setInputValue(inputElement.value)
		setTicketAuth(prev => ({...prev, totp: null}))
	}
	
	function handleOnScan(results: IDetectedBarcode[]) {
		const scanResult = results[0]
		// QR code values are obfuscated a bit to deter script kiddies
		if (scanResult.format !== "qr_code"){
			toast.error("Not a valid QR-code")
			return
		}

		try {
			const decoded_contents = atob(scanResult.rawValue)
			console.log(`decoded ticket: ${decoded_contents}`)
			const content_parts = decoded_contents.split(":")

			if(content_parts[0] != "phoenix-ticket") {
				// Magic identifyer
				console.log(`Invalid magic ${content_parts[0]}`)
				toast.error("Not a valid ticket QR-code")
				return
			}
			const ticket_id = Number.parseInt(content_parts[1])
			if (Number.isNaN(ticket_id)) {
				console.log(`Invalid ticket id ${ticket_id}`)
				toast.error("Not a valid ticket QR-code")
				return
			}

			const totp = content_parts[2]

			setTicketAuth({id: ticket_id, totp})

			setInputValue(ticket_id.toString())
			setShowQrScanner(false)
		} catch (e) {
			toast.error("Not a valid ticket QR-code")
			return
		}
	}

	function handleShowScanner() {
		setShowQrScanner(!showQrScanner)
		setTicket(undefined)
	}

	async function handleCheckinTicket() {
		if (!ticket?.checked_in && confirm(`Er du sikker på at du vil sjekke inn billet #${ticketAuth.id}?`)) {
			try {
				await Phoenix.Ticket.checkInTicket(ticketAuth.id, ticketAuth.totp??undefined)
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

			toast.success("Sjekket inn billet: " + ticketAuth.id)
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
	
	return (<>
	<nav className="navbar">
		<div>
			{logoUrl ? <img src={logoUrl} alt="" className="logo"/> : <div className="spinner" />}
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
						<span className="eventname">{ticket.event.name} - {ticket.ticket_type.name}</span>
						<span>{Phoenix.User.getFullName(ticket.owner)}</span>
						{
							ticket.ticket_type.seatable ? (
								ticket.seat ? (
									<span>Rad {ticket.seat?.row.row_number} Sete {ticket.seat?.number}</span>
								) : (<span><b>Ikke plassert enda</b></span>)
							) : (
								<span>Ingen seteplass</span>
							)
						}
						{ticketAuth.totp ? <span>Ikke forfalsket <FontAwesomeIcon icon={faCheck}/></span> : null}
					</div>
				</div>
				<div className={`right ${ticket.checked_in ? "checked-in" : ""}`} onClick={handleCheckinTicket}>
					<div className="inner innerright">
					{logoUrl ? <img src={logoUrl} alt="" className="logo"/> : <div className="spinner" />}
					<b># {ticketAuth.id}</b>
						<QRCodeSVG value={`phoenix-lan-ticket:${ticket.ticket_id}`} size={60} />
					</div>
				</div>
			</div>
		</>}
		<QrScanner show={showQrScanner} handleOnScan={handleOnScan}/>
	</main>
	</>)
}
