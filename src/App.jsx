import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ShopProvider } from './context/ShopContext'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Ventes from './pages/Ventes'
import Factures from './pages/Factures'
import './index.css'

function App() {
  return (
    <ShopProvider>
      <BrowserRouter>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/ventes" element={<Ventes />} />
              <Route path="/factures" element={<Factures />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </ShopProvider>
  )
}

export default App
