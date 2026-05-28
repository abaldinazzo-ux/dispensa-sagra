import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { generaEAN13 } from '../lib/ean13'

const UNITA = ['pezzi', 'kg', 'porzioni', 'litri', 'g', 'confezioni']

function oggiISO() {
  return new Date().toISOString().split('T')[0]
}

export default function AggiungiProdotto() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nome: '',
    quantita: '',
    unita: 'pezzi',
    data_preparazione: oggiISO(),
    note: '',
  })
  const [saving, setSaving] = useState(false)
  const [errore, setErrore] = useState(null)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

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

    // Registra movimento di carico
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
      <h2 className="text-xl font-bold text-gray-800 mb-5">Aggiungi prodotto</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Nome */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Nome prodotto <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            placeholder="es. Ragù, Costine al forno…"
            required
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>

        {/* Quantità + Unità */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Quantità <span className="text-red-500">*</span>
            </label>
            <input
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
              {UNITA.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Data preparazione */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Data preparazione
          </label>
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
            rows={3}
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
          disabled={saving || !form.nome.trim() || !form.quantita}
          className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl text-base transition-colors"
        >
          {saving ? 'Salvataggio…' : '✅ Salva e stampa etichetta'}
        </button>
      </form>
    </div>
  )
}
