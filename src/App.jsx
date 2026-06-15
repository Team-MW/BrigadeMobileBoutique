import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { ShopProvider } from './context/ShopContext'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Ventes from './pages/Ventes'
import Factures from './pages/Factures'
import ClientForm from './pages/ClientForm'
import Debug from './pages/Debug'
import GrilleTarifaire from './pages/GrilleTarifaire'
import Organisation from './pages/Organisation'
import Stock from './pages/Stock'
import StockEcran from './pages/StockEcran'
import './index.css'

function Layout({ children }) {
  const location = useLocation()
  const isClientMode = location.pathname === '/depot'

  return (
    <div className="flex min-h-screen bg-background pb-16 md:pb-0">
      {!isClientMode && <Sidebar />}
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  )
}

function App() {
  return (
    <ShopProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ventes" element={<Ventes />} />
            <Route path="/factures" element={<Factures />} />
            <Route path="/depot" element={<ClientForm />} />
            <Route path="/tarifs" element={<GrilleTarifaire />} />
            <Route path="/organisation" element={<Organisation />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/stock-ecran" element={<StockEcran />} />
            <Route path="/debug" element={<Debug />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ShopProvider>
  )
}

export default App
