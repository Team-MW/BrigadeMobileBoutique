import { useState } from 'react'
import { useShop } from '@/context/ShopContext'
import Header from '@/components/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Filter, Edit, Trash2, Wrench, ShoppingBag,
  CheckCircle, Clock, AlertCircle, Download, ChevronUp, ChevronDown,
  X, Euro, TrendingUp, FileText
} from 'lucide-react'

const STATUS_CONFIG = {
  'Terminé': { badge: 'success', icon: CheckCircle, color: 'text-green-400' },
  'En cours': { badge: 'warning', icon: Clock, color: 'text-yellow-400' },
  'En attente': { badge: 'secondary', icon: AlertCircle, color: 'text-gray-400' },
}

const SERVICES = [
  'Remplacement écran',
  'Remplacement batterie',
  'Réparation connecteur de charge',
  'Réparation caméra',
  'Réparation micro/haut-parleur',
  'Déverrouillage téléphone',
  'Remplacement vitre arrière',
  'Diagnostic général',
  'Coque protection',
  'Verre trempé',
  'Chargeur',
  'Écouteurs',
  'Autre',
]

const PAYMENT_METHODS = ['Espèces', 'Carte', 'Virement', 'Chèque']
const TYPES = ['Réparation', 'Vente']
const STATUSES = ['Terminé', 'En cours', 'En attente']

const emptyForm = {
  date: '',
  client: '',
  phone: '',
  type: 'Réparation',
  service: '',
  price: '',
  cost: '',
  paymentMethod: 'Espèces',
  status: 'Terminé',
  clientPhone: '',
  notes: '',
}

export default function Ventes() {
  const { sales, addSale, updateSale, deleteSale, addInvoice, loading, isWorking } = useShop()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [sortField, setSortField] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSale, setEditingSale] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [customService, setCustomService] = useState('')

  // ─── Filter & Sort ───────────────────────────────────────────────
  const filtered = sales
    .filter(s => {
      const q = search.toLowerCase()
      const matchSearch = !q || [
        s.client || '', 
        s.phone || '', 
        s.service || '', 
        s.status || '', 
        s.type || '', 
        s.clientPhone || '',
        s.paymentMethod || '',
        s.email || ''
      ].some(v => v.toLowerCase().includes(q))
      const matchStatus = filterStatus === 'all' || s.status === filterStatus
      const matchType = filterType === 'all' || s.type === filterType
      return matchSearch && matchStatus && matchType
    })
    .sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]
      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    })

  const totalFiltered = filtered.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0)
  const profitFiltered = filtered.reduce((sum, s) => sum + (parseFloat(s.profit) || 0), 0)

  // ─── Sort handler ─────────────────────────────────────────────────
  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-30" />
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
  }

  // ─── Form handlers ────────────────────────────────────────────────
  const openAdd = () => {
    setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] })
    setEditingSale(null)
    setFormErrors({})
    setCustomService('')
    setDialogOpen(true)
  }

  const openEdit = (sale) => {
    setForm({ ...sale, price: String(sale.price), cost: String(sale.cost) })
    setEditingSale(sale.id)
    setFormErrors({})
    setCustomService(SERVICES.includes(sale.service) ? '' : sale.service)
    setDialogOpen(true)
  }

  const validateForm = () => {
    const errors = {}
    if (!form.client.trim()) errors.client = 'Nom du client requis'
    if (!form.phone.trim()) errors.phone = 'Modèle de téléphone requis'
    const service = form.service === 'Autre' ? customService : form.service
    if (!service.trim()) errors.service = 'Service requis'
    if (form.price === '' || isNaN(form.price)) errors.price = 'Prix valide requis'
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validateForm()
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }
    
    const finalService = form.service === 'Autre' ? customService : form.service
    const saleData = { ...form, service: finalService }
    
    if (editingSale) {
      await updateSale(editingSale, saleData)
      setDialogOpen(false)
    } else {
      const result = await addSale(saleData)
      if (result) {
        setDialogOpen(false)
      } else {
        alert("Erreur lors de l'enregistrement de la vente. Veuillez vérifier votre connexion.")
      }
    }
  }

  const handleDelete = async (id) => {
    await deleteSale(id)
    setDeleteConfirm(null)
  }

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleGenerateInvoice = async (sale) => {
    const invoice = {
      clientName: sale.client,
      clientPhone: sale.clientPhone || '',
      clientAddress: '',
      items: [
        { 
          description: `${sale.type}: ${sale.service} - ${sale.phone}`, 
          quantity: 1, 
          price: parseFloat(sale.price) 
        }
      ],
      total: parseFloat(sale.price),
      notes: sale.notes || 'Généré depuis le suivi des ventes.'
    }
    const newInv = await addInvoice(invoice)
    if (newInv) {
      alert(`Facture ${newInv.id} générée avec succès pour ${sale.client} !`)
      navigate('/factures')
    } else {
      alert("Erreur lors de la génération de la facture.")
    }
  }

  // ─── Export CSV ───────────────────────────────────────────────────
  const exportExcel = () => {
    const headers = ['ID', 'Date', 'Client', 'Contact (Tel)', 'Appareil', 'Type', 'Service', 'Prix (€)', 'Coût (€)', 'Bénéfice (€)', 'Paiement', 'Statut']
    const rows = filtered.map(s => [
      s.id,
      new Date(s.date).toLocaleDateString('fr-FR'),
      s.client,
      s.clientPhone || '-',
      s.phone,
      s.type,
      s.service,
      (parseFloat(s.price) || 0).toFixed(2),
      (parseFloat(s.cost) || 0).toFixed(2),
      (parseFloat(s.profit) || 0).toFixed(2),
      s.paymentMethod,
      s.status
    ])

    // Excel friendly CSV: UTF-8 BOM + semicolon separator + sep=; marker
    const csvContent = "sep=;\n" + [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `suivi_ventes_brigade_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.csv`
    link.click()
    URL.revokeObjectURL(url)
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
      <Header title="Suivi des Ventes" subtitle={`${sales.length} transactions enregistrées`} />

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 animate-pulse">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground font-medium">Chargement des données Supabase...</p>
        </div>
      ) : (
        <main className="flex-1 p-6 space-y-5 animate-fade-in">
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total ventes', value: sales.length, color: 'text-blue-400' },
            { label: 'Terminées', value: sales.filter(s => s.status === 'Terminé').length, color: 'text-green-400' },
            { label: 'En cours', value: sales.filter(s => s.status === 'En cours').length, color: 'text-yellow-400' },
            { label: 'En attente', value: sales.filter(s => s.status === 'En attente').length, color: 'text-gray-400' },
          ].map(({ label, value, color }) => (
            <Card key={label} className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </Card>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par client, téléphone, service..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="h-10 px-3 rounded-lg border border-border bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            >
              <option value="all">Tous les statuts</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="h-10 px-3 rounded-lg border border-border bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            >
              <option value="all">Tous les types</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportExcel} className="h-10">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Excel</span>
            </Button>
            <Button onClick={openAdd} className="h-10 gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle vente
            </Button>
          </div>
        </div>

        {/* Results Info */}
        {(search || filterStatus !== 'all' || filterType !== 'all') && (
          <div className="flex items-center justify-between text-sm text-muted-foreground bg-card border border-border rounded-lg px-4 py-2">
            <span>{filtered.length} résultat(s)</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><Euro className="w-3.5 h-3.5" />{totalFiltered.toFixed(2)} € CA</span>
              <span className="flex items-center gap-1 text-green-400"><TrendingUp className="w-3.5 h-3.5" />{profitFiltered.toFixed(2)} € bénéfice</span>
            </div>
          </div>
        )}

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {[
                    { field: 'date', label: 'Date' },
                    { field: 'client', label: 'Client' },
                    { field: 'phone', label: 'Téléphone' },
                    { field: 'type', label: 'Type' },
                    { field: 'service', label: 'Service' },
                    { field: 'price', label: 'Prix' },
                    { field: 'profit', label: 'Bénéfice' },
                    { field: 'paymentMethod', label: 'Paiement' },
                    { field: 'status', label: 'Statut' },
                  ].map(({ field, label }) => (
                    <TableHead
                      key={field}
                      className="cursor-pointer select-none hover:text-foreground group"
                      onClick={() => handleSort(field)}
                    >
                      <span className="flex items-center gap-1">
                        {label}
                        <SortIcon field={field} />
                      </span>
                    </TableHead>
                  ))}
                  <TableHead>Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="w-8 h-8 opacity-30" />
                        <p>Aucune vente trouvée</p>
                        <button onClick={openAdd} className="text-primary text-sm underline">
                          Ajouter une vente
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(sale => {
                    const StatusIcon = STATUS_CONFIG[sale.status]?.icon || Clock
                    return (
                      <TableRow key={sale.id} className="group">
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(sale.date).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          <div>{sale.client}</div>
                          {sale.email && <div className="text-[10px] text-muted-foreground font-normal">{sale.email}</div>}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{sale.phone}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {sale.type === 'Réparation'
                              ? <Wrench className="w-3.5 h-3.5 text-violet-400" />
                              : <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                            }
                            <span className="text-sm">{sale.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-[150px] truncate" title={sale.service}>
                          {sale.service}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          {parseFloat(sale.price).toFixed(2)} €
                        </TableCell>
                        <TableCell className="font-semibold text-green-400">
                          +{parseFloat(sale.profit).toFixed(2)} €
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{sale.paymentMethod}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_CONFIG[sale.status]?.badge || 'secondary'}>
                            {sale.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-blue-400">
                          {sale.clientPhone || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {sale.status !== 'Terminé' && (
                              <button
                                onClick={() => updateSale(sale.id, { status: 'Terminé' })}
                                className="p-1.5 rounded-md hover:bg-green-500/20 text-muted-foreground hover:text-green-400 transition-colors"
                                title="Clôturer la vente"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleGenerateInvoice(sale)}
                              className="p-1.5 rounded-md hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                              title="Générer Facture"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEdit(sale)}
                              className="p-1.5 rounded-md hover:bg-blue-500/20 text-muted-foreground hover:text-blue-400 transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(sale.id)}
                              className="p-1.5 rounded-md hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Total Row */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-end gap-6 text-sm px-4 py-3 bg-card border border-border rounded-lg">
            <span className="text-muted-foreground">{filtered.length} transaction(s)</span>
            <span className="text-foreground font-medium">
              CA : <span className="text-blue-400 font-bold">{totalFiltered.toFixed(2)} €</span>
            </span>
            <span className="text-foreground font-medium">
              Bénéfice : <span className="text-green-400 font-bold">{profitFiltered.toFixed(2)} €</span>
            </span>
          </div>
        )}
      </main>
    )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingSale ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {editingSale ? 'Modifier la vente' : 'Nouvelle vente / réparation'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Row 1 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="date">Date *</Label>
                <Input id="date" type="date" value={form.date} onChange={e => handleChange('date', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type">Type *</Label>
                <select
                  id="type"
                  value={form.type}
                  onChange={e => handleChange('type', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="client">Nom du client *</Label>
                <Input
                  id="client"
                  placeholder="Ex: Ahmed Benali"
                  value={form.client}
                  onChange={e => handleChange('client', e.target.value)}
                  className={formErrors.client ? 'border-red-500' : ''}
                />
                {formErrors.client && <p className="text-xs text-red-400">{formErrors.client}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="clientPhone">Numéro de téléphone client</Label>
                <Input
                  id="clientPhone"
                  placeholder="Ex: 06 00 00 00 00"
                  value={form.clientPhone || ''}
                  onChange={e => handleChange('clientPhone', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email client</Label>
              <Input
                id="email"
                type="email"
                placeholder="Ex: client@exemple.com"
                value={form.email || ''}
                onChange={e => handleChange('email', e.target.value)}
              />
            </div>

            {/* Price Selection / Device Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Modèle téléphone *</Label>
                <Input
                  id="phone"
                  placeholder="Ex: iPhone 13"
                  value={form.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  className={formErrors.phone ? 'border-red-500' : ''}
                />
                {formErrors.phone && <p className="text-xs text-red-400">{formErrors.phone}</p>}
              </div>
            </div>

            {/* Service */}
            <div className="space-y-1.5">
              <Label htmlFor="service">Service *</Label>
              <select
                id="service"
                value={form.service}
                onChange={e => handleChange('service', e.target.value)}
                className={`w-full h-10 px-3 rounded-lg border bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${formErrors.service ? 'border-red-500' : 'border-border'}`}
              >
                <option value="">-- Choisir un service --</option>
                {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {form.service === 'Autre' && (
                <Input
                  placeholder="Précisez le service"
                  value={customService}
                  onChange={e => setCustomService(e.target.value)}
                  className="mt-2"
                />
              )}
              {formErrors.service && <p className="text-xs text-red-400">{formErrors.service}</p>}
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="price">Prix de vente (€) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={e => handleChange('price', e.target.value)}
                  className={formErrors.price ? 'border-red-500' : ''}
                />
                {formErrors.price && <p className="text-xs text-red-400">{formErrors.price}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cost">Coût / Prix achat (€)</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.cost}
                  onChange={e => handleChange('cost', e.target.value)}
                />
              </div>
            </div>

            {/* Profit Preview */}
            {form.price && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-900/20 border border-emerald-800/30 text-sm">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-muted-foreground">Bénéfice estimé :</span>
                <span className="font-bold text-emerald-400">
                  {((parseFloat(form.price) || 0) - (parseFloat(form.cost) || 0)).toFixed(2)} €
                </span>
              </div>
            )}

            {/* Row 3 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="paymentMethod">Mode de paiement</Label>
                <select
                  id="paymentMethod"
                  value={form.paymentMethod}
                  onChange={e => handleChange('paymentMethod', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Statut</Label>
                <select
                  id="status"
                  value={form.status}
                  onChange={e => handleChange('status', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <textarea
                id="notes"
                placeholder="Notes supplémentaires..."
                value={form.notes}
                onChange={e => handleChange('notes', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-all"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" className="gap-2">
                {editingSale ? <><Edit className="w-4 h-4" /> Modifier</> : <><Plus className="w-4 h-4" /> Enregistrer</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <Trash2 className="w-5 h-5" />
              Confirmer la suppression
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Êtes-vous sûr de vouloir supprimer cette vente ? Cette action est irréversible.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
