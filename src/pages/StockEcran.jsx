import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Smartphone, AlertTriangle, Copy, Check, RefreshCw } from 'lucide-react';
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

export default function StockEcran() {
  const [items, setItems] = useState([]);
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
      .select('*')
      .order('created_at', { ascending: true });
      
    let success = false;
    if (error) {
      console.error("Erreur de chargement du stock écran:", error);
      if (error.code === 'PGRST205' || error.message?.includes('stock_ecran')) {
        setDbTableMissing(true);
      }
    } else if (data) {
      setItems(data);
      setDbTableMissing(false);
      success = true;
    }
    setIsLoading(false);
    return success;
  };

  const handleFieldChange = async (id, field, value) => {
    // Optimistic update locally
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));

    // Save to supabase
    const numericFields = ['quantity', 'price'];
    const finalValue = numericFields.includes(field) ? (value ? parseFloat(value) : 0) : value;

    const { error } = await supabase
      .from('stock_ecran')
      .update({ [field]: finalValue })
      .eq('id', id);

    if (error) {
      console.error("Erreur de mise à jour du stock écran:", error);
      alert("Erreur de mise à jour: " + error.message);
    }
  };

  const handleAddNewRow = async () => {
    let currentMissing = dbTableMissing;
    
    if (currentMissing) {
      // Try to reload stock first to see if the table has been created since the last check
      const loaded = await loadStock();
      if (!loaded) {
        alert("Impossible d'ajouter une ligne car la table 'stock_ecran' n'existe pas dans Supabase. Veuillez d'abord exécuter le script SQL ci-dessus dans Supabase.");
        return;
      }
      currentMissing = false;
    }

    const { data, error } = await supabase
      .from('stock_ecran')
      .insert([{ 
        name: 'Nouvel écran', 
        category: 'Écran', 
        quantity: 0, 
        price: 0 
      }])
      .select();

    if (error) {
      console.error("Erreur d'ajout d'écran:", error);
      alert("Erreur d'ajout d'écran: " + error.message);
      if (error.code === 'PGRST205' || error.message?.includes('stock_ecran')) {
        setDbTableMissing(true);
      }
    } else if (data) {
      setItems([...items, data[0]]);
    }
  };

  const deleteItem = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet écran ?")) {
      const { error } = await supabase
        .from('stock_ecran')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Erreur de suppression de l'écran:", error);
        alert("Erreur de suppression: " + error.message);
      } else {
        setItems(items.filter(item => item.id !== id));
      }
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-500 space-y-6">
      {dbTableMissing && (
        <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-amber-200 space-y-3">
          <div className="flex gap-3 items-start justify-between">
            <div className="flex gap-3 items-start">
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
              <div className="space-y-1">
                <p className="text-base font-bold text-amber-500">Configuration de la base de données requise ⚠️</p>
                <p className="text-sm text-muted-foreground">
                  La table <code className="bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded">stock_ecran</code> n'a pas encore été créée dans votre projet Supabase. 
                  Pour pouvoir utiliser cette page et ajouter des lignes de stock, veuillez exécuter le code SQL suivant dans l'onglet <strong>SQL Editor</strong> de votre tableau de bord Supabase.
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

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <Smartphone className="w-10 h-10 text-primary" />
            Stock Écran
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Modifiez directement les cellules comme dans Excel</p>
        </div>
        <button 
          onClick={handleAddNewRow}
          className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:brightness-110 transition-all flex items-center gap-2 font-bold shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Ajouter une ligne
        </button>
      </div>

      <Card className="border-border/50 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs uppercase bg-secondary text-secondary-foreground">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold sticky left-0 z-20 bg-secondary border-r border-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                  Nom du modèle / écran
                </th>
                <th scope="col" className="px-6 py-4 font-semibold text-center whitespace-nowrap">
                  Qualité / Catégorie
                </th>
                <th scope="col" className="px-6 py-4 font-semibold text-center whitespace-nowrap">
                  Quantité
                </th>
                <th scope="col" className="px-6 py-4 font-semibold text-center whitespace-nowrap">
                  Prix (€)
                </th>
                <th scope="col" className="px-6 py-4 font-semibold text-center whitespace-nowrap w-16">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      Chargement du stock écran...
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                    Aucun écran en stock. Cliquez sur "Ajouter une ligne" pour commencer.
                  </td>
                </tr>
              ) : items.map((item, idx) => {
                const rowBg = idx % 2 === 0 ? "bg-card" : "bg-muted/40";
                
                return (
                  <tr key={item.id} className={cn("transition-colors group hover:brightness-110", rowBg)}>
                    <td className={cn(
                      "px-3 py-2 font-medium sticky left-0 z-10 border-r border-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]",
                      rowBg
                    )}>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleFieldChange(item.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 font-medium bg-transparent border border-transparent rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/30 hover:bg-background/50"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        placeholder="Qualité ou catégorie..."
                        value={item.category || ''}
                        onChange={(e) => handleFieldChange(item.id, 'category', e.target.value)}
                        className="w-full px-3 py-2 text-center bg-transparent border border-transparent rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/30 hover:bg-background/50"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleFieldChange(item.id, 'quantity', e.target.value)}
                        className={cn(
                          "w-full px-3 py-2 text-center font-bold bg-transparent border border-transparent rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all hover:bg-background/50",
                          item.quantity <= 0 ? "text-destructive" :
                          item.quantity <= 5 ? "text-amber-500" :
                          "text-emerald-500"
                        )}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="relative group/input">
                        <input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => handleFieldChange(item.id, 'price', e.target.value)}
                          className="w-full px-3 py-2 text-center bg-transparent border border-transparent rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all hover:bg-background/50"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none opacity-0 group-hover/input:opacity-100 transition-opacity">
                          €
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button 
                        onClick={() => deleteItem(item.id)} 
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 mx-auto block" 
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
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
