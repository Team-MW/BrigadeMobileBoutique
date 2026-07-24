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
  
  const [invoiceType, setInvoiceType] = useState('standard') // 'standard' or 'phone'
  const [phoneDetails, setPhoneDetails] = useState({
    brand: 'Apple',
    model: '',
    imei: '',
    condition: 'Reconditionné (Grade A)',
    warranty: '6 mois',
    price: 0,
    priceType: 'TTC',
  })
  
  const [form, setForm] = useState({
    clientName: '',
    clientAddress: '',
    clientPhone: '',
    emissionDate: new Date().toISOString().split('T')[0],
    items: [{ description: '', quantity: 1, price: 0, priceType: 'TTC' }],
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
      items: [...prev.items, { description: '', quantity: 1, price: 0, priceType: 'TTC' }]
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
    
    let itemsToSubmit = form.items.map(item => {
      const p = parseFloat(item.price || 0)
      return {
        ...item,
        price: item.priceType === 'HT' ? p * 1.2 : p
      }
    })

    if (invoiceType === 'phone') {
      const p = parseFloat(phoneDetails.price || 0)
      itemsToSubmit = [{
        description: `Téléphone: ${phoneDetails.brand} ${phoneDetails.model} | IMEI: ${phoneDetails.imei} | État: ${phoneDetails.condition} | Garantie: ${phoneDetails.warranty}`,
        quantity: 1,
        price: phoneDetails.priceType === 'HT' ? p * 1.2 : p
      }]
    }

    const total = itemsToSubmit.reduce((sum, item) => sum + (item.quantity * parseFloat(item.price || 0)), 0)
    const result = await addInvoice({ ...form, items: itemsToSubmit, total })
    
    if (result) {
      setDialogOpen(false)
      setForm({
        clientName: '',
        clientAddress: '',
        clientPhone: '',
        emissionDate: new Date().toISOString().split('T')[0],
        items: [{ description: '', quantity: 1, price: 0, priceType: 'TTC' }],
        notes: ''
      })
      setPhoneDetails({
        brand: 'Apple',
        model: '',
        imei: '',
        condition: 'Reconditionné (Grade A)',
        warranty: '6 mois',
        price: 0,
        priceType: 'TTC',
      })
    } else {
      alert("Erreur lors de la création de la facture.")
    }
  }

  const calculateTotal = () => {
    if (invoiceType === 'phone') {
      const p = parseFloat(phoneDetails.price || 0)
      return phoneDetails.priceType === 'HT' ? p * 1.2 : p
    }
    return form.items.reduce((sum, item) => {
      const p = parseFloat(item.price || 0)
      const finalPrice = item.priceType === 'HT' ? p * 1.2 : p
      return sum + (item.quantity * finalPrice)
    }, 0)
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
            <DialogTitle>Créer une Facture</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 p-1 bg-secondary/50 rounded-lg mb-2">
            <button
              type="button"
              onClick={() => setInvoiceType('standard')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${invoiceType === 'standard' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Facture Standard
            </button>
            <button
              type="button"
              onClick={() => setInvoiceType('phone')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${invoiceType === 'phone' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Vente Téléphone
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom du Client</Label>
                <Input required value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Date d'émission</Label>
                <Input type="date" required value={form.emissionDate} onChange={e => setForm({...form, emissionDate: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Téléphone Client</Label>
                <Input value={form.clientPhone} onChange={e => setForm({...form, clientPhone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Adresse/Détails Client</Label>
                <Input value={form.clientAddress} onChange={e => setForm({...form, clientAddress: e.target.value})} />
              </div>
            </div>

            {invoiceType === 'standard' ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Articles / Services</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                    + Ajouter un article
                  </Button>
                </div>
                <div className="space-y-4 sm:space-y-2">
                  {form.items.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-2 items-start p-3 sm:p-0 bg-background/50 sm:bg-transparent rounded-lg border sm:border-0">
                      <div className="flex-1 w-full">
                        <Input placeholder="Description" required value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} />
                      </div>
                      <div className="flex w-full sm:w-auto gap-2">
                        <div className="w-20">
                          <Input type="number" placeholder="Qté" required min="1" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value))} />
                        </div>
                        <div className="flex-1 sm:w-40 flex">
                          <Input type="number" placeholder="Prix" required step="0.01" value={item.price} onChange={e => handleItemChange(index, 'price', parseFloat(e.target.value))} className="rounded-r-none border-r-0" />
                          <select 
                            className="h-10 border border-input bg-background px-2 text-xs font-bold rounded-r-md text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input z-10"
                            value={item.priceType || 'TTC'}
                            onChange={e => handleItemChange(index, 'priceType', e.target.value)}
                          >
                            <option value="TTC">TTC</option>
                            <option value="HT">HT</option>
                          </select>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="text-red-500 shrink-0" onClick={() => handleRemoveItem(index)} disabled={form.items.length === 1}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 bg-primary/5 p-4 rounded-xl border border-primary/20 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Marque</Label>
                    <select 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={phoneDetails.brand}
                      onChange={e => setPhoneDetails({...phoneDetails, brand: e.target.value})}
                    >
                      <option>Apple</option>
                      <option>Samsung</option>
                      <option>Xiaomi</option>
                      <option>Oppo</option>
                      <option>Google</option>
                      <option>Huawei</option>
                      <option>Autre</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Modèle (et capacité)</Label>
                    <Input required value={phoneDetails.model} onChange={e => setPhoneDetails({...phoneDetails, model: e.target.value})} placeholder="ex: 13 Pro 128Go" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Numéro IMEI / Série</Label>
                  <Input required value={phoneDetails.imei} onChange={e => setPhoneDetails({...phoneDetails, imei: e.target.value})} placeholder="352..." />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>État / Grade</Label>
                    <select 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={phoneDetails.condition}
                      onChange={e => setPhoneDetails({...phoneDetails, condition: e.target.value})}
                    >
                      <option>Neuf</option>
                      <option>Reconditionné (Grade A+)</option>
                      <option>Reconditionné (Grade A)</option>
                      <option>Reconditionné (Grade B)</option>
                      <option>Occasion</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Garantie</Label>
                    <select 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={phoneDetails.warranty}
                      onChange={e => setPhoneDetails({...phoneDetails, warranty: e.target.value})}
                    >
                      <option>Aucune</option>
                      <option>3 mois</option>
                      <option>6 mois</option>
                      <option>1 an</option>
                      <option>2 ans</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-primary/10">
                  <Label className="text-primary font-bold">Prix de Vente</Label>
                  <div className="flex">
                    <Input required type="number" step="0.01" value={phoneDetails.price} onChange={e => setPhoneDetails({...phoneDetails, price: parseFloat(e.target.value) || 0})} placeholder="0.00" className="text-lg font-bold text-primary rounded-r-none border-r-0" />
                    <select 
                      className="h-10 border border-input bg-background px-3 font-bold rounded-r-md text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input z-10"
                      value={phoneDetails.priceType || 'TTC'}
                      onChange={e => setPhoneDetails({...phoneDetails, priceType: e.target.value})}
                    >
                      <option value="TTC">TTC</option>
                      <option value="HT">HT</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-lg font-bold">Total: {calculateTotal().toFixed(2)} €</p>
              <DialogFooter className="w-full sm:w-auto flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setDialogOpen(false)}>Annuler</Button>
                <Button type="submit" className="w-full sm:w-auto">Générer la Facture</Button>
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
