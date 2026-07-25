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
        email: s.email,
        imei: s.imei,
        acompte: Number(s.acompte) || 0,
        unlockCode: s.unlock_code || s.unlockcode
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
            email: s.email,
            imei: s.imei,
            acompte: Number(s.acompte) || 0,
            unlockCode: s.unlock_code || s.unlockcode
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
            email: s.email,
            imei: s.imei,
            acompte: Number(s.acompte) || 0,
            unlockCode: s.unlock_code || s.unlockcode
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
        imei: sale.imei,
        acompte: parseFloat(sale.acompte) || 0,
        unlock_code: sale.unlockCode,
        date: sale.date || new Date().toISOString().split('T')[0],
        profit: (parseFloat(sale.price) || 0) - (parseFloat(sale.cost) || 0)
      }

      const { data, error } = await supabase
        .from('sales')
        .insert([saleRow])
        .select()
      
      if (error) throw error

      // Automatically cdfsvreate a ticket in the Organisation Kanban board
      if (data && data.length > 0) {
        const newSale = data[0]
        let ticketStatus = 'A FAIRE'
        if (newSale.status === 'En cours') ticketStatus = 'EN COURS'
        else if (newSale.status === 'Terminé') ticketStatus = 'TERMINÉ'

        // Retrieve current maximum position for that status to append to the end of the column
        const { data: posData } = await supabase
          .from('repair_tickets')
          .select('position')
          .eq('status', ticketStatus)
          .order('position', { ascending: false })
          .limit(1)

        const position = (posData && posData.length > 0) ? (posData[0].position + 1) : 0

        const { error: ticketError } = await supabase
          .from('repair_tickets')
          .insert([{
            title: `[${newSale.type.toUpperCase()}] ${newSale.service} - ${newSale.phone}`,
            client: newSale.client,
            phone: newSale.clientphone,
            status: ticketStatus,
            price: newSale.price,
            position: position
          }])

        if (ticketError) {
          console.error('Error inserting corresponding repair ticket:', ticketError)
        }
      }

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
      // 1. Clean up updates (don't send internal fields or IDs)
      const { 
        id: _id, 
        created_at, 
        inserted_at, 
        profit, 
        clientPhone, 
        paymentMethod,
        clientName, // just in case
        ...cleanUpdates 
      } = updates
      
      let finalUpdates = { ...cleanUpdates }
      
      // 2. Handle numbers if present
      if (updates.price !== undefined || updates.cost !== undefined) {
        // Fetch current values to calculate profit if one is missing
        const { data: current } = await supabase.from('sales').select('*').eq('id', id).single()
        const p = updates.price !== undefined ? parseFloat(updates.price) : current.price
        const c = updates.cost !== undefined ? parseFloat(updates.cost) : current.cost
        finalUpdates.price = p || 0
        finalUpdates.cost = c || 0
        finalUpdates.profit = (finalUpdates.price) - (finalUpdates.cost)
      }

      // 3. Map camelCase fields back to their DB counterparts
      if (updates.clientPhone !== undefined) finalUpdates.clientphone = updates.clientPhone
      if (updates.paymentMethod !== undefined) finalUpdates.paymentmethod = updates.paymentMethod
      
      console.log('Pushing updates to sales:', finalUpdates)
      const { error } = await supabase
        .from('sales')
        .update(finalUpdates)
        .eq('id', id)
      
      if (error) throw error
      console.log('Update successful')
    } catch (error) {
      console.error('Erreur détaillée dans updateSale:', error)
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
      const total = parseFloat(invoiceData.total) || 0
      const clientName = invoiceData.clientName || 'Client'
      
      // Attempt 1: Standard lowercase (clientname)
      let finalDate = invoiceData.emissionDate;
      if (finalDate && finalDate.length === 10) {
        const now = new Date().toISOString();
        finalDate = `${finalDate}T${now.split('T')[1]}`;
      }

      const payload1 = {
        clientname: clientName,
        clientphone: invoiceData.clientPhone || '',
        clientaddress: invoiceData.clientAddress || '',
        imei: invoiceData.imei || '',
        total: total,
        items: invoiceData.items || [],
        notes: invoiceData.notes || ''
      };
      if (finalDate) payload1.createdat = finalDate;
      const { data: d1, error: e1 } = await supabase.from('invoices').insert([payload1]).select()
      if (!e1) {
        fetchData();
        return d1?.[0] || true;
      }

      // Attempt 2: Minimal with 'client' (matches sales table)
      const payload2 = {
        client: clientName,
        total: total
      };
      if (finalDate) payload2.createdat = finalDate;
      const { data: d2, error: e2 } = await supabase.from('invoices').insert([payload2]).select()
      if (!e2) return d2?.[0] || true

      // Attempt 3: Underscores (client_name, total_amount)
      const payload3 = {
        client_name: clientName,
        total_amount: total
      };
      if (finalDate) payload3.createdat = finalDate;
      const { data: d3, error: e3 } = await supabase.from('invoices').insert([payload3]).select()
      if (!e3) return d3?.[0] || true

      // Final Attempt: Just total (most basic)
      const { data: d4, error: e4 } = await supabase.from('invoices').insert([{ total }]).select()
      if (!e4) return d4?.[0] || true

      console.error('All invoice insertion attempts failed:', e1?.message)
      return null
    } catch (error) {
      console.error('Invoice creation exception:', error)
      return null
    } finally {
      setIsWorking(false)
    }
  }

  const deleteInvoice = async (id) => {
    // Mise à jour immédiate de l'interface
    setInvoices(prev => prev.filter(inv => inv.id !== id))
    
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting invoice:', error.message)
      fetchData() // Recharge si erreur
    }
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
      sales, 
      invoices, 
      loading, 
      isWorking, 
      fetchData,
      addSale, 
      updateSale, 
      deleteSale, 
      addInvoice, 
      deleteInvoice,
      getStats
    }}>
      {children}
    </ShopContext.Provider>
  )
}

export const useShop = () => useContext(ShopContext)
