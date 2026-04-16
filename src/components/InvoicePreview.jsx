import React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Printer, Download } from 'lucide-react'

export default function InvoicePreview({ invoice, isOpen, onClose }) {
  if (!invoice) return null

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    const element = document.getElementById('invoice-print')
    const opt = {
      margin: 0,
      filename: `Facture_${invoice.id || 'PROVISOIRE'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    
    // @ts-ignore
    if (window.html2pdf) {
      // @ts-ignore
      window.html2pdf().set(opt).from(element).save()
    } else {
      handlePrint() // Fallback to print if library not loaded
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
                <p className="text-xl font-mono font-bold">{invoice.id || 'PROVISOIRE'}</p>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold text-gray-500 uppercase">Date</p>
                <p className="text-sm font-medium">{new Date(invoice.createdAt || Date.now()).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 border-y border-gray-100 py-8">
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Facturé à</div>
              <p className="text-lg font-bold">{invoice.clientName}</p>
              {invoice.clientAddress && <p className="text-sm">{invoice.clientAddress}</p>}
              {invoice.clientPhone && <p className="text-sm">Tél: {invoice.clientPhone}</p>}
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
                {(invoice.items || []).map((item, i) => (
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
                <span className="text-sm">{(invoice.total / 1.2).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span className="text-sm">TVA (20%)</span>
                <span className="text-sm">{(invoice.total - (invoice.total / 1.2)).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-900">
                <span className="text-lg font-black uppercase">Total TTC</span>
                <span className="text-2xl font-black">{parseFloat(invoice.total).toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="bg-gray-50 p-4 rounded-lg mt-auto">
               <p className="text-xs font-bold text-gray-400 uppercase mb-1">Notes</p>
               <p className="text-sm italic text-gray-600">{invoice.notes}</p>
            </div>
          )}

          <div className="text-center pt-10 text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">
            Brigade Mobile — SIRET: 78899543900023 — 65 route de blagnac, 31200 Toulouse<br />
            En cas de réparation, la garantie est de 3 mois (hors casse, oxydation ou intervention tiers).
          </div>
        </div>
        <div className="bg-gray-100 p-4 flex justify-between print:hidden">
          <Button variant="ghost" onClick={onClose}>Fermer</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
            <Button onClick={handleDownloadPDF} className="bg-black hover:bg-black/90">
               <Download className="w-4 h-4 mr-2" />
               Télécharger PDF
            </Button>
          </div>
        </div>
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #invoice-print, #invoice-print * { visibility: visible; }
            #invoice-print { position: absolute; left: 0; top: 0; width: 100%; border: none !important; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
