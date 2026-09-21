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
import {
  DEMANDE_STATUS,
  DEMANDE_STATUS_LABELS,
  DEMANDE_STATUS_ORDER,
  DEMANDE_STATUS_STYLES,
  getDemandeMeta,
  fetchDemandeMetaMap,
  markDemandeOpened,
  setDemandeStatus,
} from '@/lib/jotformStatus'

function formatDate(value) {
  if (!value) return '—'
  try {
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

function withLocalMeta(demandes, metaMap) {
  return demandes.map((d) => {
    const meta = getDemandeMeta(d.id, metaMap)
    return { ...d, opened: meta.opened, localStatus: meta.status }
  })
}

function StatusSelect({ value, onChange, className, disabled }) {
  const style = DEMANDE_STATUS_STYLES[value]?.select || DEMANDE_STATUS_STYLES[DEMANDE_STATUS.NOUVEAU].select
  return (
    <select
      disabled={disabled}
      className={cn(
        'h-8 px-2 rounded-md border text-xs font-semibold min-w-[140px] max-w-[170px]',
        style,
        className
      )}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {DEMANDE_STATUS_ORDER.map((status) => (
        <option key={status} value={status}>
          {DEMANDE_STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  )
}

export default function DemandesFormulaire() {
  const [demandes, setDemandes] = useState([])
  const [metaMap, setMetaMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [formFilter, setFormFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [openedFilter, setOpenedFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [data, meta] = await Promise.all([
        fetchAllFormDemandes(),
        fetchDemandeMetaMap(),
      ])
      setDemandes(data)
      setMetaMap(meta)
    } catch (err) {
      console.error('Chargement demandes / meta:', err)
      const msg = err?.message || String(err)
      if (msg.includes('jotform_demandes') || err?.code === 'PGRST205') {
        setError(
          "La table Supabase « jotform_demandes » n'existe pas encore. Exécute le SQL dans database_schema.sql (section 8) puis actualise."
        )
      } else {
        setError(msg || 'Impossible de charger les demandes.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const demandesWithMeta = useMemo(
    () => withLocalMeta(demandes, metaMap),
    [demandes, metaMap]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return demandesWithMeta.filter((d) => {
      const matchForm = formFilter === 'all' || d.formId === formFilter
      const matchStatus = statusFilter === 'all' || d.localStatus === statusFilter
      const matchOpened =
        openedFilter === 'all' ||
        (openedFilter === 'ouvert' && d.opened) ||
        (openedFilter === 'non_ouvert' && !d.opened)
      if (!matchForm || !matchStatus || !matchOpened) return false
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
        DEMANDE_STATUS_LABELS[d.localStatus],
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [demandesWithMeta, search, formFilter, statusFilter, openedFilter])

  const stats = useMemo(() => ({
    total: demandesWithMeta.length,
    nouveaux: demandesWithMeta.filter((d) => d.localStatus === DEMANDE_STATUS.NOUVEAU).length,
    aRelancer: demandesWithMeta.filter((d) => d.localStatus === DEMANDE_STATUS.A_RELANCER).length,
    termines: demandesWithMeta.filter((d) => d.localStatus === DEMANDE_STATUS.TERMINE).length,
  }), [demandesWithMeta])

  const patchMeta = useCallback((submissionId, next) => {
    setMetaMap((prev) => ({
      ...prev,
      [submissionId]: {
        opened: Boolean(next.opened),
        status: next.status,
      },
    }))
  }, [])

  const openDemande = useCallback(async (demande) => {
    setSelected({ ...demande, opened: true })
    setSavingId(demande.id)
    try {
      const next = await markDemandeOpened(demande.id, demande.formId)
      patchMeta(demande.id, next)
    } catch (err) {
      console.error(err)
      alert("Erreur lors de l'enregistrement en base (ouvert).")
    } finally {
      setSavingId(null)
    }
  }, [patchMeta])

  const updateStatus = useCallback(async (submissionId, status, formId = null) => {
    setSavingId(submissionId)
    // Optimistic UI
    patchMeta(submissionId, {
      opened: metaMap[submissionId]?.opened || false,
      status,
    })
    try {
      const next = await setDemandeStatus(submissionId, status, formId)
      patchMeta(submissionId, next)
    } catch (err) {
      console.error(err)
      alert("Erreur lors de l'enregistrement du statut en base.")
      // reload meta to sync
      try {
        setMetaMap(await fetchDemandeMetaMap())
      } catch { /* ignore */ }
    } finally {
      setSavingId(null)
    }
  }, [metaMap, patchMeta])

  const selectedWithMeta = useMemo(() => {
    if (!selected) return null
    const live = demandesWithMeta.find((d) => d.id === selected.id)
    return live || selected
  }, [selected, demandesWithMeta])

  const hasActiveFilters =
    search || formFilter !== 'all' || statusFilter !== 'all' || openedFilter !== 'all'

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
          <p className="text-sm text-muted-foreground text-center max-w-lg whitespace-pre-wrap">{error}</p>
          <Button onClick={load} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </Button>
        </main>
      ) : (
        <main className="flex-1 p-6 space-y-5 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: stats.total, color: 'text-blue-400' },
              { label: 'Nouveaux', value: stats.nouveaux, color: 'text-sky-400' },
              { label: 'À relancer', value: stats.aRelancer, color: 'text-amber-400' },
              { label: 'Terminés / Payés', value: stats.termines, color: 'text-emerald-400' },
            ].map(({ label, value, color }) => (
              <Card key={label} className="p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={cn('text-2xl font-bold', color)}>{value}</p>
              </Card>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
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
              className="h-10 px-3 rounded-lg border border-border bg-background text-sm min-w-[160px]"
              value={formFilter}
              onChange={(e) => setFormFilter(e.target.value)}
            >
              <option value="all">Tous les formulaires</option>
              {JOTFORM_FORMS.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>

            <select
              className="h-10 px-3 rounded-lg border border-border bg-background text-sm min-w-[160px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              {DEMANDE_STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {DEMANDE_STATUS_LABELS[status]}
                </option>
              ))}
            </select>

            <select
              className="h-10 px-3 rounded-lg border border-border bg-background text-sm min-w-[140px]"
              value={openedFilter}
              onChange={(e) => setOpenedFilter(e.target.value)}
            >
              <option value="all">Vu / non vu</option>
              <option value="non_ouvert">Non ouvertes</option>
              <option value="ouvert">Ouvertes</option>
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

          {hasActiveFilters && (
            <div className="flex items-center justify-between text-sm text-muted-foreground bg-card border border-border rounded-lg px-4 py-2">
              <span>{filtered.length} résultat(s)</span>
              <button
                className="text-primary text-xs font-semibold hover:underline"
                onClick={() => {
                  setSearch('')
                  setFormFilter('all')
                  setStatusFilter('all')
                  setOpenedFilter('all')
                }}
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vu</TableHead>
                    <TableHead>Statut</TableHead>
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
                      <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Inbox className="w-8 h-8 opacity-30" />
                          <p>Aucune demande trouvée</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((d) => (
                      <TableRow
                        key={`${d.formId}-${d.id}`}
                        className={cn(
                          'group cursor-pointer hover:bg-muted/40',
                          !d.opened && 'bg-primary/[0.03]'
                        )}
                        onClick={() => openDemande(d)}
                      >
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(d.createdAt)}
                        </TableCell>
                        <TableCell>
                          {d.opened ? (
                            <Badge variant="info" className="text-[10px]">Ouvert</Badge>
                          ) : (
                            <span className="text-muted-foreground/40 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <StatusSelect
                            value={d.localStatus}
                            disabled={savingId === d.id}
                            onChange={(status) => updateStatus(d.id, status, d.formId)}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">
                            {d.formLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className={cn('font-medium text-foreground', !d.opened && 'font-bold')}>
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
                            <a
                              href={`tel:${d.fields.telephone}`}
                              className="hover:underline flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
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
                        <TableCell className="text-sm max-w-[160px] truncate" title={d.fields.panne}>
                          {d.fields.panne || '—'}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openDemande(d)
                            }}
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

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Détail de la demande
            </DialogTitle>
          </DialogHeader>

          {selectedWithMeta && (
            <div className="space-y-4 mt-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{selectedWithMeta.formLabel}</Badge>
                {selectedWithMeta.opened && <Badge variant="info">Ouvert</Badge>}
                <Badge variant={DEMANDE_STATUS_STYLES[selectedWithMeta.localStatus]?.badge || 'secondary'}>
                  {DEMANDE_STATUS_LABELS[selectedWithMeta.localStatus]}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatDate(selectedWithMeta.createdAt)}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Statut de la demande
                </p>
                <StatusSelect
                  value={selectedWithMeta.localStatus}
                  disabled={savingId === selectedWithMeta.id}
                  onChange={(status) => updateStatus(selectedWithMeta.id, status, selectedWithMeta.formId)}
                  className="h-10 w-full min-w-0 max-w-none text-sm"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {DEMANDE_STATUS_ORDER.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={savingId === selectedWithMeta.id}
                      onClick={() => updateStatus(selectedWithMeta.id, status, selectedWithMeta.formId)}
                      className={cn(
                        'px-2 py-1 rounded-md text-[10px] font-bold border transition-all',
                        selectedWithMeta.localStatus === status
                          ? DEMANDE_STATUS_STYLES[status].select
                          : 'border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {DEMANDE_STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
                {selectedWithMeta.details.map((field, idx) => (
                  <div key={`${field.name}-${idx}`} className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                    <span className="text-muted-foreground font-medium">{field.label}</span>
                    <span className="text-foreground break-words">{field.value || '—'}</span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-muted-foreground font-mono">
                ID soumission : {selectedWithMeta.id}
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
