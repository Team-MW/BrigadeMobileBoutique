import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const ShopContext = createContext()

export function ShopProvider({ children }) {
  const [sales, setSales] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [isWorking, setIsWorking] = useState(false)

  // Fetch data from Supabase
  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .order('date', { ascending: false })
      
      if (salesError) throw salesError
      const mappedSales = (salesData || []).map(s => ({
        ...s,
        price: Number(s.price) || 0,
        cost: Number(s.cost) || 0,
        profit: Number(s.profit) || 0,
        clientPhone: s.clientphone,
        paymentMethod: s.paymentmethod,
        email: s.email
      }))
      setSales(mappedSales)

      const prevInvoices = await supabase
        .from('invoices')
        .select('*')
      
      const invoicesData = prevInvoices.data || []
      const invoicesError = prevInvoices.error
      
      if (invoicesError) console.error('Error fetching invoices:', invoicesError)
      
      const mappedInvoices = invoicesData.map(inv => ({
        ...inv,
        total: Number(inv.total) || 0,
        clientName: inv.clientname || inv.client_name || inv.client || 'Client',
        clientPhone: inv.clientphone || inv.client_phone || '',
        clientAddress: inv.clientaddress || inv.client_address || '',
        items: inv.items || [],
        createdAt: inv.createdat || inv.inserted_at || inv.created_at || new Date().toISOString()
      })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      setInvoices(mappedInvoices)
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
          const s = payload.new
          const mapped = { 
            ...s, 
            price: Number(s.price) || 0,
            cost: Number(s.cost) || 0,
            profit: Number(s.profit) || 0,
            clientPhone: s.clientphone, 
            paymentMethod: s.paymentmethod, 
            email: s.email 
          }
          setSales(prev => [mapped, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          const s = payload.new
          const mapped = { 
            ...s, 
            price: Number(s.price) || 0,
            cost: Number(s.cost) || 0,
            profit: Number(s.profit) || 0,
            clientPhone: s.clientphone, 
            paymentMethod: s.paymentmethod, 
            email: s.email 
          }
          setSales(prev => prev.map(item => item.id === s.id ? mapped : item))
        } else if (payload.eventType === 'DELETE') {
          setSales(prev => prev.filter(s => s.id !== payload.old.id))
        }
      })
      .subscribe()

    const invoicesSubscription = supabase
      .channel('invoices-channel')
      .on('postgres_changes', { event: '*', table: 'invoices' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const inv = payload.new
          const mapped = { 
            ...inv, 
            total: Number(inv.total) || 0,
            clientName: inv.clientname || inv.client_name || inv.client || 'Client', 
            clientPhone: inv.clientphone || inv.client_phone || '', 
            clientAddress: inv.clientaddress || inv.client_address || '',
            items: inv.items || [],
            createdAt: inv.createdat || inv.inserted_at || inv.created_at
          }
          setInvoices(prev => [mapped, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          const inv = payload.new
          const mapped = { 
            ...inv, 
            total: Number(inv.total) || 0,
            clientName: inv.clientname, 
            clientPhone: inv.clientphone, 
            clientAddress: inv.clientaddress,
            createdAt: inv.createdat || inv.inserted_at
          }
          setInvoices(prev => prev.map(item => item.id === inv.id ? mapped : item))
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
    setIsWorking(true)
    try {
      const saleRow = {
        client: sale.client,
        clientphone: sale.clientPhone,
        phone: sale.phone,
        service: sale.service,
        type: sale.type || 'Réparation',
        price: parseFloat(sale.price) || 0,
        cost: parseFloat(sale.cost) || 0,
        status: sale.status || 'En attente',
        paymentmethod: sale.paymentMethod || sale.paymentPreference || 'Espèces',
        notes: sale.notes,
        date: sale.date || new Date().toISOString().split('T')[0]
      }

      const { data, error } = await supabase
        .from('sales')
        .insert([saleRow])
        .select()
      
      if (error) throw error
      return (data && data.length > 0) ? data[0] : true
    } catch (error) {
      console.error('Erreur détaillée dans addSale:', error)
      return null
    } finally {
      setIsWorking(false)
    }
  }

  const updateSale = async (id, updates) => {
    setIsWorking(true)
    try {
      let finalUpdates = { ...updates }
      
      // If updating price or cost, recalculate profit
      if (updates.price !== undefined || updates.cost !== undefined) {
        const { data: currentSale } = await supabase.from('sales').select('*').eq('id', id).single()
        const newPrice = updates.price !== undefined ? updates.price : currentSale.price
        const newCost = updates.cost !== undefined ? updates.cost : currentSale.cost
        finalUpdates.profit = (parseFloat(newPrice) || 0) - (parseFloat(newCost) || 0)
      }

      // Map camelCase back to lowercase for DB
      if (finalUpdates.clientPhone !== undefined) {
        finalUpdates.clientphone = finalUpdates.clientPhone
        delete finalUpdates.clientPhone
      }
      if (finalUpdates.paymentMethod !== undefined) {
        finalUpdates.paymentmethod = finalUpdates.paymentMethod
        delete finalUpdates.paymentMethod
      }
      
      const { error } = await supabase
        .from('sales')
        .update(finalUpdates)
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      console.error('Detailed error in updateSale:', error)
    } finally {
      setIsWorking(false)
    }
  }

  const deleteSale = async (id) => {
    setIsWorking(true)
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      console.error('Error deleting sale:', error.message)
    } finally {
      setIsWorking(false)
    }
  }

  const addInvoice = async (invoiceData) => {
    setIsWorking(true)
    try {
      // Very simple insert with most likely column names
      const { data, error } = await supabase
        .from('invoices')
        .insert([{
          clientname: invoiceData.clientName || 'Client',
          clientphone: invoiceData.clientPhone || '',
          clientaddress: invoiceData.clientAddress || '',
          total: parseFloat(invoiceData.total) || 0,
          items: invoiceData.items || [],
          notes: invoiceData.notes || '',
          id: `FAC-${Date.now().toString().slice(-6)}` // Simple unique string ID
        }])
        .select()
      
      if (error) {
        // Simple fallback if ID was the issue
        const { data: data2, error: error2 } = await supabase
          .from('invoices')
          .insert([{
            clientname: invoiceData.clientName || 'Client',
            total: parseFloat(invoiceData.total) || 0,
            items: invoiceData.items || []
          }])
          .select()
        
        if (error2) throw error2
        return data2?.[0] || true
      }
      
      return data?.[0] || true
    } catch (error) {
      console.error('Invoice creation error:', error)
      return null
    } finally {
      setIsWorking(false)
    }
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
      invoices, addInvoice, deleteInvoice, loading, isWorking
    }}>
      {children}
    </ShopContext.Provider>
  )
}

export const useShop = () => useContext(ShopContext)
