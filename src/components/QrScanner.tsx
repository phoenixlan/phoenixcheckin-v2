import { Scanner, type IDetectedBarcode } from "@yudiel/react-qr-scanner";

interface QrScannerProps {
	show: boolean;
	handleOnScan: (results: IDetectedBarcode[]) => void;
}

export function QrScanner({ show, handleOnScan }: QrScannerProps) {
	if (show) return <div className="qr-container">
		<Scanner
			components={{
				finder: true,
			}}
			sound={false}
			onScan={handleOnScan}
			styles={{container: {aspectRatio: "1/1", width: "100%", maxHeight: "100%", }}}
		/>
	</div>

	return <></>
}