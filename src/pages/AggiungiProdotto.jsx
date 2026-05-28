import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { generaEAN13 } from '../lib/ean13'

const UNITA = ['pezzi', 'kg', 'porzioni', 'litri', 'g', 'confezioni']

function oggiISO() {
  return new Date().toISOString().split('T')[0]
}

export default function AggiungiProdotto() {
  const navigate = useNavigate()
  const qtaRef = useRef(null)

  const [anagraficaList, setAnagraficaList] = useState([])
  const [loadingAnagrafica, setLoadingAnagrafica] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const [form, setForm] = useState({
    nome: '',
    quantita: '',
    unita: 'pezzi',
    data_preparazione: oggiISO(),
    note: '',
  })
  const [saving, setSaving] = useState(false)
  const [errore, setErrore] = useState(null)

  useEffect(() => {
    supabase
      .from('prodotti_anagrafica')
      .select('*')
      .eq('attivo', true)
      .order('nome', { ascending: true })
      .then(({ data }) => {
        setAnagraficaList(data || [])
        setLoadingAnagrafica(false)
      })
  }, [])

  function selezionaProdotto(p) {
    setSelectedId(p.id)
    setForm(f => ({ ...f, nome: p.nome, unita: p.unita }))
    setTimeout(() => qtaRef.current?.focus(), 100)
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const prodottiFiltrati = anagraficaList.filter(p =>
    p.nome.toLowerCase().includes(filtro.toLowerCase())
  )

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nome.trim() || !form.quantita) return
    setSaving(true)
    setErrore(null)

    const barcode = generaEAN13()

    const { data, error } = await supabase
      .from('prodotti')
      .insert([{
        nome: form.nome.trim(),
        quantita: parseFloat(form.quantita),
        unita: form.unita,
        data_preparazione: form.data_preparazione,
        note: form.note.trim() || null,
        barcode,
      }])
      .select()
      .single()

    if (error) {
      setErrore(error.message)
      setSaving(false)
      return
    }

    await supabase.from('movimenti').insert([{
      prodotto_id: data.id,
      tipo: 'carico',
      quantita: parseFloat(form.quantita),
      note: 'Carico iniziale',
    }])

    navigate(`/etichetta/${data.id}`)
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-5">Aggiungi giacenza</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Selezione prodotto */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-700">
              Prodotto <span className="text-red-500">*</span>
            </label>
            <Link to="/anagrafica" className="text-xs text-sky-600 hover:text-sky-800">
              Gestisci prodotti →
            </Link>
          </div>

          {/* Ricerca */}
          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="🔍 Cerca prodotto…"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />

          {/* Griglia touch-friendly */}
          {loadingAnagrafica ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-4 border-sky-600 border-t-transparent" />
            </div>
          ) : prodottiFiltrati.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              {filtro
                ? 'Nessun prodotto trovato.'
                : <>Nessun prodotto nell'anagrafica.{' '}
                    <Link to="/anagrafica" className="text-sky-600 underline">Aggiungine uno</Link>.
                  </>
              }
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {prodottiFiltrati.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selezionaProdotto(p)}
                  className={`
                    min-h-[60px] rounded-xl border-2 px-3 py-2 text-left transition-colors
                    flex flex-col justify-center
                    ${selectedId === p.id
                      ? 'border-sky-500 bg-sky-50 text-sky-800'
                      : 'border-gray-200 bg-white text-gray-800 hover:border-sky-300 hover:bg-sky-50'
                    }
                  `}
                >
                  <span className="font-semibold text-sm leading-tight">{p.nome}</span>
                  <span className="text-xs text-gray-400 mt-0.5">{p.unita}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Resto del form — visibile solo dopo aver selezionato un prodotto */}
        {form.nome && (
          <>
            {/* Badge prodotto selezionato */}
            <div className="flex items-center gap-2 bg-sky-50 border border-sky-200 rounded-xl px-4 py-2.5">
              <span className="text-sky-600 text-sm">✅</span>
              <span className="font-bold text-sky-800 text-sm">{form.nome}</span>
            </div>

            {/* Quantità + Unità */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Quantità <span className="text-red-500">*</span>
                </label>
                <input
                  ref={qtaRef}
                  type="number"
                  name="quantita"
                  value={form.quantita}
                  onChange={handleChange}
                  placeholder="0"
                  min="0.1"
                  step="0.1"
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
              <div className="w-36">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Unità</label>
                <select
                  name="unita"
                  value={form.unita}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white"
                >
                  {UNITA.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* Data preparazione */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Data preparazione</label>
              <input
                type="date"
                name="data_preparazione"
                value={form.data_preparazione}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Note</label>
              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                placeholder="Ingredienti, allergeni, istruzioni di cottura…"
                rows={2}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
              />
            </div>

            {errore && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
                {errore}
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !form.quantita}
              className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl text-base transition-colors"
            >
              {saving ? 'Salvataggio…' : '✅ Salva e stampa etichetta'}
            </button>
          </>
        )}
      </form>
    </div>
  )
}
