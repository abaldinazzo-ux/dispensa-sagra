import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Giacenze from './pages/Giacenze'
import AggiungiProdotto from './pages/AggiungiProdotto'
import StampaEtichetta from './pages/StampaEtichetta'
import Scarico from './pages/Scarico'
import Storico from './pages/Storico'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Giacenze />} />
          <Route path="aggiungi" element={<AggiungiProdotto />} />
          <Route path="etichetta/:id" element={<StampaEtichetta />} />
          <Route path="scarico" element={<Scarico />} />
          <Route path="storico" element={<Storico />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
