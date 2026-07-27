import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Printer, Download, FileText, X } from 'lucide-react'
import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'

const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAACQCAYAAAD8G9IAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AQQEAsQCxa9LgAAD6ZJREFUeNrtnXeYFMXWx7+enp7+u1BSMtKC52e+qIf3vpfrB2XIaLc4VR0Hr+Ya4KVfh5Z9QdA488mTJ58bPHjwX+hzDJ2IriArmuGqPHfu3JqEhITJoeJXtBYLe7Hd9b4dVu9xg8UkZ7jLkNHWAuUZOVr4+GFToJQmBBkQg6K8vPzz5OTkB9pbTSFcdHqeOBKVmN3uW79+/W/tdntJqPgV3kTkKwXLwKczTaTJAGa49/QmAzJkdAWUSFR2DiZlqWHpNCPZFzQOI1pUYpzqwLp1656ku6EL0CVFLVS3ffr06WePHj06w+PxuMVrafYmUK0nk5aBL2eZILMvC44YbEUvQ0abXT8HDyMGqODzJ8wtFiijAYGun8vlsm3duvXRGTNm1GKcqqNq/1pCl66v0fyrwsLCxzMzM5cSjTchCB8yfoUa4Df/uY50WdGoo7OTiAwZ7QmFWEqT3puFjS9YIKOPkKEe4oVPCAm7KRcWFt4zfPjwvM5MU2gOXZ4MQG9ASUnJktTU1FktBdxpIHDzMS/85r068GF7J3xDyIQlQ0azQEJyeXjopWPg++csROM+jJ6V5Dk8ffr0ggEDBizsaqLqLmRFA+7q8vLy1YmJiZNbJCxRsmLtfjcJurNKJLDYlUWWISN0YxIeNPi8PGOBcYPDaixLnj+r1fp5v379aEBd2uinS9DlUR+8CfPnz8fr8GzdunUaBvJCFTwjSGNMDuA3V2rgH4+ZwOfliUa4rNIgQ0ZjFQVM+kQJprxZ5oiIqqamZvMzzzwzU9zX5UTVLcgKsXDhQk5MMKvetGnT/Q0NDeUY2AvWLBWBriDe+Luu0cAnj5pJh+dQVeIyZMQaUXlRZgkAVj5uhpuGq4UQSgiioit/Dofj+KpVq6bl5eU50ZDoqoB6U3SrR5v6xVu2bMkZOXLkt1qtVh+snRcFfVN89oMLHlpeDxodE+g8IkNGrBKVz8cD7wP4......[TRUNCATED]......lYgQ0ZjFQVM+kQJprxZ5oiIqqamZvMzzzwzU9zX5UTVLcgKsXDhQk5MMKvetGnT/Q0NDeUY2AvWLBWBriDe+Luu0cAnj5pJh+dQVeIyZMQaUXlRZgkAVj5uhpuGq4UQSgiioit/Dofj+KpVq6bl5eU50ZDoqoB6U3SrR5v6xVu2bMkZOXLkt1qtVh+snRcFfVN89oMLHlpeDxodE+g8IkNGrBKVz8cD7wP48gkT3H51i9nppJQGBTIbGhqq8/Pzb7zlllv2dXaGeo8iKwTNjC0oKLhz8ODBX6rVakVL1xogrB/d8NByO2i0MmHJiO0YFStaVL++Uh2O60cMAqfT6dy1a9dtOTk5G+lKPXQjdDuykhLWyZMnZ2ZmZn4orkKwwa6XdMsV3xxf7nLDg8vtoFABqFiGxLJkyIgVonJ7eVDjc/C4GW7NapmoUJoYFcc9Ho+/qKjo3qFDh37dHVb+egxZIegNKy4ufjE9PX2xGPhThLSwRMJavdcN9y+zA4eNOlVyHpaM2BDPc7p4MKkB8p6ywIQhYQXTSeDc7/ezp06dmnHppZeu6Iqavx5PVk0I69X09PSXwiIscYDWH/bA3Utt0OAF0Glk8T4Z0QulAqDeyUOSiYGvnzKTkrRwiIrneZKhXl5e/nRycvL/dmei6glkhdeHqxH+0tLSPOfrvXWvD3bYmTDpWVltVEaUdqPh4dIkFlbNNsOw5LASPgNEVURJui8lPz+JH5L+NYkvEleSrkXo30o6SRdJ5GekG4b0LSRNlHSR3BfDkP41iS8SjxgQ73vGDSQj8Z4Mku4/k+wJfCTuY4Qk/yHp/pNkUXSRdJF0kQZJ959J9kTSRX6SPVFCZ0kK6V+R7In3J/FCZFJ0kQZJFxka4aGXD0eE9C0kSZZEX7/XwUN6w7rS9XQeNuhxAwZkSH/dt5A0UdJF958MSXf/yUi6/2RIvEdy/0l8/UhG0t3TjKTX40n/f0n3nwyS7j8Z/t1/Mv9f958Mkp+f5BfJ/SfZ/yR7Iukiv552/3qS4f/nJ/HukXT3/xP3LSRddG+S7v5/0kXS/SfpokjSRXeTdP/J/X/S/e/J/Sf3n0R+kh9d+p0Mkp+f5P7T/Sfxd/9JfP1IRv86O+Tfp91/ujf5yZP1P119mHqP/o+G/wU0QhQh0D02gAAAAABJRU5ErkJggg==".replace(/\s/g, '');

// A robust helper to run html2canvas safely by temporarily cleaning oklch/oklab styles from the page's stylesheets
const callHtml2CanvasSafely = async (element, options = {}) => {
  const styleTags = Array.from(document.querySelectorAll('style'));
  const linkTags = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  const tempStyleTags = [];
  const originalAdopted = document.adoptedStyleSheets;

  try {
    // 1. Temporarily clear adoptedStyleSheets to prevent html2canvas parsing errors
    if (originalAdopted && originalAdopted.length > 0) {
      document.adoptedStyleSheets = [];
    }

    // Helper to extract, sanitize, and override styles
    const processStylesheet = (sheetOwner, cssRules) => {
      try {
        let cssText = '';
        if (cssRules) {
          cssText = Array.from(cssRules).map(rule => rule.cssText).join('\n');
        } else {
          cssText = sheetOwner.innerHTML || '';
        }

        if (cssText.includes('oklch') || cssText.includes('oklab')) {
          const sanitizedCSS = cssText
            .replace(/oklch\([^)]+\)/g, '#000000')
            .replace(/oklab\([^)]+\)/g, '#000000');
          
          const tempStyle = document.createElement('style');
          tempStyle.innerHTML = sanitizedCSS;
          document.head.appendChild(tempStyle);
          tempStyleTags.push(tempStyle);
          
          // Disable the original sheet
          sheetOwner.disabled = true;
        }
      } catch (e) {
        // Fallback for security issues or cross-origin restrictions
        const cssText = sheetOwner.innerHTML || '';
        if (cssText.includes('oklch') || cssText.includes('oklab')) {
          const sanitizedCSS = cssText
            .replace(/oklch\([^)]+\)/g, '#000000')
            .replace(/oklab\([^)]+\)/g, '#000000');
          
          const tempStyle = document.createElement('style');
          tempStyle.innerHTML = sanitizedCSS;
          document.head.appendChild(tempStyle);
          tempStyleTags.push(tempStyle);
          
          sheetOwner.disabled = true;
        }
      }
    };

    // 2. Process all <style> tags
    styleTags.forEach(style => {
      if (!style.disabled) {
        let rules = null;
        try {
          rules = style.sheet ? style.sheet.cssRules : null;
        } catch (e) {}
        processStylesheet(style, rules);
      }
    });

    // 3. Process all <link rel="stylesheet"> tags
    linkTags.forEach(link => {
      if (!link.disabled) {
        let rules = null;
        try {
          rules = link.sheet ? link.sheet.cssRules : null;
        } catch (e) {}
        processStylesheet(link, rules);
      }
    });

    return await html2canvas(element, options);
  } finally {
    // 4. Restore everything
    if (originalAdopted && originalAdopted.length > 0) {
      document.adoptedStyleSheets = originalAdopted;
    }
    styleTags.forEach(style => {
      style.disabled = false;
    });
    linkTags.forEach(link => {
      link.disabled = false;
    });
    tempStyleTags.forEach(temp => {
      temp.remove();
    });
  }
};

export default function InvoicePreview({ invoice, isOpen, onClose }) {
  if (!invoice) return null

  const [zoomFactor, setZoomFactor] = useState(1)
  const [leftMargin, setLeftMargin] = useState(0)

  useEffect(() => {
    if (!isOpen) return
    const handleResize = () => {
      // The modal's max width on desktop is capped at 896px (max-w-4xl). On mobile, it is (window.innerWidth - 32px).
      const containerWidth = Math.min(window.innerWidth - 32, 896)
      const targetWidth = 800
      const zoom = Math.min(containerWidth / targetWidth, 1)
      
      setZoomFactor(zoom)
      
      // Calculate centering margin. On mobile, remainingSpace is 0, keeping the left margin at 0.
      const remainingSpace = containerWidth - (targetWidth * zoom)
      setLeftMargin(Math.max(0, remainingSpace / 2))
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen, invoice])

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
      // PDF generation is executed on a cloned node in memory, avoiding live layout shifts and zoom bugs on phone screen.
      const canvas = await callHtml2CanvasSafely(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800,
        onclone: (clonedDoc) => {
          // 1. Inject safe color variable overrides
          const overrideStyle = clonedDoc.createElement('style')
          overrideStyle.innerHTML = `
            :root {
              --color-slate-50: #f8fafc !important;
              --color-slate-100: #f1f5f9 !important;
              --color-slate-200: #e2e8f0 !important;
              --color-slate-300: #cbd5e1 !important;
              --color-slate-400: #94a3b8 !important;
              --color-slate-500: #64748b !important;
              --color-slate-800: #1e293b !important;
              --color-slate-900: #0f172a !important;
              --color-blue-500: #3b82f6 !important;
              --color-blue-600: #2563eb !important;
              --color-emerald-600: #059669 !important;
              --color-orange-600: #ea580c !important;
            }
          `
          clonedDoc.head.appendChild(overrideStyle)

          // 2. Sanitize all stylesheet definitions in the clone to strip oklch/oklab
          Array.from(clonedDoc.querySelectorAll('style')).forEach(style => {
            try {
              if (style.innerHTML) {
                style.innerHTML = style.innerHTML
                  .replace(/oklch\([^)]+\)/g, '#000000')
                  .replace(/oklab\([^)]+\)/g, '#000000')
              }
            } catch (e) {
              console.error('Error cleaning style tag:', e)
            }
          })

          const clonedElement = clonedDoc.getElementById('invoice-print')
          if (clonedElement) {
            clonedElement.style.width = '800px'
            clonedElement.style.minWidth = '800px'
            clonedElement.style.maxWidth = 'none'
            clonedElement.style.zoom = '1'
            clonedElement.style.transform = 'none'
            clonedElement.style.marginLeft = '0px'
            clonedElement.style.marginRight = '0px'
          }
        }
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Facture_BrigadeMobile_${invoice.id || 'PROVISOIRE'}.pdf`)
    } catch (error) {
      console.error('Erreur PDF:', error)
      alert("Impossible de générer le PDF : " + error.message)
    }
  }

  const handleDownloadPNG = async () => {
    const element = document.getElementById('invoice-print')
    if (!element) return

    try {
      const canvas = await callHtml2CanvasSafely(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800,
        onclone: (clonedDoc) => {
          // 1. Inject safe color variable overrides
          const overrideStyle = clonedDoc.createElement('style')
          overrideStyle.innerHTML = `
            :root {
              --color-slate-50: #f8fafc !important;
              --color-slate-100: #f1f5f9 !important;
              --color-slate-200: #e2e8f0 !important;
              --color-slate-300: #cbd5e1 !important;
              --color-slate-400: #94a3b8 !important;
              --color-slate-500: #64748b !important;
              --color-slate-800: #1e293b !important;
              --color-slate-900: #0f172a !important;
              --color-blue-500: #3b82f6 !important;
              --color-blue-600: #2563eb !important;
              --color-emerald-600: #059669 !important;
              --color-orange-600: #ea580c !important;
            }
          `
          clonedDoc.head.appendChild(overrideStyle)

          // 2. Sanitize stylesheets
          Array.from(clonedDoc.querySelectorAll('style')).forEach(style => {
            try {
              if (style.innerHTML) {
                style.innerHTML = style.innerHTML
                  .replace(/oklch\([^)]+\)/g, '#000000')
                  .replace(/oklab\([^)]+\)/g, '#000000')
              }
            } catch (e) {
              console.error('Error cleaning style tag:', e)
            }
          })

          const clonedElement = clonedDoc.getElementById('invoice-print')
          if (clonedElement) {
            clonedElement.style.width = '800px'
            clonedElement.style.minWidth = '800px'
            clonedElement.style.maxWidth = 'none'
            clonedElement.style.zoom = '1'
            clonedElement.style.transform = 'none'
            clonedElement.style.marginLeft = '0px'
            clonedElement.style.marginRight = '0px'
          }
        }
      })
      
      const imgData = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = imgData
      link.download = `Facture_BrigadeMobile_${invoice.id || 'PROVISOIRE'}.png`
      link.click()
    } catch (error) {
      console.error('Erreur PNG:', error)
      alert("Impossible de générer le PNG : " + error.message)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-[#1e293b] border-white/10 shadow-2xl rounded-2xl flex flex-col">
        {/* Sticky top header for document control */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Aperçu de la Facture</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable canvas area */}
        <div className="max-h-[50vh] sm:max-h-[70vh] overflow-auto w-full custom-scrollbar bg-slate-950/80 py-8 block">
          <div 
            id="invoice-print" 
            style={{ 
              zoom: zoomFactor,
              marginLeft: `${leftMargin}px`,
              marginRight: `${leftMargin}px`,
              marginTop: '0px',
              marginBottom: '0px',
              transformOrigin: 'top left' // Explicit top-left origin for zoom stability
            }}
            className="p-8 sm:p-16 space-y-12 bg-[#ffffff] text-[#1a1a1a] font-sans min-w-[800px] w-[800px] shadow-2xl shadow-black/80 rounded-sm border border-black/5"
          >
            {/* Header section with distinct layout */}
            <div className="flex justify-between items-start border-b-4 border-slate-900 pb-10">
              <div className="space-y-6">
                <img 
                  src={LOGO_BASE64} 
                  alt="Logo" 
                  className="h-24 w-auto object-contain transition-transform hover:scale-105 duration-300" 
                  onError={(e) => e.target.style.display = 'none'} 
                />
                <div className="space-y-1">
                  <h1 className="text-4xl font-black uppercase tracking-tighter leading-none text-slate-900">
                    BRIGADE MOBILE
                  </h1>
                  <p className="text-sm font-bold text-slate-400 tracking-widest">Expertise Réparation & Tech</p>
                </div>
              </div>
              
              <div className="text-right space-y-2">
                {/* Premium formatted invoice indicator */}
                <div className="inline-block border-2 border-slate-900 text-slate-900 px-4 py-2.5 rounded-xl bg-slate-50">
                  <p className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 leading-tight">Facture N°</p>
                  <p className="text-sm font-mono font-extrabold tracking-tight">
                    {invoice.id ? `BM-${invoice.id.split('-')[0].toUpperCase()}` : 'PROVISOIRE'}
                  </p>
                </div>
                {invoice.id && (
                  <p className="text-[9px] text-slate-400 font-mono tracking-tight leading-none">UUID: {invoice.id}</p>
                )}
                <div className="text-sm pt-2">
                  <p className="font-bold uppercase text-[9px] text-slate-400 tracking-wider">Date d'émission</p>
                  <p className="font-semibold text-slate-800">
                    {new Date(invoice.createdAt || Date.now()).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-16">
              <div className="space-y-4">
                <div className="border-l-4 border-slate-900 pl-4">
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mb-2">Émetteur</p>
                  <p className="text-sm font-bold text-slate-800">BRIGADE MOBILE</p>
                  <p className="text-sm text-[#4b5563]">65 route de Blagnac</p>
                  <p className="text-sm text-[#4b5563]">31200 Toulouse</p>
                  <p className="text-[10px] font-mono mt-2 pt-2 border-t border-[#f3f4f6] text-slate-400">SIRET: 78899543900023</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-l-4 border-blue-600 pl-4">
                  <p className="text-[10px] uppercase font-black text-blue-600 tracking-[0.2em] mb-2">Destinataire</p>
                  <p className="text-lg font-black uppercase tracking-tight text-slate-900">{invoice.clientName || 'CLIENT'}</p>
                  {invoice.clientPhone && <p className="text-sm font-semibold text-[#4b5563]">Tél: {invoice.clientPhone}</p>}
                  {invoice.imei && <p className="text-sm font-mono text-blue-600/80">IMEI: {invoice.imei}</p>}
                  {invoice.clientAddress && <p className="text-sm text-[#6b7280] mt-1">{invoice.clientAddress}</p>}
                </div>
              </div>
            </div>

            {/* Items Table with modern look */}
            <div className="space-y-4">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="py-3 px-4 text-left text-[9px] font-bold uppercase tracking-wider rounded-l-lg">Désignation</th>
                    <th className="py-3 px-4 text-center text-[9px] font-bold uppercase tracking-wider w-24">Qté</th>
                    <th className="py-3 px-4 text-right text-[9px] font-bold uppercase tracking-wider w-32">P.U (TTC)</th>
                    <th className="py-3 px-4 text-right text-[9px] font-bold uppercase tracking-wider w-32 rounded-r-lg">Total (TTC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(invoice.items || []).map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <p className="text-sm font-bold text-slate-800">{item.description}</p>
                      </td>
                      <td className="py-4 px-4 text-center text-sm font-medium text-slate-600">
                        {item.quantity}
                      </td>
                      <td className="py-4 px-4 text-right text-sm font-medium text-slate-600">
                        {parseFloat(item.price).toFixed(2)} €
                      </td>
                      <td className="py-4 px-4 text-right text-sm font-black text-slate-900">
                        {(item.quantity * item.price).toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations and Summary */}
            <div className="flex justify-between items-end pt-8 border-t border-[#f3f4f6]">
              <div className="max-w-[50%]">
                {invoice.notes && (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-bold text-slate-300 tracking-widest">Observations</p>
                    <p className="text-xs text-slate-500 italic leading-relaxed">{invoice.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="w-72 space-y-3 bg-slate-50 p-6 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex justify-between text-xs text-slate-500 font-medium tracking-tight">
                  <span>Total HT</span>
                  <span className="font-mono">{(invoice.total / 1.2).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 font-medium tracking-tight">
                  <span>TVA (20%)</span>
                  <span className="font-mono">{(invoice.total - (invoice.total / 1.2)).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-dashed border-slate-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total TTC</span>
                  <span className="text-xl font-black text-blue-600 font-mono">{parseFloat(invoice.total || 0).toFixed(2)} €</span>
                </div>
                {invoice.acompte > 0 && (
                  <>
                    <div className="flex justify-between text-xs text-emerald-600 font-bold pt-2">
                      <span>Acompte versé</span>
                      <span className="font-mono">-{parseFloat(invoice.acompte).toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-black text-orange-600 pt-2 border-t border-slate-100">
                      <span>SOLDE À PAYER</span>
                      <span className="font-mono">{(parseFloat(invoice.total) - parseFloat(invoice.acompte)).toFixed(2)} €</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer and Terms */}
            <div className="pt-16 space-y-6 text-center">
              <div className="flex items-center justify-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-200">
                <div className="h-[1px] flex-1 bg-[#f3f4f6]"></div>
                <span>Merci de votre confiance</span>
                <div className="h-[1px] flex-1 bg-[#f3f4f6]"></div>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed max-w-lg mx-auto">
                BRIGADE MOBILE — SIRET: 78899543900023 — 65 route de Blagnac, 31200 Toulouse<br />
                En cas de réparation, la garantie est de 3 mois (hors casse, oxydation ou intervention tiers). 
                La facture doit être présentée pour toute réclamation.
              </p>
            </div>
          </div>
        </div>

        {/* Premium dialog footer bar */}
        <div className="bg-slate-900 p-3 sm:p-6 grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:justify-end sm:items-center sm:gap-3 border-t border-white/10 print:hidden sticky bottom-0 z-30">
          <Button 
            variant="ghost" 
            className="text-white/50 hover:text-white hover:bg-white/10 w-full sm:w-auto px-4 order-4 sm:order-1 col-span-2 sm:col-span-1" 
            onClick={onClose}
          >
            Fermer
          </Button>
          <Button 
            variant="outline" 
            className="bg-white/5 border-white/20 text-white hover:bg-white/10 gap-1.5 w-full sm:w-auto px-4 order-3 sm:order-2 text-xs sm:text-sm" 
            onClick={handlePrint}
          >
            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Imprimer
          </Button>
          <Button 
            onClick={handleDownloadPNG} 
            className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 gap-1.5 px-4 sm:px-8 w-full sm:w-auto font-bold order-2 sm:order-3 text-xs sm:text-sm"
          >
             <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
             Télécharger PNG
          </Button>
          <Button 
            onClick={handleDownloadPDF} 
            className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 gap-1.5 px-4 sm:px-8 w-full sm:w-auto font-bold order-1 sm:order-4 col-span-2 sm:col-span-1 text-xs sm:text-sm"
          >
             <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
             PDF
          </Button>
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
