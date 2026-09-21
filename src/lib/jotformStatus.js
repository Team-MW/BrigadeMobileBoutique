/**
 * Suivi des demandes Jotform (ouvert + pipeline commercial).
 * Persistance Supabase — table public.jotform_demandes
 */

import { supabase } from '@/lib/supabase'

export const DEMANDE_STATUS = {
  NOUVEAU: 'nouveau',
  DEVIS_ENVOYE: 'devis_envoye',
  A_RELANCER: 'a_relancer',
  DEVIS_ACCEPTE: 'devis_accepte',
  ACOMPTE_RECU: 'acompte_recu',
  TERMINE: 'termine',
  PERDU: 'perdu',
  INJOIGNABLE: 'injoignable',
}

export const DEMANDE_STATUS_ORDER = [
  DEMANDE_STATUS.NOUVEAU,
  DEMANDE_STATUS.DEVIS_ENVOYE,
  DEMANDE_STATUS.A_RELANCER,
  DEMANDE_STATUS.DEVIS_ACCEPTE,
  DEMANDE_STATUS.ACOMPTE_RECU,
  DEMANDE_STATUS.TERMINE,
  DEMANDE_STATUS.PERDU,
  DEMANDE_STATUS.INJOIGNABLE,
]

export const DEMANDE_STATUS_LABELS = {
  [DEMANDE_STATUS.NOUVEAU]: 'Nouveau',
  [DEMANDE_STATUS.DEVIS_ENVOYE]: 'Devis envoyé',
  [DEMANDE_STATUS.A_RELANCER]: 'À relancer',
  [DEMANDE_STATUS.DEVIS_ACCEPTE]: 'Devis accepté',
  [DEMANDE_STATUS.ACOMPTE_RECU]: 'Acompte reçu',
  [DEMANDE_STATUS.TERMINE]: 'Terminé / Payé',
  [DEMANDE_STATUS.PERDU]: 'Perdu / Refusé',
  [DEMANDE_STATUS.INJOIGNABLE]: 'Injoignable',
}

export const DEMANDE_STATUS_STYLES = {
  [DEMANDE_STATUS.NOUVEAU]: {
    badge: 'info',
    select: 'border-sky-500/40 bg-sky-500/10 text-sky-400',
  },
  [DEMANDE_STATUS.DEVIS_ENVOYE]: {
    badge: 'secondary',
    select: 'border-violet-500/40 bg-violet-500/10 text-violet-400',
  },
  [DEMANDE_STATUS.A_RELANCER]: {
    badge: 'warning',
    select: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  },
  [DEMANDE_STATUS.DEVIS_ACCEPTE]: {
    badge: 'default',
    select: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  },
  [DEMANDE_STATUS.ACOMPTE_RECU]: {
    badge: 'default',
    select: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
  },
  [DEMANDE_STATUS.TERMINE]: {
    badge: 'success',
    select: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  },
  [DEMANDE_STATUS.PERDU]: {
    badge: 'destructive',
    select: 'border-red-500/40 bg-red-500/10 text-red-400',
  },
  [DEMANDE_STATUS.INJOIGNABLE]: {
    badge: 'secondary',
    select: 'border-slate-500/40 bg-slate-500/10 text-slate-400',
  },
}

const LEGACY_STATUS_MAP = {
  pas_traite: DEMANDE_STATUS.NOUVEAU,
  traite: DEMANDE_STATUS.TERMINE,
}

const TABLE = 'jotform_demandes'

export function normalizeStatus(value) {
  if (LEGACY_STATUS_MAP[value]) return LEGACY_STATUS_MAP[value]
  if (Object.values(DEMANDE_STATUS).includes(value)) return value
  return DEMANDE_STATUS.NOUVEAU
}

export function getDemandeMeta(submissionId, metaMap = {}) {
  const entry = metaMap[submissionId]
  return {
    opened: Boolean(entry?.opened),
    status: normalizeStatus(entry?.status),
  }
}

/**
 * Charge tous les meta depuis Supabase → map { [id]: { opened, status } }
 */
export async function fetchDemandeMetaMap() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, opened, status')

  if (error) {
    console.error('Erreur chargement jotform_demandes:', error)
    throw error
  }

  const map = {}
  for (const row of data || []) {
    map[row.id] = {
      opened: Boolean(row.opened),
      status: normalizeStatus(row.status),
    }
  }
  return map
}

async function upsertDemande(payload) {
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: 'id' })
    .select('id, opened, status')
    .single()

  if (error) {
    console.error('Erreur upsert jotform_demandes:', error)
    throw error
  }

  return {
    opened: Boolean(data.opened),
    status: normalizeStatus(data.status),
  }
}

export async function markDemandeOpened(submissionId, formId = null) {
  const now = new Date().toISOString()

  // Lire l'existant pour ne pas écraser le statut ni opened_at
  const { data: existing } = await supabase
    .from(TABLE)
    .select('id, opened, status, opened_at, form_id')
    .eq('id', submissionId)
    .maybeSingle()

  return upsertDemande({
    id: submissionId,
    form_id: formId || existing?.form_id || null,
    opened: true,
    status: normalizeStatus(existing?.status),
    opened_at: existing?.opened_at || now,
    updated_at: now,
  })
}

export async function setDemandeStatus(submissionId, status, formId = null) {
  const now = new Date().toISOString()

  const { data: existing } = await supabase
    .from(TABLE)
    .select('id, opened, status, opened_at, form_id')
    .eq('id', submissionId)
    .maybeSingle()

  return upsertDemande({
    id: submissionId,
    form_id: formId || existing?.form_id || null,
    opened: existing?.opened ?? false,
    status: normalizeStatus(status),
    opened_at: existing?.opened_at || null,
    updated_at: now,
  })
}
