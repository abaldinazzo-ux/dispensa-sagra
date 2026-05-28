import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function formatDataOra(ts) {
  return new Date(ts).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Storico() {
  const [movimenti, setMovimenti] = useState([])
  const [loading, setLoading] = useState(true)
  const [errore, setErrore] = useState(null)
  const [filtro, setFiltro] = useState('tutti')

  async function carica() {
    setLoading(true)
    const { data, error } = await supabase
      .from('movimenti')
      .select(`
        *,
        prodotti (nome, unita)
      `)
      .order('data_ora', { ascending: false })
      .limit(200)

    if (error) setErrore(error.message)
    else setMovimenti(data || [])
    setLoading(false)
  }

  useEffect(() => { carica() }, [])

  const movimentiFiltrati = filtro === 'tutti'
    ? movimenti
    : movimenti.filter(m => m.tipo === filtro)

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-sky-600 border-t-transparent" />
    </div>
  )

  if (errore) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
      <p>{errore}</p>
      <button onClick={carica} className="text-sm underline mt-2">Riprova</button>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Storico movimenti</h2>
        <button onClick={carica} className="text-sky-600 text-sm font-medium">↻ Aggiorna</button>
      </div>

      {/* Filtro */}
      <div className="flex gap-2 mb-5">
        {[
          { val: 'tutti', label: 'Tutti' },
          { val: 'carico', label: 'Carichi' },
          { val: 'scarico', label: 'Scarichi' },
        ].map(({ val, label }) => (
          <button
            key={val}
            onClick={() => setFiltro(val)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              filtro === val
                ? 'bg-sky-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {movimentiFiltrati.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">📋</p>
          <p className="text-lg font-medium">Nessun movimento</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {movimentiFiltrati.map((m) => {
            const isCarico = m.tipo === 'carico'
            return (
              <div
                key={m.id}
                className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm flex items-start gap-3"
              >
                <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  isCarico
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {isCarico ? '📥' : '📤'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {m.prodotti?.nome ?? 'Prodotto eliminato'}
                    </p>
                    <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                      isCarico
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {isCarico ? '+' : '−'}{m.quantita} {m.prodotti?.unita}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDataOra(m.data_ora)}</p>
                  {m.note && (
                    <p className="text-xs text-gray-400 italic mt-0.5 truncate">{m.note}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
