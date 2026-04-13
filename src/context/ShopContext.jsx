import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const ShopContext = createContext()

export function ShopProvider({ children }) {
  const [sales, setSales] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch data from Supabase
  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .order('date', { ascending: false })
      
      if (salesError) throw salesError
      setSales(salesData || [])

      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .order('createdAt', { ascending: false })
      
      if (invoicesError) throw invoicesError
      setInvoices(invoicesData || [])
    } catch (error) {
      console.error('Error fetching data:', error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Real-time subscriptions
    const salesSubscription = supabase
      .channel('sales-channel')
      .on('postgres_changes', { event: '*', table: 'sales' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setSales(prev => [payload.new, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setSales(prev => prev.map(s => s.id === payload.new.id ? payload.new : s))
        } else if (payload.eventType === 'DELETE') {
          setSales(prev => prev.filter(s => s.id !== payload.old.id))
        }
      })
      .subscribe()

    const invoicesSubscription = supabase
      .channel('invoices-channel')
      .on('postgres_changes', { event: '*', table: 'invoices' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setInvoices(prev => [payload.new, ...prev])
        } else if (payload.eventType === 'DELETE') {
          setInvoices(prev => prev.filter(inv => inv.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(salesSubscription)
      supabase.removeChannel(invoicesSubscription)
    }
  }, [])

  const addSale = async (sale) => {
    const profit = (parseFloat(sale.price) || 0) - (parseFloat(sale.cost) || 0)
    const { data, error } = await supabase
      .from('sales')
      .insert([{ ...sale, profit }])
      .select()
    
    if (error) {
      console.error('Error adding sale:', error.message)
      return null
    }
    return data[0]
  }

  const updateSale = async (id, updates) => {
    // If updating price or cost, recalculate profit
    let finalUpdates = { ...updates }
    if (updates.price !== undefined || updates.cost !== undefined) {
      const { data: currentSale } = await supabase.from('sales').select('*').eq('id', id).single()
      const newPrice = updates.price !== undefined ? updates.price : currentSale.price
      const newCost = updates.cost !== undefined ? updates.cost : currentSale.cost
      finalUpdates.profit = (parseFloat(newPrice) || 0) - (parseFloat(newCost) || 0)
    }

    const { error } = await supabase
      .from('sales')
      .update(finalUpdates)
      .eq('id', id)
    
    if (error) console.error('Error updating sale:', error.message)
  }

  const deleteSale = async (id) => {
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id)
    
    if (error) console.error('Error deleting sale:', error.message)
  }

  const addInvoice = async (invoiceData) => {
    const nextId = invoices.length + 1
    const newInvoice = {
      ...invoiceData,
      id: `FAC-${new Date().getFullYear()}-${String(nextId).padStart(4, '0')}`,
      createdAt: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('invoices')
      .insert([newInvoice])
      .select()
    
    if (error) {
      console.error('Error adding invoice:', error.message)
      return null
    }
    return data[0]
  }

  const deleteInvoice = async (id) => {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
    
    if (error) console.error('Error deleting invoice:', error.message)
  }

  // Stats calculation (similar to before, but using the state)
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

    const byService = {}
    filteredSales.forEach(s => {
      if (!byService[s.service]) byService[s.service] = { revenue: 0, count: 0 }
      byService[s.service].revenue += parseFloat(s.price) || 0
      byService[s.service].count++
    })

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
      invoices, addInvoice, deleteInvoice, loading
    }}>
      {children}
    </ShopContext.Provider>
  )
}

export const useShop = () => useContext(ShopContext)
