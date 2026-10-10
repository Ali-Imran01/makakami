// ZXing's browser reader: opens the camera and decodes barcodes from the video.
import { BrowserMultiFormatReader } from '@zxing/browser'
// Barcode type names and the "hints" option keys from ZXing's core library.
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
// React hooks for lifecycle, refs and state.
import { useEffect, useRef, useState } from 'react'

// Camera lifecycle: starting up, working, user said no, or this browser can't do it.
export type CameraStatus = 'starting' | 'ready' | 'denied' | 'unsupported'

// Only look for retail product barcodes; ignoring QR codes etc. makes scanning faster and more reliable.
const FORMATS = [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]

// True when this page can use the camera API (it's missing on insecure http pages and very old browsers).
const hasCamera = () => typeof navigator.mediaDevices?.getUserMedia === 'function'

// Starts the camera on mount, calls onDetect once with the first barcode found, and cleans up on unmount.
export function useBarcodeScanner(onDetect: (code: string) => void) {
  // Points at the <video> element the camera picture is shown in.
  const videoRef = useRef<HTMLVideoElement>(null)
  // Always holds the latest onDetect, so the camera effect doesn't restart when the callback changes.
  const onDetectRef = useRef(onDetect)
  // Holds the function that turns the torch on/off (only set when the phone supports it).
  const torchRef = useRef<((on: boolean) => Promise<void>) | null>(null)
  // Browsers without camera support (or non-secure pages) have no mediaDevices; we can know that up front.
  const [status, setStatus] = useState<CameraStatus>(() => (hasCamera() ? 'starting' : 'unsupported'))
  // Whether to show the torch button as usable.
  const [torchSupported, setTorchSupported] = useState(false)
  // Whether the torch is currently lit.
  const [torchOn, setTorchOn] = useState(false)

  // After every render, remember the newest callback.
  useEffect(() => {
    // Store it in the ref.
    onDetectRef.current = onDetect
  })

  // Start and stop the camera.
  useEffect(() => {
    // Nothing to start if the browser has no camera API (status is already 'unsupported').
    if (!hasCamera()) return
    // The video element must exist by now (it is always rendered); bail out if not.
    const video = videoRef.current
    if (!video) return

    // Set to true on cleanup so late async results are ignored.
    let cancelled = false
    // Set to true after the first detection so repeated frames don't fire the callback again.
    let detected = false
    // The stop function only exists once the camera has started; this variable carries it to the cleanup below.
    let stopRef: (() => void) | undefined
    // Reader limited to product barcode formats.
    const reader = new BrowserMultiFormatReader(new Map([[DecodeHintType.POSSIBLE_FORMATS, FORMATS]]))

    // Open the camera (no deviceId = browser prefers the rear camera) and decode continuously.
    const starting = reader.decodeFromVideoDevice(undefined, video, (result) => {
      // Ignore frames with no barcode, and anything after the first hit or after unmounting.
      if (!result || detected || cancelled) return
      // Remember that we found one.
      detected = true
      // Tell the page which barcode was read.
      onDetectRef.current(result.getText())
    })

    // When the camera has started...
    starting
      .then((controls) => {
        // If the page was left while the camera was starting, shut it straight down.
        if (cancelled) {
          // Release the camera.
          controls.stop()
          // Nothing more to do.
          return
        }
        // Keep the stop function for cleanup.
        stopRef = controls.stop
        // Keep the torch switch if this camera has one.
        torchRef.current = controls.switchTorch ?? null
        // Show the torch button as usable only if we got a switch.
        setTorchSupported(Boolean(controls.switchTorch))
        // Camera is live.
        setStatus('ready')
      })
      // ...or if it failed to start.
      .catch((err: unknown) => {
        // Ignore failures that happen after we've already left the page.
        if (cancelled) return
        // "NotAllowedError" means the user (or browser policy) denied camera permission.
        setStatus(err instanceof DOMException && err.name === 'NotAllowedError' ? 'denied' : 'unsupported')
      })

    // Cleanup when the page unmounts.
    return () => {
      // Flag so pending callbacks do nothing.
      cancelled = true
      // Turn the camera off if it had already started.
      stopRef?.()
      // Forget the old torch switch.
      torchRef.current = null
    }
  }, [])

  // Flip the torch and keep the button state in sync.
  const toggleTorch = async () => {
    // No torch switch available: do nothing.
    if (!torchRef.current) return
    // Work out the new state.
    const next = !torchOn
    // Ask the camera to switch; this can reject, so catch it and leave the state unchanged.
    try {
      // Send the command.
      await torchRef.current(next)
      // Record the new state for the button.
      setTorchOn(next)
    } catch {
      // Torch failed (e.g. camera busy): keep the old state.
    }
  }

  // Everything the page needs.
  return { videoRef, status, torchSupported, torchOn, toggleTorch }
}
