import React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Printer, Download } from 'lucide-react'

const LOGO_BASE64 = "data:image/png;base64,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"

export default function InvoicePreview({ invoice, isOpen, onClose }) {
  if (!invoice) return null

  const handlePrint = () => {
    const content = document.getElementById('invoice-print')?.innerHTML
    if (!content) return

    const printWindow = window.open('', '_blank', 'width=800,height=900')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Facture Brigade Mobile</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; }
            @page { margin: 0; size: auto; }
            .no-print { display: none; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="max-w-4xl mx-auto">
            ${content}
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-print')
    if (!element) return

    try {
      // @ts-ignore
      const canvas = await window.html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })
      
      const imgData = canvas.toDataURL('image/png')
      // @ts-ignore
      const { jsPDF } = window.jspdf
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgProps = pdf.getImageProperties(imgData)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Facture_BrigadeMobile_${invoice.id || 'PROVISOIRE'}.pdf`)
    } catch (error) {
      console.error('Erreur PDF:', error)
      handlePrint()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl">
        <div className="max-h-[85vh] overflow-y-auto w-full custom-scrollbar">
          <div id="invoice-print" className="p-16 space-y-12 bg-white text-[#1a1a1a] font-sans">
            {/* Header section with distinct layout */}
            <div className="flex justify-between items-start border-b-4 border-black pb-10">
              <div className="space-y-6">
                <img 
                  src={LOGO_BASE64} 
                  alt="Logo" 
                  className="h-24 w-auto object-contain transition-transform hover:scale-105 duration-300" 
                  onError={(e) => e.target.style.display = 'none'} 
                />
                <div className="space-y-1">
                  <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
                    BRIGADE MOBILE
                  </h1>
                  <p className="text-sm font-bold text-gray-400 tracking-widest">Expertise Réparation & Tech</p>
                </div>
              </div>
              
              <div className="text-right space-y-1">
                <div className="inline-block bg-black text-white px-4 py-2 mb-4">
                  <p className="text-[10px] uppercase tracking-widest font-bold opacity-70">Facture No.</p>
                  <p className="text-2xl font-mono font-bold leading-none">{invoice.id || 'PROVISOIRE'}</p>
                </div>
                <div className="text-sm">
                  <p className="font-bold uppercase text-[10px] text-gray-400">Date d'émission</p>
                  <p className="font-medium">{new Date(invoice.createdAt || Date.now()).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-16">
              <div className="space-y-4">
                <div className="border-l-4 border-black pl-4">
                  <p className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] mb-2">Émetteur</p>
                  <p className="text-sm font-bold">BRIGADE MOBILE</p>
                  <p className="text-sm text-gray-600">65 route de Blagnac</p>
                  <p className="text-sm text-gray-600">31200 Toulouse</p>
                  <p className="text-[10px] font-mono mt-2 pt-2 border-t border-gray-100 text-gray-400">SIRET: 78899543900023</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-l-4 border-blue-600 pl-4">
                  <p className="text-[10px] uppercase font-black text-blue-600 tracking-[0.2em] mb-2">Destinataire</p>
                  <p className="text-lg font-black uppercase tracking-tight">{invoice.clientName || 'CLIENT'}</p>
                  {invoice.clientPhone && <p className="text-sm font-semibold text-gray-600">Tél: {invoice.clientPhone}</p>}
                  {invoice.imei && <p className="text-sm font-mono text-blue-600/80">IMEI: {invoice.imei}</p>}
                  {invoice.clientAddress && <p className="text-sm text-gray-500 mt-1">{invoice.clientAddress}</p>}
                </div>
              </div>
            </div>

            {/* Items Table with modern look */}
            <div className="space-y-4">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-widest">Désignation</th>
                    <th className="py-4 px-4 text-center text-[10px] font-black uppercase tracking-widest w-24">Qté</th>
                    <th className="py-4 px-4 text-right text-[10px] font-black uppercase tracking-widest w-32">P.U (TTC)</th>
                    <th className="py-4 px-4 text-right text-[10px] font-black uppercase tracking-widest w-32">Total (TTC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(invoice.items || []).map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-5 px-4">
                        <p className="text-sm font-bold text-gray-800">{item.description}</p>
                      </td>
                      <td className="py-5 px-4 text-center text-sm font-medium text-gray-600">
                        {item.quantity}
                      </td>
                      <td className="py-5 px-4 text-right text-sm font-medium">
                        {parseFloat(item.price).toFixed(2)} €
                      </td>
                      <td className="py-5 px-4 text-right text-sm font-black">
                        {(item.quantity * item.price).toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations and Summary */}
            <div className="flex justify-between items-end pt-8 border-t border-gray-100">
              <div className="max-w-[50%]">
                {invoice.notes && (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-bold text-gray-300 tracking-widest">Observations</p>
                    <p className="text-xs text-gray-500 italic leading-relaxed">{invoice.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="w-72 space-y-3 bg-gray-50 p-6 rounded-xl border border-gray-100">
                <div className="flex justify-between text-xs text-gray-500 font-medium tracking-tight">
                  <span>Total HT</span>
                  <span>{(invoice.total / 1.2).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 font-medium tracking-tight">
                  <span>TVA (20%)</span>
                  <span>{(invoice.total - (invoice.total / 1.2)).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t-2 border-dashed border-gray-200">
                  <span className="text-sm font-black uppercase tracking-widest text-gray-400">Total TTC</span>
                  <span className="text-2xl font-black text-blue-600">{parseFloat(invoice.total || 0).toFixed(2)} €</span>
                </div>
                {invoice.acompte > 0 && (
                  <>
                    <div className="flex justify-between text-xs text-green-600 font-bold pt-2">
                      <span>Acompte versé</span>
                      <span>-{parseFloat(invoice.acompte).toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-orange-600 pt-1 border-t border-gray-100">
                      <span>SOLDE À PAYER</span>
                      <span>{(parseFloat(invoice.total) - parseFloat(invoice.acompte)).toFixed(2)} €</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer and Terms */}
            <div className="pt-16 space-y-6 text-center">
              <div className="flex items-center justify-center gap-4 text-[9px] font-black uppercase tracking-widest text-gray-300">
                <div className="h-[1px] flex-1 bg-gray-100"></div>
                <span>Merci de votre confiance</span>
                <div className="h-[1px] flex-1 bg-gray-100"></div>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed max-w-lg mx-auto">
                BRIGADE MOBILE — SIRET: 78899543900023 — 65 route de Blagnac, 31200 Toulouse<br />
                En cas de réparation, la garantie est de 3 mois (hors casse, oxydation ou intervention tiers). 
                La facture doit être présentée pour toute réclamation.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-black/90 p-6 flex justify-between items-center backdrop-blur-md border-t border-white/10 print:hidden sticky bottom-0">
          <Button variant="ghost" className="text-white/50 hover:text-white hover:bg-white/10" onClick={onClose}>
            Fermer l'aperçu
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2" onClick={handlePrint}>
              <Printer className="w-4 h-4" />
              Imprimer
            </Button>
            <Button 
              onClick={handleDownloadPDF} 
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 gap-2 px-6"
            >
               <Download className="w-4 h-4" />
               Télécharger PDF Premium
            </Button>
          </div>
        </div>
        
        <style dangerouslySetInnerHTML={{ __html: `
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        `}} />
      </DialogContent>
    </Dialog>
  )
}
