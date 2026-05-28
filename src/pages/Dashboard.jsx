import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'

function formatDataOra(ts) {
  return new Date(ts).toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

function fmt(n) {
  const v = typeof n === 'string' ? parseFloat(n) : n
  return Number.isInteger(v) ? v : parseFloat(v.toFixed(1))
}

export default function Dashboard() {
  const [prodotti, setProdotti] = useState([])
  const [movimenti, setMovimenti] = useState([])
  const [loading, setLoading] = useState(true)
  const [errore, setErrore] = useState(null)
  const [soglia, setSoglia] = useState(5)

  async function carica() {
    setLoading(true)
    setErrore(null)
    const [prodRes, movRes] = await Promise.all([
      supabase
        .from('prodotti')
        .select('nome, quantita, unita')
        .gt('quantita', 0),
      supabase
        .from('movimenti')
        .select('id, tipo, quantita, data_ora, note, prodotti(nome, unita)')
        .order('data_ora', { ascending: false })
        .limit(5),
    ])
    if (prodRes.error) {
      setErrore(prodRes.error.message)
    } else {
      setProdotti(prodRes.data || [])
      setMovimenti(movRes.data || [])
    }
    setLoading(false)
  }

  useEffect(() => { carica() }, [])

  // Raggruppa per nome e somma le quantità
  const totaliPerProdotto = useMemo(() => {
    const map = {}
    prodotti.forEach(p => {
      if (!map[p.nome]) map[p.nome] = { nome: p.nome, unita: p.unita, quantita: 0 }
      map[p.nome].quantita += parseFloat(p.quantita)
    })
    return Object.values(map).sort((a, b) => b.quantita - a.quantita)
  }, [prodotti])

  // Totale per unità di misura
  const totalePerUnita = useMemo(() => {
    const map = {}
    prodotti.forEach(p => { map[p.unita] = (map[p.unita] || 0) + parseFloat(p.quantita) })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [prodotti])

  // Prodotti sotto soglia
  const giacenzeBasse = useMemo(
    () => totaliPerProdotto.filter(p => p.quantita <= soglia),
    [totaliPerProdotto, soglia]
  )

  const maxQta = totaliPerProdotto[0]?.quantita || 1
  const nLotti = prodotti.length
  const nTipi = totaliPerProdotto.length

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
    <div className="flex flex-col gap-5">

      {/* Titolo */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
        <button
          onClick={carica}
          className="text-sky-600 hover:text-sky-800 text-sm font-medium"
        >
          ↻ Aggiorna
        </button>
      </div>

      {/* KPI — totali in freezer */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wide mb-1">Tipi prodotto</p>
          <p className="text-4xl font-black text-sky-800 leading-none">{nTipi}</p>
          <p className="text-xs text-sky-400 mt-1">prodotti distinti</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1">Lotti attivi</p>
          <p className="text-4xl font-black text-emerald-800 leading-none">{nLotti}</p>
          <p className="text-xs text-emerald-400 mt-1">confezioni / batch</p>
        </div>
        {totalePerUnita.map(([unita, qta]) => (
          <div key={unita} className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wide mb-1">
              Totale {unita}
            </p>
            <p className="text-4xl font-black text-violet-800 leading-none">{fmt(qta)}</p>
            <p className="text-xs text-violet-400 mt-1">in freezer oggi</p>
          </div>
        ))}
      </div>

      {/* Giacenze per prodotto */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">
          Giacenze per prodotto
        </h3>
        {totaliPerProdotto.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-4">Nessuna giacenza</p>
        ) : (
          <div className="flex flex-col gap-3.5">
            {totaliPerProdotto.map(p => {
              const pct = (p.quantita / maxQta) * 100
              const isBassa = p.quantita <= soglia
              const barColor = isBassa
                ? 'bg-red-400'
                : pct > 50 ? 'bg-emerald-400' : 'bg-yellow-400'
              return (
                <div key={p.nome}>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className={`text-sm font-semibold ${isBassa ? 'text-red-600' : 'text-gray-800'}`}>
                      {p.nome}
                      {isBassa && <span className="ml-1.5 text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">BASSA</span>}
                    </span>
                    <span className={`text-sm font-bold tabular-nums ${isBassa ? 'text-red-600' : 'text-gray-700'}`}>
                      {fmt(p.quantita)}{' '}
                      <span className="font-normal text-xs text-gray-400">{p.unita}</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${barColor}`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Giacenza bassa */}
      <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wide">
            ⚠️ Giacenza bassa
          </h3>
          <label className="flex items-center gap-1.5 text-xs text-gray-500">
            Soglia
            <input
              type="number"
              min="0"
              step="1"
              value={soglia}
              onChange={e => setSoglia(Number(e.target.value))}
              className="w-14 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </label>
        </div>
        {giacenzeBasse.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-3">
            Tutti i prodotti sono sopra la soglia ✅
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {giacenzeBasse.map(p => (
              <div
                key={p.nome}
                className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5"
              >
                <span className="text-sm font-semibold text-orange-900">{p.nome}</span>
                <span className="text-sm font-bold text-orange-700 tabular-nums">
                  {fmt(p.quantita)}{' '}
                  <span className="font-normal text-xs text-orange-400">{p.unita}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ultimi 5 movimenti */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
          Ultimi movimenti
        </h3>
        {movimenti.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-4">Nessun movimento registrato</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {movimenti.map(m => {
              const isCarico = m.tipo === 'carico'
              return (
                <div key={m.id} className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    isCarico ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {isCarico ? '📥' : '📤'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {m.prodotti?.nome ?? 'Prodotto eliminato'}
                    </p>
                    <p className="text-xs text-gray-400">{formatDataOra(m.data_ora)}</p>
                  </div>
                  <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                    isCarico
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {isCarico ? '+' : '−'}{fmt(m.quantita)}{' '}{m.prodotti?.unita ?? ''}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
