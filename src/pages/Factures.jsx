import { useState } from 'react'
import { useShop } from '@/context/ShopContext'
import Header from '@/components/Header'
import InvoicePreview from '@/components/InvoicePreview'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, FileText, Trash2, Printer, X, Download, Eye } from 'lucide-react'

export default function Factures() {
  const { invoices, addInvoice, deleteInvoice, isWorking } = useShop()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [previewInvoice, setPreviewInvoice] = useState(null)
  
  const [form, setForm] = useState({
    clientName: '',
    clientAddress: '',
    clientPhone: '',
    items: [{ description: '', quantity: 1, price: 0 }],
    notes: ''
  })

  const filtered = invoices.filter(inv => {
    const name = inv.clientName || ''
    const id = inv.id || ''
    return name.toLowerCase().includes(search.toLowerCase()) ||
           id.toString().toLowerCase().includes(search.toLowerCase())
  })

  const handleAddItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, price: 0 }]
    }))
  }

  const handleRemoveItem = (index) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...form.items]
    newItems[index][field] = value
    setForm(prev => ({ ...prev, items: newItems }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const total = form.items.reduce((sum, item) => sum + (item.quantity * parseFloat(item.price || 0)), 0)
    const result = await addInvoice({ ...form, total })
    
    if (result) {
      setDialogOpen(false)
      setForm({
        clientName: '',
        clientAddress: '',
        clientPhone: '',
        items: [{ description: '', quantity: 1, price: 0 }],
        notes: ''
      })
    } else {
      alert("Erreur lors de la création de la facture.")
    }
  }

  const calculateTotal = () => {
    return form.items.reduce((sum, item) => sum + (item.quantity * parseFloat(item.price || 0)), 0)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
      {/* Global Loading Overlay */}
      {isWorking && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-background/40 backdrop-blur-[2px] transition-all duration-300">
          <div className="bg-card/80 p-6 rounded-2xl border border-border/50 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold tracking-tight animate-pulse">Traitement en cours...</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
      <Header title="Factures" subtitle={`${invoices.length} factures générées`} />

      <main className="flex-1 p-6 space-y-5 animate-fade-in print:hidden">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une facture..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Créer une facture
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Facture</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      Aucune facture trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs font-bold">{inv.id}</TableCell>
                      <TableCell>{new Date(inv.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>{inv.clientName}</TableCell>
                      <TableCell className="font-bold text-primary">{inv.total.toFixed(2)} €</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setPreviewInvoice(inv)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-500" onClick={() => deleteInvoice(inv.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Invoice Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle Facture Manuelle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom du Client</Label>
                <Input required value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Téléphone Client</Label>
                <Input value={form.clientPhone} onChange={e => setForm({...form, clientPhone: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Adresse/Détails Client</Label>
              <Input value={form.clientAddress} onChange={e => setForm({...form, clientAddress: e.target.value})} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Articles / Services</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  + Ajouter un article
                </Button>
              </div>
              <div className="space-y-2">
                {form.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Input placeholder="Description" required value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} />
                    </div>
                    <div className="w-20">
                      <Input type="number" placeholder="Qté" required min="1" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value))} />
                    </div>
                    <div className="w-32">
                      <Input type="number" placeholder="Prix" required step="0.01" value={item.price} onChange={e => handleItemChange(index, 'price', parseFloat(e.target.value))} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => handleRemoveItem(index)} disabled={form.items.length === 1}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-between items-center">
              <p className="text-lg font-bold">Total: {calculateTotal().toFixed(2)} €</p>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                <Button type="submit">Générer la Facture</Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <InvoicePreview 
        invoice={previewInvoice} 
        isOpen={!!previewInvoice} 
        onClose={() => setPreviewInvoice(null)} 
      />

      {/* Hidden print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print, #invoice-print * { visibility: visible; }
          #invoice-print { position: absolute; left: 0; top: 0; width: 100%; border: none !important; }
        }
      `}</style>
      </div>
    </div>
  )
}
