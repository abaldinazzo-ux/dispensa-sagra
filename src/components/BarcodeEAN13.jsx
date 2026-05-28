import { useEffect, useState } from 'react'
import JsBarcode from 'jsbarcode'

export default function BarcodeEAN13({ value, style }) {
  const [src, setSrc] = useState('')

  useEffect(() => {
    if (!value) return

    const scale = (window.devicePixelRatio || 1) * 3
    const canvas = document.createElement('canvas')

    JsBarcode(canvas, value, {
      format: 'EAN13',
      width: 2 * scale,
      height: 50 * scale,
      displayValue: true,
      fontSize: 12 * scale,
      margin: 4 * scale,
    })

    setSrc(canvas.toDataURL('image/png', 1.0))
  }, [value])

  if (!value) return (
    <div style={{
      ...style,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px dashed #ccc',
    }}>
      <span style={{ fontSize: '6pt', color: '#999' }}>Barcode non disponibile</span>
    </div>
  )

  if (!src) return null

  return (
    <img
      src={src}
      alt={value}
      style={{ display: 'block', width: '100%', height: 'auto', ...style }}
    />
  )
}
