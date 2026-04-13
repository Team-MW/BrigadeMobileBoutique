import React, { createContext, useContext, useState, useEffect } from 'react'

// Empty data for testing
const initialSales = []

const ShopContext = createContext()

export function ShopProvider({ children }) {
  const [sales, setSales] = useState(() => {
    // We use a versioned key to force a reset if needed, or just allow manual clear
    const saved = localStorage.getItem('bm_sales_test')
    return saved ? JSON.parse(saved) : initialSales
  })
  const [nextId, setNextId] = useState(() => {
    const saved = localStorage.getItem('bm_next_id_test')
    return saved ? parseInt(saved) : 1
  })
  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem('bm_invoices_test')
    return saved ? JSON.parse(saved) : []
  })
  const [nextInvoiceId, setNextInvoiceId] = useState(() => {
    const saved = localStorage.getItem('bm_next_inv_id_test')
    return saved ? parseInt(saved) : 1
  })

  // Persistence
  useEffect(() => {
    localStorage.setItem('bm_sales_test', JSON.stringify(sales))
    localStorage.setItem('bm_next_id_test', nextId.toString())
  }, [sales, nextId])

  useEffect(() => {
    localStorage.setItem('bm_invoices_test', JSON.stringify(invoices))
    localStorage.setItem('bm_next_inv_id_test', nextInvoiceId.toString())
  }, [invoices, nextInvoiceId])

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'bm_sales_test' && e.newValue) {
        setSales(JSON.parse(e.newValue))
      }
      if (e.key === 'bm_invoices_test' && e.newValue) {
        setInvoices(JSON.parse(e.newValue))
      }
      if (e.key === 'bm_next_id_test' && e.newValue) {
        setNextId(parseInt(e.newValue))
      }
      if (e.key === 'bm_next_inv_id_test' && e.newValue) {
        setNextInvoiceId(parseInt(e.newValue))
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])


  const addSale = (sale) => {
    const newSale = {
      ...sale,
      id: nextId,
      profit: (parseFloat(sale.price) || 0) - (parseFloat(sale.cost) || 0),
    }
    setSales(prev => [newSale, ...prev])
    setNextId(prev => prev + 1)
    return newSale
  }

  const updateSale = (id, updates) => {
    setSales(prev => prev.map(s => {
      if (s.id === id) {
        const updated = { ...s, ...updates }
        updated.profit = (parseFloat(updated.price) || 0) - (parseFloat(updated.cost) || 0)
        return updated
      }
      return s
    }))
  }

  const deleteSale = (id) => {
    setSales(prev => prev.filter(s => s.id !== id))
  }

  const addInvoice = (invoiceData) => {
    const newInvoice = {
      ...invoiceData,
      id: `FAC-${new Date().getFullYear()}-${String(nextInvoiceId).padStart(4, '0')}`,
      internalId: nextInvoiceId,
      createdAt: new Date().toISOString(),
    }
    setInvoices(prev => [newInvoice, ...prev])
    setNextInvoiceId(prev => prev + 1)
    return newInvoice
  }

  const deleteInvoice = (id) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id))
  }

  // Stats calculation
  const getStats = (period = 'all') => {
    const now = new Date()
    let filteredSales = sales

    if (period === 'today') {
      const today = now.toISOString().split('T')[0]
      filteredSales = sales.filter(s => s.date === today)
    } else if (period === 'week') {
      const weekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0]
      filteredSales = sales.filter(s => s.date >= weekAgo)
    } else if (period === 'month') {
      const monthAgo = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
      filteredSales = sales.filter(s => s.date >= monthAgo)
    }

    const totalRevenue = filteredSales.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0)
    const totalCost = filteredSales.reduce((sum, s) => sum + (parseFloat(s.cost) || 0), 0)
    const totalProfit = totalRevenue - totalCost
    const completedSales = filteredSales.filter(s => s.status === 'Terminé').length
    const pendingSales = filteredSales.filter(s => s.status !== 'Terminé').length
    const repairCount = filteredSales.filter(s => s.type === 'Réparation').length
    const saleCount = filteredSales.filter(s => s.type === 'Vente').length

    // Revenue by service type
    const byService = {}
    filteredSales.forEach(s => {
      if (!byService[s.service]) byService[s.service] = { revenue: 0, count: 0 }
      byService[s.service].revenue += parseFloat(s.price) || 0
      byService[s.service].count++
    })

    // Revenue by day (last 7 days)
    const dailyRevenue = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
      const dayRevenue = sales
        .filter(s => s.date === dateStr)
        .reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0)
      const dayProfit = sales
        .filter(s => s.date === dateStr)
        .reduce((sum, s) => sum + (parseFloat(s.profit) || 0), 0)
      dailyRevenue.push({ date: dayLabel, revenue: dayRevenue, profit: dayProfit })
    }

    // Revenue by payment method
    const byPayment = {}
    filteredSales.forEach(s => {
      if (!byPayment[s.paymentMethod]) byPayment[s.paymentMethod] = 0
      byPayment[s.paymentMethod] += parseFloat(s.price) || 0
    })

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      totalSales: filteredSales.length,
      completedSales,
      pendingSales,
      repairCount,
      saleCount,
      byService: Object.entries(byService)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue),
      dailyRevenue,
      byPayment: Object.entries(byPayment).map(([name, value]) => ({ name, value })),
      marginRate: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0,
    }
  }

  return (
    <ShopContext.Provider value={{
      sales, addSale, updateSale, deleteSale, getStats,
      invoices, addInvoice, deleteInvoice
    }}>
      {children}
    </ShopContext.Provider>
  )
}

export const useShop = () => useContext(ShopContext)
