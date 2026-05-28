import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BarcodeEAN13 from '../components/BarcodeEAN13'

function formatData(dataISO) {
  if (!dataISO) return ''
  return new Date(dataISO).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function EtichettaLabel({ prodotto }) {
  return (
    <div
      style={{
        width: '30mm',
        height: '50mm',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: '1.5mm',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      {/* Barcode EAN-13: larghezza piena, altezza proporzionale */}
      <BarcodeEAN13 value={prodotto.barcode} />

      {/* Testo sotto il barcode */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '1mm',
          marginTop: '1.5mm',
          overflow: 'hidden',
        }}
      >
        <p
          style={{
            fontSize: '7pt',
            fontWeight: 'bold',
            color: '#000000',
            lineHeight: 1.2,
            margin: 0,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            wordBreak: 'break-word',
          }}
        >
          {prodotto.nome}
        </p>
        <p style={{ fontSize: '6pt', color: '#333333', margin: 0, lineHeight: 1.3 }}>
          Prep: {formatData(prodotto.data_preparazione)}
        </p>
        <p style={{ fontSize: '6pt', fontWeight: 'bold', color: '#000000', margin: 0, lineHeight: 1.3 }}>
          {prodotto.quantita} {prodotto.unita}
        </p>
      </div>
    </div>
  )
}

export default function StampaEtichetta() {
  const { id } = useParams()
  const [prodotto, setProdotto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errore, setErrore] = useState(null)

  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'etichetta-print-styles'
    style.textContent = `
      @page {
        size: 30mm 50mm portrait;
        margin: 0mm;
      }
      @media print {
        html, body {
          width: 30mm;
          height: 50mm;
          margin: 0;
          padding: 0;
          background: white;
          overflow: hidden;
        }
        #root {
          display: none !important;
        }
        #etichetta-print {
          display: block !important;
          position: fixed;
          top: 0;
          left: 0;
          width: 30mm;
          height: 50mm;
          margin: 0;
          padding: 0;
          overflow: hidden;
          page-break-after: avoid;
          page-break-inside: avoid;
        }
      }
    `
    document.head.appendChild(style)
    return () => document.getElementById('etichetta-print-styles')?.remove()
  }, [])

  useEffect(() => {
    supabase
      .from('prodotti')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) setErrore(error.message)
        else setProdotto(data)
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    if (prodotto) {
      const t = setTimeout(() => window.print(), 300)
      return () => clearTimeout(t)
    }
  }, [prodotto])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-sky-600 border-t-transparent" />
    </div>
  )

  if (errore || !prodotto) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
      <p>Prodotto non trovato</p>
      <Link to="/" className="text-sm underline mt-2 block">Torna alle giacenze</Link>
    </div>
  )

  return (
    <div>
      {/* Header — nascosto in stampa */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link to="/" className="text-sky-600 hover:text-sky-800 text-sm font-medium flex items-center gap-1">
          ← Giacenze
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
        >
          🖨️ Stampa etichetta
        </button>
      </div>

      {/* Preview a schermo — nascosta in stampa */}
      <div className="print:hidden flex flex-col items-center gap-3">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
          Anteprima — 30 × 50 mm
        </p>
        <div style={{ border: '1px dashed #9ca3af', display: 'inline-block' }}>
          <EtichettaLabel prodotto={prodotto} />
        </div>
        {!prodotto.barcode && (
          <p className="text-xs text-red-400 text-center max-w-xs">
            ⚠️ Questo prodotto non ha ancora un barcode. Salvalo di nuovo per generarlo.
          </p>
        )}
        <p className="text-xs text-gray-400 text-center max-w-xs">
          La stampa si avvia automaticamente. Nel dialogo di stampa seleziona formato 30×50 mm.
        </p>
      </div>

      {/* Etichetta per la stampa — portal su document.body, fuori da #root */}
      {createPortal(
        <div id="etichetta-print" style={{ display: 'none' }}>
          <EtichettaLabel prodotto={prodotto} />
        </div>,
        document.body
      )}
    </div>
  )
}
