import { useState, useEffect } from 'react'
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
  'Caméra Arrière',
  'Caméra Avant',
  'Son / Micro',
  'Boutons',
  'Oxydation (Eau)',
  'Autre / Diagnostic',
]

const MODELS = [
  'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
  'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
  'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13 mini', 'iPhone 13',
  'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12 mini', 'iPhone 12',
  'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
  'iPhone XR', 'iPhone XS Max', 'iPhone XS', 'iPhone X',
  'iPhone 8 Plus', 'iPhone 8', 'iPhone 7 Plus', 'iPhone 7',
  'iPhone 6S', 'iPhone 6', 'AirPods Pro', 'AirPods', 'iPad Air', 'iPad Pro'
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
  const [countdown, setCountdown] = useState(10)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  
  useEffect(() => {
    let timer;
    let interval;
    if (submitted) {
      setCountdown(10);
      interval = setInterval(() => {
        setCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      timer = setTimeout(() => {
        reset();
      }, 10000);
    }
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [submitted]);
  
  const [form, setForm] = useState({
    client: '',
    clientPhone: '',
    phone: '',
    service: '',
    secondaryService: '',
    email: '',
    paymentPreference: 'Espèces',
    price: '0',
    acompte: '0',
    notes: '',
    imei: '',
    unlockCode: '',
  })

  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.client.trim()) e.client = 'Votre nom est requis'
    if (!form.clientPhone.trim()) e.clientPhone = 'Votre numéro est requis'
    if (!form.phone.trim()) e.phone = 'Le modèle est requis'
    if (!form.service) e.service = 'Choisissez le type de panne'
    if (!acceptedTerms) e.acceptedTerms = 'Veuillez accepter les conditions'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setErrors(errors)
      return
    }

    setLoading(true)

    const finalService = form.service === 'Autre / Diagnostic' ? form.secondaryService : form.service
    
    const result = await addSale({
      ...form,
      service: finalService || 'Diagnostic à faire',
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
    if (result) {
      setSubmitted(true)
    } else {
      alert("Erreur lors de l'enregistrement. Veuillez réessayer ou contacter le magasin.")
    }
  }

  const reset = () => {
    setForm({ client: '', clientPhone: '', phone: '', imei: '', unlockCode: '', service: '', paymentPreference: 'Espèces', notes: '', price: '0', acompte: '0' })
    setErrors({})
    setAcceptedTerms(false)
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
          <Button 
            onClick={reset} 
            size="lg" 
            className="w-full h-16 rounded-3xl text-xl font-extrabold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-xl shadow-green-200 border-none transition-all active:scale-[0.98] animate-pulse-slow"
          >
            Retour au formulaire ({countdown}s)
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
                  {errors.client ? <p className="text-xs text-red-500 font-bold">{errors.client}</p> : <p className="text-[10px] text-gray-400">Indiquez votre nom complet pour vous identifier.</p>}
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
                  {errors.clientPhone ? <p className="text-xs text-red-500 font-bold">{errors.clientPhone}</p> : <p className="text-[10px] text-gray-400">Important : nous vous appellerons sur ce numéro.</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-bold text-gray-700">Adresse Email (Optionnel)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="exemple@mail.com"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    className="h-14 rounded-2xl bg-gray-50 border-gray-100 text-lg text-gray-900 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-gray-400">Pour recevoir votre facture par mail.</p>
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
                    list="phone-models"
                    value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})}
                    className={`h-14 rounded-2xl bg-gray-50 border-gray-100 text-lg text-gray-900 focus:ring-blue-500 ${errors.phone ? 'border-red-500' : ''}`}
                  />
                  <datalist id="phone-models">
                    {MODELS.map(m => <option key={m} value={m} />)}
                  </datalist>
                  <p className="text-[10px] text-gray-400">Si vous ne savez pas, écrivez "Inconnu".</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="imei" className="text-sm font-bold text-gray-700">N° IMEI (Optionnel)</Label>
                    <Input
                      id="imei"
                      placeholder="Tapez *#06#"
                      value={form.imei}
                      onChange={e => setForm({...form, imei: e.target.value})}
                      className="h-14 rounded-2xl bg-gray-50 border-gray-100 text-lg text-gray-900 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unlockCode" className="text-sm font-bold text-gray-700">Code Déverrouillage</Label>
                    <Input
                      id="unlockCode"
                      placeholder="Ex: 1234 ou schéma"
                      value={form.unlockCode}
                      onChange={e => setForm({...form, unlockCode: e.target.value})}
                      className="h-14 rounded-2xl bg-gray-50 border-gray-100 text-lg text-gray-900 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-gray-700">Type de panne</Label>
                  <p className="text-[10px] text-gray-400 mb-2">Sélectionnez le problème principal :</p>
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
                  {form.service === 'Autre / Diagnostic' && (
                    <div className="mt-4 animate-fade-in">
                      <Label htmlFor="secondaryService" className="text-sm font-bold text-gray-700">Détaillez le problème *</Label>
                      <textarea
                        id="secondaryService"
                        placeholder="Décrivez précisément la panne..."
                        value={form.secondaryService}
                        onChange={e => setForm({...form, secondaryService: e.target.value})}
                        className="w-full mt-2 p-4 rounded-2xl bg-gray-50 border-gray-100 text-gray-900 focus:ring-blue-500 min-h-[100px] resize-none"
                      />
                    </div>
                  )}
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

            <div className="flex items-center gap-2 text-sm font-bold text-blue-600 uppercase tracking-widest pl-1">
              <Euro className="w-4 h-4" /> Tarification
            </div>
            <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-bold text-gray-700">Prix Réparation (€)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      value={form.price}
                      onChange={e => setForm({...form, price: e.target.value})}
                      className="h-14 rounded-2xl bg-gray-50 border-gray-100 text-lg text-gray-900 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="acompte" className="text-sm font-bold text-gray-700">Acompte versé (€)</Label>
                    <Input
                      id="acompte"
                      type="number"
                      placeholder="0.00"
                      value={form.acompte}
                      onChange={e => setForm({...form, acompte: e.target.value})}
                      className="h-14 rounded-2xl bg-gray-50 border-gray-100 text-lg text-gray-900 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {parseFloat(form.price) > 0 && (
                  <div className="mt-4 p-4 rounded-2xl bg-blue-50 border border-blue-100 flex justify-between items-center">
                    <span className="text-sm font-bold text-blue-800">Reste à payer :</span>
                    <span className="text-xl font-black text-blue-900">
                      {Math.max(0, (parseFloat(form.price) || 0) - (parseFloat(form.acompte) || 0)).toFixed(2)} €
                    </span>
                  </div>
                )}
                <p className="text-[10px] text-gray-400 font-medium mt-3">Indiquez le montant total et l'acompte si déjà réglé.</p>
              </CardContent>
            </Card>

          <div className="pt-4 space-y-6">
            <div className={`p-6 rounded-3xl border-2 transition-all ${acceptedTerms ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100 shadow-sm'}`}>
              <div className="flex items-start gap-4">
                <div className="pt-1">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={e => setAcceptedTerms(e.target.checked)}
                    className="w-6 h-6 rounded-lg text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="terms" className="text-sm font-bold text-gray-900 cursor-pointer">
                    J'accepte les conditions générales & marketing
                  </Label>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    En cochant cette case, j'accepte les conditions de réparation de Brigade Mobile. 
                    <span className="block mt-1 font-medium text-blue-600">
                      Mes données personnelles sont protégées et ne seront jamais vendues à des tiers.
                    </span>
                    J'accepte que mon numéro soit utilisé pour le suivi de ma réparation et pour recevoir occasionnellement des offres promotionnelles par SMS.
                  </p>
                  {errors.acceptedTerms && <p className="text-xs text-red-500 font-bold animate-bounce mt-2">{errors.acceptedTerms}</p>}
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className={`w-full h-18 py-5 rounded-3xl text-xl font-black transition-all active:scale-[0.97] ${
                acceptedTerms 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xl shadow-blue-200' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              disabled={loading || !acceptedTerms}
            >
              {loading ? 'Traitement en cours...' : 'Déposer mon appareil'}
            </Button>
            
            <p className="text-center text-[10px] text-gray-400 uppercase font-bold tracking-widest px-8">
              Service de maintenance certifié par Brigade Mobile
            </p>
          </div>

        </form>
      </div>
    </div>
  )
}
