// Shared reader setup (same barcode formats as the camera scanner).
import { createReader } from './barcodeReader'

// Largest picture we will try to read (phone photos are usually 2-6 MB); protects the browser from huge files.
const MAX_BYTES = 12 * 1024 * 1024

// Read a barcode from a picture file. Returns the digits, or null if there is none / the file is unusable.
export async function decodeBarcodeFromFile(file: File): Promise<string | null> {
  // Only images, and not absurdly large ones.
  if (!file.type.startsWith('image/') || file.size > MAX_BYTES) return null
  // A temporary link to the file in memory, so the reader can load it as an image.
  const url = URL.createObjectURL(file)
  try {
    // Decode; throws when no barcode is found.
    const result = await createReader().decodeFromImageUrl(url)
    // The barcode digits.
    return result.getText()
  } catch {
    // No barcode found (or the image could not be read).
    return null
  } finally {
    // Always free the temporary link.
    URL.revokeObjectURL(url)
  }
}
