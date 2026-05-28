import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

export default function BarcodeEAN13({ value, style }) {
  const svgRef = useRef(null)

  useEffect(() => {
    if (!svgRef.current || !value) return
    JsBarcode(svgRef.current, value, {
      format: 'EAN13',
      width: 2.5,
      height: 60,
      displayValue: true,
      fontSize: 14,
      margin: 5,
    })
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

  return (
    <svg
      ref={svgRef}
      style={{ display: 'block', width: '100%', height: 'auto', ...style }}
    />
  )
}
