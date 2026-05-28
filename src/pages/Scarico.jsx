import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function formatOra(date) {
  return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function Scarico() {
  const [barcodeInput, setBarcodeInput] = useState('')
  const [cercando, setCercando] = useState(false)
  const [errore, setErrore] = useState(null)
  const [scarichiRecenti, setScarichiRecenti] = useState([]) // max 3 ultimi scarichi
  const [annullando, setAnnullando] = useState(new Set())
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function cercaEScaricare(codice) {
    if (!codice.trim()) return
    setCercando(true)
    setErrore(null)

    const { data: prod, error } = await supabase
      .from('prodotti')
      .select('*')
      .eq('barcode', codice.trim())
      .single()

    if (error || !prod) {
      setErrore('Prodotto non trovato. Verifica il codice a barre.')
      setCercando(false)
      return
    }
    if (prod.quantita <= 0) {
      setErrore(`"${prod.nome}" è già completamente scaricato.`)
      setCercando(false)
      setBarcodeInput('')
      setTimeout(() => inputRef.current?.focus(), 100)
      return
    }

    const qty = prod.quantita

    const [updateRes, movRes] = await Promise.all([
      supabase.from('prodotti').update({ quantita: 0 }).eq('id', prod.id),
      supabase.from('movimenti')
        .insert([{ prodotto_id: prod.id, tipo: 'scarico', quantita: qty }])
        .select('id')
        .single(),
    ])

    if (updateRes.error) {
      setErrore(updateRes.error.message)
      setCercando(false)
      return
    }

    const movimentoId = movRes.data?.id ?? null

    setScarichiRecenti(prev => [
      { movimentoId, prodottoId: prod.id, nome: prod.nome, qty, unita: prod.unita, ora: new Date() },
      ...prev,
    ].slice(0, 3))

    setBarcodeInput('')
    setCercando(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  async function annullaScarico(scarico) {
    setAnnullando(prev => new Set([...prev, scarico.movimentoId]))

    // Rilegge la quantità attuale prima di ripristinare (altri scarichi potrebbero essere avvenuti)
    const { data: attuale } = await supabase
      .from('prodotti')
      .select('quantita')
      .eq('id', scarico.prodottoId)
      .single()

    const quantitaRipristinata = (attuale?.quantita ?? 0) + scarico.qty

    await Promise.all([
      supabase.from('prodotti').update({ quantita: quantitaRipristinata }).eq('id', scarico.prodottoId),
      supabase.from('movimenti').delete().eq('id', scarico.movimentoId),
    ])

    setScarichiRecenti(prev => prev.filter(s => s.movimentoId !== scarico.movimentoId))
    setAnnullando(prev => { const next = new Set(prev); next.delete(scarico.movimentoId); return next })
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      e.preventDefault()
      cercaEScaricare(barcodeInput)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-5">Scarico prodotto</h2>

      {/* Input barcode */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          🔍 Scansiona il codice a barre EAN-13
        </label>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scansiona con lo scanner USB…"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-mono tracking-wider"
          />
          <button
            onClick={() => cercaEScaricare(barcodeInput)}
            disabled={cercando || !barcodeInput.trim()}
            className="bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 text-white font-bold px-4 py-3 rounded-xl transition-colors text-sm"
          >
            {cercando ? '…' : 'Scarica'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Lo scanner invia invio automaticamente — lo scarico totale viene eseguito subito.
        </p>
      </div>

      {/* Errore */}
      {errore && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm mb-4">
          {errore}
        </div>
      )}

      {/* Ultimi 3 scarichi */}
      {scarichiRecenti.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Ultimi scarichi
          </h3>
          <div className="flex flex-col gap-2">
            {scarichiRecenti.map((s) => (
              <div
                key={s.movimentoId ?? s.ora.toISOString()}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{s.nome}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {s.qty} {s.unita} · {formatOra(s.ora)}
                  </p>
                </div>
                <button
                  onClick={() => annullaScarico(s)}
                  disabled={!s.movimentoId || annullando.has(s.movimentoId)}
                  className="flex-shrink-0 text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {annullando.has(s.movimentoId) ? '…' : 'Annulla'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
