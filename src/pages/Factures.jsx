import { useState } from 'react'
import { useShop } from '@/context/ShopContext'
import Header from '@/components/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, FileText, Trash2, Printer, X, Download, Eye } from 'lucide-react'

export default function Factures() {
  const { invoices, addInvoice, deleteInvoice } = useShop()
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

  const filtered = invoices.filter(inv => 
    inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
    inv.id.toLowerCase().includes(search.toLowerCase())
  )

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

  const handleSubmit = (e) => {
    e.preventDefault()
    const total = form.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
    addInvoice({ ...form, total })
    setDialogOpen(false)
    setForm({
      clientName: '',
      clientAddress: '',
      clientPhone: '',
      items: [{ description: '', quantity: 1, price: 0 }],
      notes: ''
    })
  }

  const calculateTotal = () => {
    return form.items.reduce((sum, item) => sum + (item.quantity * parseFloat(item.price || 0)), 0)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
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

      {/* Preview Dialog */}
      {previewInvoice && (
        <Dialog open={!!previewInvoice} onOpenChange={() => setPreviewInvoice(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white text-black">
            <div id="invoice-print" className="p-10 space-y-8 min-h-[800px]">
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <img src="/logo.png" alt="Logo" className="h-16 object-contain" onError={(e) => e.target.style.display = 'none'} />
                  <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter">
                      Brigade Mobile
                    </h1>
                    <p className="text-gray-500 text-xs mt-0.5">Réparation de téléphones & Vente d'accessoires</p>
                    <div className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Émetteur</div>
                    <p className="text-sm font-bold">Brigade Mobile</p>
                    <p className="text-sm">65 route de blagnac</p>
                    <p className="text-sm">31200 Toulouse</p>
                    <p className="text-xs font-mono text-gray-500 mt-1">SIRET: 78899543900023</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-gray-100 px-4 py-2 rounded-lg inline-block">
                    <p className="text-xs font-bold text-gray-500 uppercase">N° Facture</p>
                    <p className="text-xl font-mono font-bold">{previewInvoice.id}</p>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-bold text-gray-500 uppercase">Date</p>
                    <p className="text-sm font-medium">{new Date(previewInvoice.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-10 border-y border-gray-100 py-8">
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Facturé à</div>
                  <p className="text-lg font-bold">{previewInvoice.clientName}</p>
                  {previewInvoice.clientAddress && <p className="text-sm">{previewInvoice.clientAddress}</p>}
                  {previewInvoice.clientPhone && <p className="text-sm">Tél: {previewInvoice.clientPhone}</p>}
                </div>
                <div>
                   {/* Empty for design */}
                </div>
              </div>

              <div className="space-y-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-gray-900">
                      <th className="py-3 text-sm font-bold uppercase">Description</th>
                      <th className="py-3 text-sm font-bold uppercase text-center w-24">Qté</th>
                      <th className="py-3 text-sm font-bold uppercase text-right w-32">Prix Unitaire</th>
                      <th className="py-3 text-sm font-bold uppercase text-right w-32">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewInvoice.items.map((item, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-4 text-sm font-medium">{item.description}</td>
                        <td className="py-4 text-sm text-center">{item.quantity}</td>
                        <td className="py-4 text-sm text-right">{parseFloat(item.price).toFixed(2)} €</td>
                        <td className="py-4 text-sm font-bold text-right">{(item.quantity * item.price).toFixed(2)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-10">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-gray-500">
                    <span className="text-sm">Total Hors Taxes (HT)</span>
                    <span className="text-sm">{(previewInvoice.total / 1.2).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span className="text-sm">TVA (20%)</span>
                    <span className="text-sm">{(previewInvoice.total - (previewInvoice.total / 1.2)).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-900">
                    <span className="text-lg font-black uppercase">Total TTC</span>
                    <span className="text-2xl font-black">{previewInvoice.total.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {previewInvoice.notes && (
                <div className="bg-gray-50 p-4 rounded-lg mt-auto">
                   <p className="text-xs font-bold text-gray-400 uppercase mb-1">Notes</p>
                   <p className="text-sm italic text-gray-600">{previewInvoice.notes}</p>
                </div>
              )}

              <div className="text-center pt-10 text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">
                Brigade Mobile — SIRET: 78899543900023 — 65 route de blagnac, 31200 Toulouse<br />
                En cas de réparation, la garantie est de 3 mois (hors casse, oxydation ou intervention tiers).
              </div>
            </div>
            <div className="bg-gray-100 p-4 flex justify-between print:hidden">
              <Button variant="ghost" onClick={() => setPreviewInvoice(null)}>Fermer</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimer
                </Button>
                <Button onClick={handlePrint} className="bg-black hover:bg-black/90">
                   <Download className="w-4 h-4 mr-2" />
                   Télécharger PDF
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Hidden print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print, #invoice-print * { visibility: visible; }
          #invoice-print { position: absolute; left: 0; top: 0; width: 100%; border: none !important; }
        }
      `}</style>
    </div>
  )
}
