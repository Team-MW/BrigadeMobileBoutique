import { useState } from 'react'
import { useShop } from '@/context/ShopContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Smartphone, CheckCircle, ArrowRight, User, Phone, CreditCard, Euro } from 'lucide-react'

const PANNES = [
  'Écran cassé',
  'Batterie HS',
  'Ne charge plus',
  'Caméra défectueuse',
  'Son / Micro',
  'Boutons',
  'Oxydation (Eau)',
  'Autre / Diagnostic',
]

const PAYMENTS = [
  'Espèces',
  'Carte Bancaire',
  'Virement',
]

export default function ClientForm() {
  const { addSale } = useShop()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [form, setForm] = useState({
    client: '',
    clientPhone: '',
    phone: '',
    service: '',
    paymentPreference: 'Espèces',
    price: '0',
    notes: '',
  })

  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.client.trim()) e.client = 'Votre nom est requis'
    if (!form.clientPhone.trim()) e.clientPhone = 'Votre numéro est requis'
    if (!form.phone.trim()) e.phone = 'Le modèle est requis'
    if (!form.service) e.service = 'Choisissez le type de panne'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setLoading(true)
    await new Promise(r => setTimeout(r, 600))

    addSale({
      ...form,
      clientPhone: form.clientPhone,
      date: new Date().toISOString().split('T')[0],
      type: 'Réparation',
      price: parseFloat(form.price) || 0,
      cost: 0,
      status: 'En attente',
      paymentMethod: form.paymentPreference,
      notes: form.notes
    })

    setLoading(false)
    setSubmitted(true)
  }

  const reset = () => {
    setForm({ client: '', clientPhone: '', phone: '', service: '', paymentPreference: 'Espèces', notes: '' })
    setErrors({})
    setSubmitted(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Merci !</h2>
            <p className="text-lg text-gray-500">Votre demande a été enregistrée. Un technicien va s'occuper de vous.</p>
          </div>
          <Button onClick={reset} size="lg" variant="outline" className="w-full h-14 rounded-2xl text-lg font-bold border-2 border-gray-100 hover:bg-gray-50">
            Retour au formulaire
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center">
      
      {/* Header */}
      <div className="w-full bg-white border-b border-gray-100 py-6 px-4 flex flex-col items-center sticky top-0 z-10 shadow-sm">
        <img src="/logo.png" alt="Logo" className="h-12 object-contain mb-2" />
        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wider">Interface Client</h1>
      </div>

      <div className="w-full max-w-xl p-4 sm:p-8 space-y-8 animate-fade-in">
        
        <div className="space-y-2 text-center sm:text-left">
          <h2 className="text-2xl font-black text-gray-900">Demande de Réparation</h2>
          <p className="text-gray-500 font-medium">Remplissez ce formulaire pour déposer votre téléphone.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 pb-12">
          
          {/* Section 1: Vous */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-600 uppercase tracking-widest pl-1">
              <User className="w-4 h-4" /> Vos Coordonnées
            </div>
            <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="client" className="text-sm font-bold text-gray-700">Nom & Prénom</Label>
                  <Input
                    id="client"
                    placeholder="Jean Dupont"
                    value={form.client}
                    onChange={e => setForm({...form, client: e.target.value})}
                    className={`h-14 rounded-2xl bg-gray-50 border-gray-100 text-lg text-gray-900 focus:ring-blue-500 ${errors.client ? 'border-red-500' : ''}`}
                  />
                  {errors.client && <p className="text-xs text-red-500 font-bold">{errors.client}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone" className="text-sm font-bold text-gray-700">Numéro de téléphone</Label>
                  <Input
                    id="clientPhone"
                    type="tel"
                    placeholder="06 00 00 00 00"
                    value={form.clientPhone}
                    onChange={e => setForm({...form, clientPhone: e.target.value})}
                    className={`h-14 rounded-2xl bg-gray-50 border-gray-100 text-lg text-gray-900 focus:ring-blue-500 ${errors.clientPhone ? 'border-red-500' : ''}`}
                  />
                  {errors.clientPhone && <p className="text-xs text-red-500 font-bold">{errors.clientPhone}</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section 2: Téléphone */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-600 uppercase tracking-widest pl-1">
              <Smartphone className="w-4 h-4" /> Votre Appareil
            </div>
            <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-bold text-gray-700">Modèle du téléphone / tablette</Label>
                  <Input
                    id="phone"
                    placeholder="Ex: iPhone 13 Pro, Samsung S22..."
                    value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})}
                    className={`h-14 rounded-2xl bg-gray-50 border-gray-100 text-lg text-gray-900 focus:ring-blue-500 ${errors.phone ? 'border-red-500' : ''}`}
                  />
                  {errors.phone && <p className="text-xs text-red-500 font-bold">{errors.phone}</p>}
                </div>
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-gray-700">Type de panne</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PANNES.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setForm({...form, service: p})}
                        className={`py-4 px-3 rounded-2xl border text-sm font-bold transition-all ${
                          form.service === p 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                            : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  {errors.service && <p className="text-xs text-red-500 font-bold text-center mt-2">{errors.service}</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section 3: Paiement */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-600 uppercase tracking-widest pl-1">
              <CreditCard className="w-4 h-4" /> Paiement souhaité
            </div>
            <div className="flex gap-2">
              {PAYMENTS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm({...form, paymentPreference: p})}
                  className={`flex-1 py-4 px-2 rounded-2xl border text-xs font-bold transition-all ${
                    form.paymentPreference === p 
                      ? 'bg-gray-900 border-gray-900 text-white shadow-xl shadow-gray-200' 
                      : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Prix */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-600 uppercase tracking-widest pl-1">
              <Euro className="w-4 h-4" /> Prix Estimé / Acompte
            </div>
            <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-bold text-gray-700">Montant (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0.00"
                    value={form.price}
                    onChange={e => setForm({...form, price: e.target.value})}
                    className="h-14 rounded-2xl bg-gray-50 border-gray-100 text-lg text-gray-900 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-gray-400 font-medium">Laissez à 0 si le prix n'est pas encore fixé.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="pt-4 space-y-4">
            <Button 
              type="submit" 
              className="w-full h-16 rounded-3xl text-xl font-black bg-blue-600 hover:bg-blue-700 text-white shadow-2xl shadow-blue-200 transition-all active:scale-[0.97]"
              disabled={loading}
            >
              {loading ? 'Traitement...' : 'Déposer mon appareil'}
            </Button>
            <p className="text-center text-[10px] text-gray-400 uppercase font-bold tracking-widest px-8">
              En déposant votre appareil, vous acceptez nos conditions générales de réparation.
            </p>
          </div>

        </form>
      </div>
    </div>
  )
}
