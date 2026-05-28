import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BadgeScadenza from '../components/BadgeScadenza'

function giorniDa(dataISO) {
  const oggi = new Date()
  oggi.setHours(0, 0, 0, 0)
  const data = new Date(dataISO)
  data.setHours(0, 0, 0, 0)
  return Math.floor((oggi - data) / (1000 * 60 * 60 * 24))
}

function formatData(dataISO) {
  return new Date(dataISO).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function Giacenze() {
  const [prodotti, setProdotti] = useState([])
  const [loading, setLoading] = useState(true)
  const [errore, setErrore] = useState(null)
  const [eliminando, setEliminando] = useState(null) // id del prodotto in corso di eliminazione
  const [conferma, setConferma] = useState(null)     // { id, nome }

  async function carica() {
    setLoading(true)
    const { data, error } = await supabase
      .from('prodotti')
      .select('*')
      .gt('quantita', 0)
      .order('data_preparazione', { ascending: true })
    if (error) setErrore(error.message)
    else setProdotti(data || [])
    setLoading(false)
  }

  async function eliminaProdotto(id) {
    setEliminando(id)
    // Elimina prima i movimenti collegati (FK è ON DELETE SET NULL, non CASCADE)
    await supabase.from('movimenti').delete().eq('prodotto_id', id)
    await supabase.from('prodotti').delete().eq('id', id)
    setProdotti(prev => prev.filter(p => p.id !== id))
    setConferma(null)
    setEliminando(null)
  }

  useEffect(() => { carica() }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-sky-600 border-t-transparent" />
    </div>
  )

  if (errore) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
      <p className="font-semibold">Errore di connessione</p>
      <p className="text-sm mt-1">{errore}</p>
      <button onClick={carica} className="mt-3 text-sm underline">Riprova</button>
    </div>
  )

  return (
    <div>
      {/* Dialogo conferma eliminazione */}
      {conferma && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <p className="text-gray-800 font-semibold text-base mb-1">Elimina prodotto</p>
            <p className="text-gray-600 text-sm mb-5">
              Sei sicuro di voler eliminare <strong>{conferma.nome}</strong>?
              Verranno eliminati anche tutti i movimenti collegati.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConferma(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={() => eliminaProdotto(conferma.id)}
                disabled={eliminando === conferma.id}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-2.5 rounded-xl transition-colors"
              >
                {eliminando === conferma.id ? 'Eliminazione…' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800">Giacenze</h2>
        <Link
          to="/aggiungi"
          className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <span>➕</span> Aggiungi
        </Link>
      </div>

      {/* Legenda badge */}
      <div className="flex gap-3 mb-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" /> ≤7 giorni
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" /> 8–30 giorni
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> &gt;30 giorni
        </span>
      </div>

      {prodotti.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">🧊</p>
          <p className="text-lg font-medium">Nessun prodotto in giacenza</p>
          <p className="text-sm mt-1">Aggiungi il primo prodotto</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {prodotti.map((p) => {
            const giorni = giorniDa(p.data_preparazione)
            let cardBorder = 'border-green-200'
            if (giorni > 30) cardBorder = 'border-red-200'
            else if (giorni > 7) cardBorder = 'border-yellow-200'

            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border-2 ${cardBorder} shadow-sm p-4`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-base truncate">{p.nome}</h3>
                      <BadgeScadenza dataPreparazione={p.data_preparazione} />
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {formatData(p.data_preparazione)} — {p.quantita} {p.unita}
                    </p>
                    {p.note && (
                      <p className="text-xs text-gray-400 mt-1 italic truncate">{p.note}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/etichetta/${p.id}`}
                      className="flex-shrink-0 bg-gray-100 hover:bg-sky-100 text-gray-600 hover:text-sky-700 rounded-xl p-2 text-sm transition-colors"
                      title="Stampa etichetta"
                    >
                      🏷️
                    </Link>
                    <button
                      onClick={() => setConferma({ id: p.id, nome: p.nome })}
                      className="flex-shrink-0 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 rounded-xl p-2 text-sm transition-colors"
                      title="Elimina prodotto"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
