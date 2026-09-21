/**
 * Client Jotform (compte EU Safe Mode → eu-api.jotform.com)
 *
 * Variables d'environnement :
 * - VITE_JOTFORM_API_KEY
 */

const EU_BASE = 'https://eu-api.jotform.com'

export const JOTFORM_FORMS = [
  {
    id: '262303988688373',
    label: 'Brigade Mobile',
    title: 'BRIGADE MOBILE - FORMULAIRE DEVIS',
  },
  {
    id: '262146210090343',
    label: 'Reparphone',
    title: 'REPARPHONE FINAL - FORMULAIRE DEVIS',
  },
]

function getApiKey() {
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}
  return env.VITE_JOTFORM_API_KEY || ''
}

async function jotformFetch(path, params = {}) {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('Clé API Jotform manquante (VITE_JOTFORM_API_KEY).')
  }

  const query = new URLSearchParams({
    apiKey,
    ...Object.fromEntries(
      Object.entries(params).filter(([, v]) => v != null && v !== '')
    ),
  })

  const res = await fetch(`${EU_BASE}${path}?${query.toString()}`)
  if (!res.ok) {
    throw new Error(`Jotform HTTP ${res.status}`)
  }

  const data = await res.json()
  if (data.responseCode && data.responseCode !== 200) {
    throw new Error(data.message || `Jotform erreur ${data.responseCode}`)
  }

  return data
}

/** Normalise une réponse Jotform (string | array | object) en texte lisible. */
export function formatAnswer(value) {
  if (value == null || value === '') return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (Array.isArray(value)) {
    return value.map(formatAnswer).filter(Boolean).join(', ')
  }
  if (typeof value === 'object') {
    // fullname / phone / address style
    if (value.first || value.last) {
      return [value.first, value.last].filter(Boolean).join(' ').trim()
    }
    if (value.full || value.phone || value.number) {
      return String(value.full || value.phone || value.number)
    }
    const parts = Object.values(value)
      .map(formatAnswer)
      .filter(Boolean)
    return parts.join(' ')
  }
  return String(value)
}

/**
 * Transforme une soumission brute en objet plat utilisable par l'UI.
 */
export function normalizeSubmission(raw, formMeta) {
  const answers = raw.answers || {}
  const fields = {}
  const details = []

  for (const [, ans] of Object.entries(answers)) {
    const type = ans.type || ''
    if (
      type.startsWith('control_button') ||
      type === 'control_head' ||
      type === 'control_text' ||
      type === 'control_divider' ||
      type === 'control_pagebreak' ||
      type === 'control_image'
    ) {
      continue
    }

    const label = (ans.text || ans.name || '').trim()
    const value = formatAnswer(ans.prettyFormat ?? ans.answer)
    if (!label && !value) continue

    details.push({ label: label || ans.name || 'Champ', value, name: ans.name, type })

    const name = (ans.name || '').toLowerCase()
    const text = label.toLowerCase()

    if (name === 'nom' || text === 'nom') fields.nom = value
    else if (name.includes('email') || text.includes('e-mail') || text.includes('email')) fields.email = value
    else if (name.includes('numero') || text.includes('téléphone') || text.includes('telephone')) fields.telephone = value
    else if (name === 'marquede22' || text.includes('prestation')) fields.prestation = value
    else if (name === 'marquede' || text.includes('marque')) fields.marque = value
    else if (name === 'saisissezune' || text === 'modèle' || text === 'modele') fields.modele = value
    else if (name === 'modelebis' || text.includes('modèle bis') || text.includes('modele bis')) fields.modeleBis = value
    else if (name === 'typede' || text.includes('panne')) fields.panne = value
    else if (name.includes('requesting') || text.includes('description')) fields.description = value
  }

  return {
    id: raw.id,
    formId: formMeta.id,
    formLabel: formMeta.label,
    formTitle: formMeta.title,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    status: raw.status,
    isNew: String(raw.new) === '1',
    fields,
    details,
    raw,
  }
}

export async function fetchFormInfo(formId) {
  const data = await jotformFetch(`/form/${formId}`)
  return data.content
}

export async function fetchFormSubmissions(formId, { limit = 100, offset = 0 } = {}) {
  const data = await jotformFetch(`/form/${formId}/submissions`, {
    limit: String(limit),
    offset: String(offset),
    orderby: 'created_at',
  })
  return {
    items: data.content || [],
    resultSet: data.resultSet || {},
  }
}

/** Charge toutes les soumissions des formulaires configurés. */
export async function fetchAllFormDemandes() {
  const results = await Promise.all(
    JOTFORM_FORMS.map(async (form) => {
      const { items } = await fetchFormSubmissions(form.id, { limit: 200 })
      return items.map((raw) => normalizeSubmission(raw, form))
    })
  )

  return results
    .flat()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}
