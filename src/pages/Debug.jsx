import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'

export default function Debug() {
  const [status, setStatus] = useState({
    url: 'Checking...',
    key: 'Checking...',
    connection: 'Pending',
    tables: { sales: 'Pending', invoices: 'Pending' },
    invoiceSchema: null,
    error: null
  })

  useEffect(() => {
    async function check() {
      const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING'
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'MISSING'
      
      let connection = 'Checking...'
      let tables = { sales: 'Pending', invoices: 'Pending' }
      let invoiceSchema = null
      let error = null

      try {
        const { data, error: connError } = await supabase.from('sales').select('count', { count: 'exact', head: true })
        if (connError) throw connError
        connection = 'Connected'
        tables.sales = 'Found'
      } catch (e) {
        connection = 'Failed'
        error = e.message
      }

      try {
        const { data: invData, error: invError } = await supabase.from('invoices').select('*').limit(1)
        if (!invError) {
          tables.invoices = 'Found'
          if (invData && invData.length > 0) {
            invoiceSchema = Object.keys(invData[0]).join(', ')
          } else {
            invoiceSchema = "No data to inspect columns"
          }
        }
        else tables.invoices = 'Error: ' + invError.message
      } catch (e) {}

      setStatus({ url, key: key !== 'MISSING' ? 'Present (Hidden)' : 'MISSING', connection, tables, invoiceSchema, error })
    }
    check()
  }, [])

  return (
    <div className="flex-1 p-8 bg-background text-foreground space-y-6">
      <div className="flex items-center gap-3">
        <Info className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Diagnostic Supabase</h1>
      </div>

      <div className="grid gap-4 max-w-2xl">
        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">URL Supabase :</span>
            <code className="text-xs bg-secondary px-2 py-1 rounded">{status.url}</code>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Clé Anon :</span>
            <span className={status.key === 'MISSING' ? 'text-red-400' : 'text-green-400'}>{status.key}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-sm font-medium">Statut de Connexion :</span>
            <div className="flex items-center gap-2">
              {status.connection === 'Connected' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
              <span className={status.connection === 'Connected' ? 'text-green-400' : 'text-red-400'}>{status.connection}</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Vérification des Tables</h2>
          <div className="flex justify-between items-center">
            <span>Table `sales`</span>
            <span className={status.tables.sales === 'Found' ? 'text-green-400' : 'text-red-400'}>{status.tables.sales}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Table `invoices`</span>
            <span className={status.tables.invoices === 'Found' ? 'text-green-400' : 'text-red-400'}>{status.tables.invoices}</span>
          </div>
          {status.invoiceSchema && (
            <div className="mt-2 p-2 bg-secondary/50 rounded text-[10px] font-mono break-all text-muted-foreground">
              <span className="font-bold text-foreground">Colonnes détectées :</span> {status.invoiceSchema}
            </div>
          )}
        </div>

        {status.error && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-red-400">Erreur détectée :</p>
              <p className="text-xs text-red-400/80">{status.error}</p>
            </div>
          </div>
        )}
      </div>

      <div className="text-sm text-muted-foreground bg-blue-500/10 p-4 rounded-lg border border-blue-500/20 max-w-2xl">
        <p className="font-bold mb-1">💡 Solution possible :</p>
        <p>Si la connexion échoue mais que les clés sont présentes, vérifiez les "Policies" (RLS) dans Supabase. Elles doivent autoriser la lecture pour tout le monde (USING true).</p>
      </div>
    </div>
  )
}
