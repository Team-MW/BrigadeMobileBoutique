import { useState } from 'react'
import { useShop } from '@/context/ShopContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Smartphone, CheckCircle2, ArrowRight, User, Wrench } from 'lucide-react'

const SERVICES = [
  'Remplacement écran',
  'Remplacement batterie',
  'Réparation connecteur de charge',
  'Réparation caméra',
  'Réparation micro/haut-parleur',
  'Déverrouillage téléphone',
  'Autre',
]

export default function ClientForm() {
  const { addSale } = useShop()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [form, setForm] = useState({
    client: '',
    phone: '',
    service: '',
    notes: '',
  })

  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.client.trim()) e.client = 'Merci d\'indiquer votre nom'
    if (!form.phone.trim()) e.phone = 'Quel est le modèle de votre téléphone ?'
    if (!form.service) e.service = 'Merci de choisir un service'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    // Simulate a bit of processing for better UX
    await new Promise(r => setTimeout(r, 800))

    addSale({
      ...form,
      date: new Date().toISOString().split('T')[0],
      type: 'Réparation',
      price: 0, // Admin will set the price later
      cost: 0,
      status: 'En attente',
      paymentMethod: 'À définir',
    })

    setLoading(false)
    setSubmitted(true)
  }

  const reset = () => {
    setForm({ client: '', phone: '', service: '', notes: '' })
    setErrors({})
    setSubmitted(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background">
        <Card className="max-w-md w-full border-primary/20 bg-card/50 backdrop-blur-xl animate-fade-in text-center p-8 space-y-6">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">C'est enregistré !</h2>
            <p className="text-muted-foreground">Merci {form.client}, votre demande a bien été transmise à notre équipe.</p>
          </div>
          <div className="bg-secondary/50 p-4 rounded-xl text-sm italic text-muted-foreground">
             "Nous allons examiner votre {form.phone} et nous vous tiendrons informé dans les plus brefs délais."
          </div>
          <Button onClick={reset} size="lg" className="w-full gap-2">
            Nouveau dépôt <ArrowRight className="w-4 h-4" />
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background">
      <div className="max-w-2xl w-full animate-fade-in">
        
        {/* Header Logo/Title */}
        <div className="flex flex-col items-center mb-8 space-y-4">
          <img src="/logo.png" alt="Logo" className="h-20 object-contain drop-shadow-2xl" />
          <div className="text-center">
            <h1 className="text-3xl font-black uppercase tracking-widest text-foreground">Brigade Mobile</h1>
            <p className="text-muted-foreground font-medium tracking-tight">Formulaire de dépôt client</p>
          </div>
        </div>

        <Card className="border-primary/20 bg-card/30 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-primary to-emerald-500" />
          
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
               <Smartphone className="w-5 h-5 text-primary" />
               Veuillez remplir vos informations
            </CardTitle>
            <CardDescription>Ces détails nous permettront de traiter votre demande plus rapidement.</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Nom du client */}
              <div className="space-y-3">
                <Label htmlFor="client" className="text-base font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Votre Nom & Prénom
                </Label>
                <Input
                  id="client"
                  placeholder="Jean Dupont"
                  value={form.client}
                  onChange={e => { setForm({...form, client: e.target.value}); if(errors.client) setErrors({...errors, client: ''}) }}
                  className={`h-14 text-lg bg-secondary/30 ${errors.client ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                />
                {errors.client && <p className="text-sm text-red-500 font-medium">{errors.client}</p>}
              </div>

              {/* Téléphone (Modèle) */}
              <div className="space-y-3">
                <Label htmlFor="phone" className="text-base font-semibold flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-primary" /> Modèle de votre téléphone
                </Label>
                <Input
                  id="phone"
                  placeholder="Ex: iPhone 13 Pro, Samsung S22..."
                  value={form.phone}
                  onChange={e => { setForm({...form, phone: e.target.value}); if(errors.phone) setErrors({...errors, phone: ''}) }}
                  className={`h-14 text-lg bg-secondary/30 ${errors.phone ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                />
                {errors.phone && <p className="text-sm text-red-500 font-medium">{errors.phone}</p>}
              </div>

              {/* Service souhaité */}
              <div className="space-y-3">
                <Label htmlFor="service" className="text-base font-semibold flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary" /> De quelle réparation avez-vous besoin ?
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SERVICES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setForm({...form, service: s}); setErrors({...errors, service: ''}) }}
                      className={`px-4 py-3 rounded-xl border text-left transition-all duration-200 text-sm font-medium ${
                        form.service === s 
                          ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' 
                          : 'bg-secondary/30 border-border text-muted-foreground hover:border-primary/50 hover:bg-secondary/50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {errors.service && <p className="text-sm text-red-500 font-medium">{errors.service}</p>}
              </div>

              {/* Détails supplémentaires */}
              <div className="space-y-3">
                <Label htmlFor="notes" className="text-base font-semibold">Détails ou problèmes constatés (Optionnel)</Label>
                <textarea
                  id="notes"
                  placeholder="Dites-nous en plus sur le problème..."
                  value={form.notes}
                  onChange={e => setForm({...form, notes: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 text-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-all"
                />
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-16 text-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer ma demande'}
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                En soumettant ce formulaire, vous acceptez la prise en charge de votre appareil.<br />
                Notre équipe reviendra vers vous pour confirmation du prix.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
