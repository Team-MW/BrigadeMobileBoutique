import { useCallback, useEffect, useMemo, useState } from 'react'
import Header from '@/components/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Search, RefreshCw, X, FileText, Mail, Phone, Smartphone,
  Wrench, Eye, Inbox, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchAllFormDemandes, JOTFORM_FORMS } from '@/lib/jotform'

function formatDate(value) {
  if (!value) return '—'
  try {
    // Jotform renvoie souvent "YYYY-MM-DD HH:mm:ss" (Europe/Paris)
    const normalized = String(value).includes('T') ? value : String(value).replace(' ', 'T')
    return new Date(normalized).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

export default function DemandesFormulaire() {
  const [demandes, setDemandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [formFilter, setFormFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAllFormDemandes()
      setDemandes(data)
    } catch (err) {
      console.error('Jotform fetch error:', err)
      setError(err.message || 'Impossible de charger les demandes Jotform.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return demandes.filter((d) => {
      const matchForm = formFilter === 'all' || d.formId === formFilter
      if (!matchForm) return false
      if (!q) return true
      const haystack = [
        d.fields.nom,
        d.fields.email,
        d.fields.telephone,
        d.fields.marque,
        d.fields.modele,
        d.fields.modeleBis,
        d.fields.prestation,
        d.fields.panne,
        d.fields.description,
        d.formLabel,
        d.id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [demandes, search, formFilter])

  const stats = useMemo(() => ({
    total: demandes.length,
    nouveaux: demandes.filter((d) => d.isNew).length,
    brigade: demandes.filter((d) => d.formId === JOTFORM_FORMS[0].id).length,
    reparphone: demandes.filter((d) => d.formId === JOTFORM_FORMS[1].id).length,
  }), [demandes])

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
      <Header
        title="Demandes de formulaire"
        subtitle={`${stats.total} soumission(s) Jotform`}
      />

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 animate-pulse">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">Chargement des demandes Jotform...</p>
        </div>
      ) : error ? (
        <main className="flex-1 p-6 flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-sm text-muted-foreground text-center max-w-md">{error}</p>
          <Button onClick={load} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </Button>
        </main>
      ) : (
        <main className="flex-1 p-6 space-y-5 animate-fade-in">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: stats.total, color: 'text-blue-400' },
              { label: 'Nouvelles', value: stats.nouveaux, color: 'text-amber-400' },
              { label: 'Brigade Mobile', value: stats.brigade, color: 'text-violet-400' },
              { label: 'Reparphone', value: stats.reparphone, color: 'text-emerald-400' },
            ].map(({ label, value, color }) => (
              <Card key={label} className="p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={cn('text-2xl font-bold', color)}>{value}</p>
              </Card>
            ))}
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher nom, téléphone, modèle, panne..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            <select
              className="h-10 px-3 rounded-lg border border-border bg-background text-sm min-w-[180px]"
              value={formFilter}
              onChange={(e) => setFormFilter(e.target.value)}
            >
              <option value="all">Tous les formulaires</option>
              {JOTFORM_FORMS.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>

            <Button
              variant="outline"
              onClick={load}
              className="gap-2 h-10 px-4 rounded-lg bg-secondary/50 border-border hover:bg-secondary transition-all font-bold"
              disabled={loading}
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
              Actualiser
            </Button>
          </div>

          {(search || formFilter !== 'all') && (
            <div className="flex items-center justify-between text-sm text-muted-foreground bg-card border border-border rounded-lg px-4 py-2">
              <span>{filtered.length} résultat(s)</span>
              <button
                className="text-primary text-xs font-semibold hover:underline"
                onClick={() => { setSearch(''); setFormFilter('all') }}
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Formulaire</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Appareil</TableHead>
                    <TableHead>Prestation</TableHead>
                    <TableHead>Panne</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Inbox className="w-8 h-8 opacity-30" />
                          <p>Aucune demande trouvée</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((d) => (
                      <TableRow key={`${d.formId}-${d.id}`} className="group">
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {formatDate(d.createdAt)}
                            {d.isNew && (
                              <Badge variant="warning" className="text-[10px]">Nouveau</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">
                            {d.formLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          <div>{d.fields.nom || '—'}</div>
                          {d.fields.email && (
                            <div className="text-[10px] text-muted-foreground font-normal flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" />
                              {d.fields.email}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-blue-400">
                          {d.fields.telephone ? (
                            <a href={`tel:${d.fields.telephone}`} className="hover:underline flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5" />
                              {d.fields.telephone}
                            </a>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-primary/70" />
                            <span>
                              {[d.fields.marque, d.fields.modele || d.fields.modeleBis]
                                .filter(Boolean)
                                .join(' ') || '—'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-violet-400" />
                            {d.fields.prestation || '—'}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-[180px] truncate" title={d.fields.panne}>
                          {d.fields.panne || '—'}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => setSelected(d)}
                            className="p-2 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-all duration-200 border border-primary/20 shadow-sm"
                            title="Voir le détail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Détail de la demande
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 mt-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{selected.formLabel}</Badge>
                {selected.isNew && <Badge variant="warning">Nouveau</Badge>}
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatDate(selected.createdAt)}
                </span>
              </div>

              <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
                {selected.details.map((field, idx) => (
                  <div key={`${field.name}-${idx}`} className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                    <span className="text-muted-foreground font-medium">{field.label}</span>
                    <span className="text-foreground break-words">{field.value || '—'}</span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-muted-foreground font-mono">
                ID soumission : {selected.id}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
