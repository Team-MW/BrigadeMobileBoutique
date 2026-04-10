import React, { createContext, useContext, useState } from 'react'

// Initial demo data
const initialSales = [
  {
    id: 1,
    date: '2026-04-10',
    client: 'Ahmed Benali',
    phone: 'iPhone 13',
    type: 'Réparation',
    service: 'Remplacement écran',
    price: 89,
    cost: 35,
    profit: 54,
    status: 'Terminé',
    paymentMethod: 'Espèces',
    notes: 'Écran OLED original'
  },
  {
    id: 2,
    date: '2026-04-10',
    client: 'Fatima Zohra',
    phone: 'Samsung S22',
    type: 'Réparation',
    service: 'Remplacement batterie',
    price: 45,
    cost: 18,
    profit: 27,
    status: 'Terminé',
    paymentMethod: 'Carte',
    notes: ''
  },
  {
    id: 3,
    date: '2026-04-09',
    client: 'Mohamed Ait',
    phone: 'Huawei P30',
    type: 'Réparation',
    service: 'Remplacement écran',
    price: 75,
    cost: 28,
    profit: 47,
    status: 'En cours',
    paymentMethod: 'Espèces',
    notes: 'En attente de pièce'
  },
  {
    id: 4,
    date: '2026-04-09',
    client: 'Sarah Mansouri',
    phone: 'iPhone 12',
    type: 'Vente',
    service: 'Coque protection',
    price: 15,
    cost: 4,
    profit: 11,
    status: 'Terminé',
    paymentMethod: 'Espèces',
    notes: ''
  },
  {
    id: 5,
    date: '2026-04-08',
    client: 'Youcef Hamidi',
    phone: 'Xiaomi 11',
    type: 'Réparation',
    service: 'Réparation connecteur de charge',
    price: 35,
    cost: 8,
    profit: 27,
    status: 'Terminé',
    paymentMethod: 'Virement',
    notes: ''
  },
  {
    id: 6,
    date: '2026-04-08',
    client: 'Nassima Kaci',
    phone: 'iPhone 14 Pro',
    type: 'Réparation',
    service: 'Remplacement écran',
    price: 149,
    cost: 65,
    profit: 84,
    status: 'Terminé',
    paymentMethod: 'Carte',
    notes: 'Écran original Apple'
  },
  {
    id: 7,
    date: '2026-04-07',
    client: 'Karim Bouzid',
    phone: 'Oppo Reno 8',
    type: 'Réparation',
    service: 'Remplacement batterie',
    price: 40,
    cost: 15,
    profit: 25,
    status: 'En attente',
    paymentMethod: 'Espèces',
    notes: 'Client à rappeler'
  },
  {
    id: 8,
    date: '2026-04-07',
    client: 'Amina Bensalem',
    phone: 'Samsung A53',
    type: 'Vente',
    service: 'Verre trempé',
    price: 8,
    cost: 1.5,
    profit: 6.5,
    status: 'Terminé',
    paymentMethod: 'Espèces',
    notes: ''
  },
  {
    id: 9,
    date: '2026-04-06',
    client: 'Rachid Tlemcani',
    phone: 'iPhone 11',
    type: 'Réparation',
    service: 'Remplacement écran',
    price: 79,
    cost: 32,
    profit: 47,
    status: 'Terminé',
    paymentMethod: 'Carte',
    notes: ''
  },
  {
    id: 10,
    date: '2026-04-05',
    client: 'Houria Meziane',
    phone: 'Realme 9',
    type: 'Réparation',
    service: 'Réparation micro',
    price: 30,
    cost: 10,
    profit: 20,
    status: 'Terminé',
    paymentMethod: 'Espèces',
    notes: ''
  },
]

const ShopContext = createContext()

export function ShopProvider({ children }) {
  const [sales, setSales] = useState(initialSales)
  const [nextId, setNextId] = useState(11)
  const [invoices, setInvoices] = useState([])
  const [nextInvoiceId, setNextInvoiceId] = useState(1)

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
