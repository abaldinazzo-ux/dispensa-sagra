import { useMemo } from 'react'
import bwipjs from 'bwip-js'

export default function BarcodeEAN13({ value, style }) {
  const src = useMemo(() => {
    if (!value) return ''
    try {
      const svg = bwipjs.toSVG({
        bcid: 'ean13',
        text: value,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center',
      })
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    } catch (e) {
      console.error('BarcodeEAN13:', e)
      return ''
    }
  }, [value])

  if (!src) return (
    <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ccc' }}>
      <span style={{ fontSize: '6pt', color: '#999' }}>Barcode non disponibile</span>
    </div>
  )

  return (
    <img
      src={src}
      alt={value}
      style={{ display: 'block', width: '100%', height: 'auto', ...style }}
    />
  )
}
