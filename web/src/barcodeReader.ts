// ZXing's browser reader: decodes barcodes from a camera stream or from an image.
import { BrowserMultiFormatReader } from '@zxing/browser'
// Barcode type names and the "hints" option keys from ZXing's core library.
import { BarcodeFormat, DecodeHintType } from '@zxing/library'

// Only look for retail product barcodes; ignoring QR codes etc. makes scanning faster and more reliable.
const FORMATS = [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]

// Create a reader limited to those formats (shared by the live camera scanner and the image upload).
export const createReader = () => new BrowserMultiFormatReader(new Map([[DecodeHintType.POSSIBLE_FORMATS, FORMATS]]))
