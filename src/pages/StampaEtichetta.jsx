import { useEffect, useState } from 'react'
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

// Etichetta 50×30mm landscape — un'unica istanza nel DOM
function EtichettaLabel({ prodotto }) {
  return (
    <div
      className="etichetta"
      style={{
        width: '50mm',
        height: '30mm',
        boxSizing: 'border-box',
        padding: '2mm',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      {/* Barcode centrato */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <BarcodeEAN13 value={prodotto.barcode} />
      </div>

      {/* Testo centrato sotto il barcode */}
      <div style={{ width: '100%', marginTop: '1mm', textAlign: 'center', overflow: 'hidden' }}>
        <p
          style={{
            fontSize: '9pt',
            fontWeight: 'bold',
            color: '#000000',
            lineHeight: 1.2,
            margin: '0 0 0.5mm 0',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            wordBreak: 'break-word',
          }}
        >
          {prodotto.nome}
        </p>
        <p style={{ fontSize: '9pt', color: '#333333', margin: 0, lineHeight: 1.3 }}>
          {formatData(prodotto.data_preparazione)} · {prodotto.quantita} {prodotto.unita}
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

  // CSS di stampa — iniettato dinamicamente, rimosso al dismount
  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'etichetta-print-styles'
    style.textContent = `
      @page {
        size: 50mm 30mm landscape;
        margin: 0;
      }
      @media print {
        html, body {
          height: auto;
          margin: 0;
          padding: 0;
        }
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        * { visibility: hidden; }
        .etichetta, .etichetta * { visibility: visible; }
        .etichetta {
          position: fixed;
          top: 0;
          left: 0;
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

  // Avvia stampa automaticamente quando il prodotto è caricato
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
      {/* Header — display:none in stampa (print:hidden) */}
      <div className="print:hidden flex items-center justify-between mb-6">
        <Link to="/" className="text-sky-600 hover:text-sky-800 text-sm font-medium">
          ← Giacenze
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
        >
          🖨️ Stampa etichetta
        </button>
      </div>

      {/* Preview + etichetta reale in un unico wrapper senza display:none in stampa.
          In stampa il wrapper è visibility:hidden ma .etichetta dentro resta visible.
          position:fixed la porta in top:0,left:0 indipendentemente dal DOM parent. */}
      <div className="flex flex-col items-center gap-3">
        <p className="print:hidden text-xs text-gray-400 uppercase tracking-wide font-medium">
          Anteprima — 50 × 30 mm
        </p>

        {/* Bordo tratteggiato: visibile a schermo, invisible in stampa (visibility:hidden).
            NON ha print:hidden, così .etichetta figlio può usare visibility:visible. */}
        <div style={{ border: '1px dashed #9ca3af', display: 'inline-block' }}>
          <EtichettaLabel prodotto={prodotto} />
        </div>

        {!prodotto.barcode && (
          <p className="print:hidden text-xs text-red-400 text-center max-w-xs">
            ⚠️ Nessun barcode — aggiungi di nuovo il prodotto per generarlo.
          </p>
        )}
        <p className="print:hidden text-xs text-gray-400 text-center max-w-xs">
          La stampa si avvia automaticamente. Seleziona etichetta 50×30 mm nel dialogo di stampa.
        </p>
      </div>
    </div>
  )
}
