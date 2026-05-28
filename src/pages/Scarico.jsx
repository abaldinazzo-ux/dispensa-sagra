import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function formatData(dataISO) {
  return new Date(dataISO).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function Scarico() {
  const [barcodeInput, setBarcodeInput] = useState('')
  const [prodotto, setProdotto] = useState(null)
  const [cercando, setCercando] = useState(false)
  const [errore, setErrore] = useState(null)
  const [quantitaScarico, setQuantitaScarico] = useState('')
  const [noteScarico, setNoteScarico] = useState('')
  const [saving, setSaving] = useState(false)
  const [successo, setSuccesso] = useState(null)
  const inputRef = useRef(null)

  // Focus automatico sull'input QR al mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function cercaProdotto(codice) {
    if (!codice.trim()) return
    setCercando(true)
    setErrore(null)
    setProdotto(null)
    setSuccesso(null)

    const { data, error } = await supabase
      .from('prodotti')
      .select('*')
      .eq('barcode', codice.trim())
      .single()

    if (error || !data) {
      setErrore('Prodotto non trovato. Verifica il codice a barre.')
    } else if (data.quantita <= 0) {
      setErrore('Questo prodotto è già stato completamente scaricato.')
    } else {
      setProdotto(data)
      setQuantitaScarico(String(data.quantita))
    }
    setCercando(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      e.preventDefault()
      cercaProdotto(barcodeInput)
    }
  }

  async function handleScarico(e) {
    e.preventDefault()
    if (!prodotto) return
    const qty = parseFloat(quantitaScarico)
    if (!qty || qty <= 0) return
    if (qty > prodotto.quantita) {
      setErrore(`Quantità superiore alla giacenza disponibile (${prodotto.quantita} ${prodotto.unita})`)
      return
    }

    setSaving(true)
    setErrore(null)

    const nuovaQuantita = prodotto.quantita - qty

    const [updateRes, movimentoRes] = await Promise.all([
      supabase
        .from('prodotti')
        .update({ quantita: nuovaQuantita })
        .eq('id', prodotto.id),
      supabase.from('movimenti').insert([{
        prodotto_id: prodotto.id,
        tipo: 'scarico',
        quantita: qty,
        note: noteScarico.trim() || null,
      }]),
    ])

    if (updateRes.error) {
      setErrore(updateRes.error.message)
      setSaving(false)
      return
    }

    setSuccesso({
      nome: prodotto.nome,
      qty,
      unita: prodotto.unita,
      nuovaQuantita,
    })
    setProdotto(null)
    setBarcodeInput('')
    setQuantitaScarico('')
    setNoteScarico('')
    setSaving(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  function reset() {
    setProdotto(null)
    setBarcodeInput('')
    setQuantitaScarico('')
    setNoteScarico('')
    setErrore(null)
    setSuccesso(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-5">Scarico prodotto</h2>

      {/* Messaggio successo */}
      {successo && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-5">
          <p className="text-green-700 font-semibold">✅ Scarico registrato</p>
          <p className="text-green-600 text-sm mt-1">
            <strong>{successo.nome}</strong>: scaricati {successo.qty} {successo.unita}
          </p>
          <p className="text-green-500 text-xs mt-0.5">
            Rimanente: {successo.nuovaQuantita} {successo.unita}
          </p>
        </div>
      )}

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
            placeholder="Scansiona con lo scanner USB (invio automatico) o digita qui…"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-mono tracking-wider"
          />
          <button
            onClick={() => cercaProdotto(barcodeInput)}
            disabled={cercando || !barcodeInput.trim()}
            className="bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 text-white font-bold px-4 py-3 rounded-xl transition-colors text-sm"
          >
            {cercando ? '…' : 'Cerca'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Lo scanner USB invia invio automaticamente dopo la scansione — basta puntare sull'etichetta.
        </p>
      </div>

      {/* Errore */}
      {errore && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm mb-4">
          {errore}
        </div>
      )}

      {/* Dettaglio prodotto trovato */}
      {prodotto && (
        <form onSubmit={handleScarico} className="bg-white rounded-2xl border-2 border-sky-200 p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-black text-gray-900">{prodotto.nome}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Preparato il {formatData(prodotto.data_preparazione)}
            </p>
            <p className="text-sky-700 font-semibold text-sm mt-1">
              Disponibile: {prodotto.quantita} {prodotto.unita}
            </p>
            {prodotto.note && (
              <p className="text-xs text-gray-400 italic mt-1">{prodotto.note}</p>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Quantità da scaricare
                </label>
                <input
                  type="number"
                  value={quantitaScarico}
                  onChange={(e) => setQuantitaScarico(e.target.value)}
                  min="0.1"
                  max={prodotto.quantita}
                  step="0.1"
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <span className="text-gray-500 font-medium pb-3">{prodotto.unita}</span>
            </div>

            {/* Bottoni scarico rapido */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setQuantitaScarico(String(prodotto.quantita))}
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold text-sm py-2 rounded-xl transition-colors"
              >
                Tutto ({prodotto.quantita} {prodotto.unita})
              </button>
              {prodotto.quantita > 1 && (
                <button
                  type="button"
                  onClick={() => setQuantitaScarico(String(Math.floor(prodotto.quantita / 2)))}
                  className="flex-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 font-semibold text-sm py-2 rounded-xl transition-colors"
                >
                  Metà
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Note scarico</label>
              <input
                type="text"
                value={noteScarico}
                onChange={(e) => setNoteScarico(e.target.value)}
                placeholder="es. Consumato al tavolo 5…"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={reset}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {saving ? 'Registrazione…' : '📤 Scarica'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
