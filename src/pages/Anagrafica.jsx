import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const UNITA = ['pezzi', 'kg', 'porzioni', 'litri', 'g', 'confezioni']

export default function Anagrafica() {
  const [prodotti, setProdotti] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nome: '', unita: 'pezzi' })
  const [saving, setSaving] = useState(false)
  const [errore, setErrore] = useState(null)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({ nome: '', unita: 'pezzi' })
  const [confermaElimina, setConfermaElimina] = useState(null) // { id, nome }
  const [eliminando, setEliminando] = useState(null)

  async function carica() {
    const { data } = await supabase
      .from('prodotti_anagrafica')
      .select('*')
      .eq('attivo', true)
      .order('nome', { ascending: true })
    setProdotti(data || [])
    setLoading(false)
  }

  useEffect(() => { carica() }, [])

  async function aggiungi(e) {
    e.preventDefault()
    if (!form.nome.trim()) return
    setSaving(true)
    setErrore(null)
    const { error } = await supabase
      .from('prodotti_anagrafica')
      .insert([{ nome: form.nome.trim(), unita: form.unita }])
    if (error) setErrore(error.message)
    else {
      setForm({ nome: '', unita: 'pezzi' })
      await carica()
    }
    setSaving(false)
  }

  function startEdit(p) {
    setEditId(p.id)
    setEditForm({ nome: p.nome, unita: p.unita })
  }

  async function salvaModifica(id) {
    if (!editForm.nome.trim()) return
    const { error } = await supabase
      .from('prodotti_anagrafica')
      .update({ nome: editForm.nome.trim(), unita: editForm.unita })
      .eq('id', id)
    if (!error) {
      setEditId(null)
      await carica()
    }
  }

  async function elimina(id) {
    setEliminando(id)
    await supabase.from('prodotti_anagrafica').delete().eq('id', id)
    setProdotti(prev => prev.filter(p => p.id !== id))
    setConfermaElimina(null)
    setEliminando(null)
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-5">Prodotti</h2>

      {/* Dialogo conferma eliminazione */}
      {confermaElimina && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <p className="font-semibold text-gray-800 mb-1">Elimina prodotto</p>
            <p className="text-sm text-gray-600 mb-5">
              Sei sicuro di voler eliminare <strong>{confermaElimina.nome}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfermaElimina(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={() => elimina(confermaElimina.id)}
                disabled={eliminando === confermaElimina.id}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-2.5 rounded-xl transition-colors"
              >
                {eliminando === confermaElimina.id ? 'Eliminazione…' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form aggiungi */}
      <form onSubmit={aggiungi} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm mb-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">Aggiungi prodotto</p>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <input
            type="text"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Nome prodotto…"
            required
            className="flex-1 min-w-0 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <select
            value={form.unita}
            onChange={(e) => setForm({ ...form, unita: e.target.value })}
            className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {UNITA.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <button
            type="submit"
            disabled={saving || !form.nome.trim()}
            className="bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 text-white font-bold px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-colors"
          >
            {saving ? '…' : '➕ Aggiungi'}
          </button>
        </div>
        {errore && <p className="text-red-600 text-xs mt-2">{errore}</p>}
      </form>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-sky-600 border-t-transparent" />
        </div>
      ) : prodotti.length === 0 ? (
        <p className="text-center text-gray-400 py-10 text-sm">
          Nessun prodotto nell'anagrafica. Aggiungine uno sopra.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {prodotti.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
              {editId === p.id ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={editForm.nome}
                    onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && salvaModifica(p.id)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    autoFocus
                  />
                  <select
                    value={editForm.unita}
                    onChange={(e) => setEditForm({ ...editForm, unita: e.target.value })}
                    className="border border-gray-300 rounded-lg px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {UNITA.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <button
                    onClick={() => salvaModifica(p.id)}
                    className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold px-3 py-2 rounded-lg transition-colors"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setEditId(null)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm px-3 py-2 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm">{p.nome}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{p.unita}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(p)}
                      className="text-sky-500 hover:bg-sky-50 rounded-lg p-2 transition-colors"
                      title="Modifica"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setConfermaElimina({ id: p.id, nome: p.nome })}
                      className="text-red-400 hover:bg-red-50 rounded-lg p-2 transition-colors"
                      title="Elimina"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
