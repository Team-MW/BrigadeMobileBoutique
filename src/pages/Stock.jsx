import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function Stock() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStock();
  }, []);

  const loadStock = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('stock')
      .select('*')
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error("Erreur de chargement du stock:", error);
    } else if (data) {
      setItems(data);
    }
    setIsLoading(false);
  };

  const handleFieldChange = async (id, field, value) => {
    // Optimistic update locally
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));

    // Save to supabase
    const numericFields = ['quantity', 'price'];
    const finalValue = numericFields.includes(field) ? (value ? parseFloat(value) : 0) : value;

    const { error } = await supabase
      .from('stock')
      .update({ [field]: finalValue })
      .eq('id', id);

    if (error) {
      console.error("Erreur de mise à jour:", error);
    }
  };

  const handleAddNewRow = async () => {
    const { data, error } = await supabase
      .from('stock')
      .insert([{ 
        name: 'Nouvel article', 
        category: '', 
        quantity: 0, 
        price: 0 
      }])
      .select();

    if (error) {
      console.error("Erreur d'ajout:", error);
    } else if (data) {
      setItems([...items, data[0]]);
    }
  };

  const deleteItem = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) {
      const { error } = await supabase
        .from('stock')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Erreur de suppression:", error);
      } else {
        setItems(items.filter(item => item.id !== id));
      }
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <Package className="w-10 h-10 text-primary" />
            Gestion du Stock
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
                  Nom de l'article
                </th>
                <th scope="col" className="px-6 py-4 font-semibold text-center whitespace-nowrap">
                  Catégorie
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
                      Chargement du stock...
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                    Aucun article. Cliquez sur "Ajouter une ligne" pour commencer.
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
                        placeholder="Catégorie..."
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
