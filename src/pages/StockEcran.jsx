import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Smartphone, AlertTriangle, Copy, Check, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const SQL_CODE = `CREATE TABLE IF NOT EXISTS public.stock_ecran (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    category text,
    quantity numeric DEFAULT 0,
    price numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.stock_ecran ENABLE ROW LEVEL SECURITY;

-- Supprime la politique si elle existe déjà, puis la recrée
DROP POLICY IF EXISTS "Autoriser tout sur stock_ecran" ON public.stock_ecran;
CREATE POLICY "Autoriser tout sur stock_ecran" ON public.stock_ecran AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);

-- Recharge le cache interne de l'API Supabase
NOTIFY pgrst, 'reload schema';`;

const IPHONE_MODELS = [
  "iPhone 17 Pro Max", "iPhone 17 Pro", "iPhone 17",
  "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16",
  "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
  "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
  "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 mini",
  "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12", "iPhone 12 mini",
  "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11",
  "iPhone XS Max", "iPhone XS", "iPhone XR", "iPhone X",
  "iPhone 8 Plus", "iPhone 8", "iPhone 7 Plus", "iPhone 7", "iPhone SE"
];

const SCREEN_QUALITIES = ["OLED", "SPARK", "AQ7", "Écran"];

const normalizeModelName = (name) => {
  if (!name) return "";
  let n = name.toUpperCase().replace(/\s+/g, "");
  
  // IP 17 series
  if (n.includes("17PROMAX") || n.includes("17PM")) return "iPhone 17 Pro Max";
  if (n.includes("17PRO") || n.includes("17P")) return "iPhone 17 Pro";
  if (n.includes("17PLUS")) return "iPhone 17 Plus";
  if (n === "IP17" || n === "IPHONE17") return "iPhone 17";
  
  // IP 16 series
  if (n.includes("16PROMAX") || n.includes("16PM")) return "iPhone 16 Pro Max";
  if (n.includes("16PRO") || n.includes("16P")) return "iPhone 16 Pro";
  if (n.includes("16PLUS")) return "iPhone 16 Plus";
  if (n === "IP16" || n === "IPHONE16" || n === "16") return "iPhone 16";
  
  // IP 15 series
  if (n.includes("15PROMAX") || n.includes("15PM") || n === "15PM") return "iPhone 15 Pro Max";
  if (n.includes("15PRO") || n.includes("15P")) return "iPhone 15 Pro";
  if (n.includes("15PLUS")) return "iPhone 15 Plus";
  if (n === "IP15" || n === "IPHONE15" || n === "15") return "iPhone 15";
  
  // IP 14 series
  if (n.includes("14PROMAX") || n.includes("14PM") || n === "14PM") return "iPhone 14 Pro Max";
  if (n.includes("14PRO") || n.includes("14P")) return "iPhone 14 Pro";
  if (n.includes("14PLUS")) return "iPhone 14 Plus";
  if (n === "IP14" || n === "IPHONE14" || n === "14") return "iPhone 14";
  
  // IP 13 series
  if (n.includes("13PROMAX") || n.includes("13PM") || n === "13PM") return "iPhone 13 Pro Max";
  if (n.includes("13PRO") || n.includes("13P")) return "iPhone 13 Pro";
  if (n.includes("13MINI")) return "iPhone 13 mini";
  if (n === "IP13" || n === "IPHONE13" || n === "13") return "iPhone 13";
  
  // IP 12 series
  if (n.includes("12PROMAX") || n.includes("12PM") || n === "12PM") return "iPhone 12 Pro Max";
  if (n.includes("12PRO") || n.includes("12P")) return "iPhone 12 Pro";
  if (n.includes("12MINI")) return "iPhone 12 mini";
  if (n === "IP12" || n === "IPHONE12" || n === "12") return "iPhone 12";
  
  // IP 11 series
  if (n.includes("11PROMAX") || n.includes("11PM") || n === "11PM") return "iPhone 11 Pro Max";
  if (n.includes("11PRO") || n.includes("11P")) return "iPhone 11 Pro";
  if (n === "IP11" || n === "IPHONE11" || n === "11") return "iPhone 11";
  
  // Older series
  if (n.includes("XSMAX")) return "iPhone XS Max";
  if (n.includes("XS")) return "iPhone XS";
  if (n.includes("XR")) return "iPhone XR";
  if (n === "IPX" || n === "IPHONEX" || n === "X") return "iPhone X";
  
  if (n.includes("8PLUS") || n.includes("8P")) return "iPhone 8 Plus";
  if (n === "IP8" || n === "IPHONE8" || n === "8") return "iPhone 8";
  
  if (n.includes("7PLUS") || n.includes("7P")) return "iPhone 7 Plus";
  if (n === "IP7" || n === "IPHONE7" || n === "7") return "iPhone 7";
  
  if (n.includes("SE")) return "iPhone SE";
  
  // Default fallback formatting
  let cleanName = name.trim();
  if (cleanName.startsWith("IP ") || cleanName.startsWith("IP")) {
    return cleanName.replace(/^IP\s*/i, "iPhone ");
  }
  return cleanName;
};

export default function StockEcran() {
  const [stock, setStock] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [dbTableMissing, setDbTableMissing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadStock();
  }, []);

  const loadStock = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('stock_ecran')
      .select('*');
      
    let success = false;
    if (error) {
      console.error("Erreur de chargement du stock écran:", error);
      if (error.code === 'PGRST205' || error.message?.includes('stock_ecran')) {
        setDbTableMissing(true);
      }
    } else if (data) {
      const loaded = {};
      data.forEach(item => {
        const normalizedModel = normalizeModelName(item.name);
        let quality = item.category || 'Écran';
        
        // Normalize quality typos
        if (quality.toUpperCase() === 'SOARK' || quality.toUpperCase() === 'SPARK') {
          quality = 'SPARK';
        }
        
        if (!SCREEN_QUALITIES.includes(quality)) {
          quality = 'Écran';
        }

        const key = `${normalizedModel}-${quality}`;
        // Resolve duplicates by keeping the higher quantity
        if (loaded[key]) {
          if ((item.quantity || 0) > (loaded[key].quantity || 0)) {
            loaded[key] = {
              id: item.id,
              quantity: item.quantity || 0,
              price: item.price || 0
            };
          }
        } else {
          loaded[key] = {
            id: item.id,
            quantity: item.quantity || 0,
            price: item.price || 0
          };
        }
      });
      setStock(loaded);
      setDbTableMissing(false);
      success = true;
    }
    setIsLoading(false);
    return success;
  };

  const handleCellChange = async (model, quality, field, value) => {
    const key = `${model}-${quality}`;
    const numericValue = value === '' ? 0 : parseFloat(value);
    
    // Update local state first
    setStock(prev => {
      const current = prev[key] || { quantity: 0, price: 0 };
      return {
        ...prev,
        [key]: {
          ...current,
          [field]: numericValue
        }
      };
    });

    const currentItem = stock[key];
    const updatedQty = field === 'quantity' ? numericValue : (currentItem?.quantity || 0);
    const updatedPrice = field === 'price' ? numericValue : (currentItem?.price || 0);

    if (currentItem?.id) {
      // Update existing row
      const { error } = await supabase
        .from('stock_ecran')
        .update({ quantity: updatedQty, price: updatedPrice })
        .eq('id', currentItem.id);
        
      if (error) {
        console.error("Erreur de mise à jour du stock:", error);
      }
    } else {
      // Insert new row
      const { data, error } = await supabase
        .from('stock_ecran')
        .insert([{
          name: model,
          category: quality,
          quantity: updatedQty,
          price: updatedPrice
        }])
        .select();
        
      if (error) {
        console.error("Erreur d'ajout en base du stock:", error);
      } else if (data && data[0]) {
        // Update local state with the returned ID
        setStock(prev => ({
          ...prev,
          [key]: {
            id: data[0].id,
            quantity: updatedQty,
            price: updatedPrice
          }
        }));
      }
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-full overflow-x-hidden animate-in fade-in zoom-in-95 duration-500 space-y-6">
      {dbTableMissing && (
        <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-amber-200 space-y-3">
          <div className="flex gap-3 items-start justify-between">
            <div className="flex gap-3 items-start">
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
              <div className="space-y-1">
                <p className="text-base font-bold text-amber-500">Configuration de la base de données requise ⚠️</p>
                <p className="text-sm text-muted-foreground">
                  La table <code className="bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded">stock_ecran</code> n'a pas encore été créée dans votre projet Supabase. 
                  Pour pouvoir utiliser cette page, veuillez exécuter le code SQL suivant dans l'onglet <strong>SQL Editor</strong> de votre tableau de bord Supabase.
                </p>
              </div>
            </div>
            <button
              onClick={loadStock}
              className="px-4 py-2 bg-amber-500 hover:brightness-110 active:scale-95 text-black font-bold rounded-xl transition-all flex items-center gap-2 text-sm shadow-lg shadow-amber-500/20 whitespace-nowrap"
            >
              <RefreshCw className="w-4 h-4" />
              Vérifier à nouveau
            </button>
          </div>
          
          <div className="relative mt-2 p-4 bg-black/40 rounded-xl font-mono text-xs text-muted-foreground border border-white/5 overflow-x-auto whitespace-pre">
            {SQL_CODE}
            <button
              onClick={handleCopySql}
              className="absolute top-3 right-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 font-sans text-xs font-semibold"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copier SQL
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <Smartphone className="w-10 h-10 text-primary" />
            Stock Écran
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Gérez les quantités et les prix pour chaque qualité d'écran d'iPhone</p>
        </div>
        <button
          onClick={loadStock}
          disabled={isLoading}
          className="p-2.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 transition-colors flex items-center gap-2 text-sm font-semibold text-foreground"
          title="Actualiser le stock"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          Actualiser
        </button>
      </div>

      <Card className="border-border/50 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs uppercase bg-secondary text-secondary-foreground">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold sticky left-0 z-20 bg-secondary border-r border-border min-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                  Modèle d'iPhone
                </th>
                {SCREEN_QUALITIES.map(quality => (
                  <th key={quality} scope="col" className="px-6 py-4 font-semibold text-center whitespace-nowrap min-w-[170px]">
                    {quality}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {isLoading ? (
                <tr>
                  <td colSpan={SCREEN_QUALITIES.length + 1} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      Chargement du stock...
                    </div>
                  </td>
                </tr>
              ) : IPHONE_MODELS.map((model, idx) => {
                const rowBg = idx % 2 === 0 ? "bg-card" : "bg-muted/40";
                
                return (
                  <tr key={model} className={cn("transition-colors group hover:brightness-110", rowBg)}>
                    <td className={cn(
                      "px-6 py-3 font-medium text-foreground sticky left-0 z-10 border-r border-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]",
                      rowBg
                    )}>
                      {model}
                    </td>
                    {SCREEN_QUALITIES.map(quality => {
                      const key = `${model}-${quality}`;
                      const itemData = stock[key] || { quantity: 0, price: 0 };
                      
                      return (
                        <td key={quality} className="px-4 py-3 border-r border-border/20 last:border-r-0 min-w-[170px]">
                          <div className="flex flex-col gap-2 bg-background/30 p-2 rounded-xl border border-border/10 group/cell hover:border-primary/30 hover:bg-background/50 transition-all">
                            {/* Quantity Row */}
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-[10px] font-extrabold text-muted-foreground/60 tracking-wider uppercase">Qté</span>
                              <input
                                type="number"
                                min="0"
                                value={itemData.quantity || ''}
                                onChange={(e) => handleCellChange(model, quality, 'quantity', e.target.value)}
                                className={cn(
                                  "w-20 px-2 py-1 text-center font-bold bg-secondary/50 rounded-lg border border-transparent focus:border-primary focus:ring-1 focus:ring-primary transition-all text-xs",
                                  (itemData.quantity || 0) <= 0 ? "text-destructive/80" :
                                  (itemData.quantity || 0) <= 5 ? "text-amber-500" :
                                  "text-emerald-500"
                                )}
                                placeholder="0"
                              />
                            </div>
                            {/* Price Row */}
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-[10px] font-extrabold text-muted-foreground/60 tracking-wider uppercase">Prix</span>
                              <div className="relative flex items-center font-semibold text-foreground/90">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={itemData.price || ''}
                                  onChange={(e) => handleCellChange(model, quality, 'price', e.target.value)}
                                  className="w-20 px-2 py-1 text-center bg-secondary/50 rounded-lg border border-transparent focus:border-primary focus:ring-1 focus:ring-primary transition-all text-xs pr-4"
                                  placeholder="0.00"
                                />
                                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
                                  €
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
