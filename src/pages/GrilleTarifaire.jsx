import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Save, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const IPHONE_MODELS = [
  "IP17PM", "IP17P", "IP17",
  "IP16PM", "IP16P", "IP16+", "IP16",
  "IP15PM", "IP15P", "IP15+", "IP15",
  "IP14PM", "IP14P", "IP14+", "IP14",
  "IP13PM", "IP13P", "IP13", "IP13 mini",
  "IP12PM", "IP12P", "IP12", "IP12 mini",
  "IP11PM", "IP11P", "IP11",
  "IPXS Max", "IPXS", "IPXR", "IPX",
  "IP8+", "IP8", "IP7+", "IP7", "IPSE"
];

const REPAIRS = [
  "OLED", "LCD", "ORIGINAL", "Batterie", "Caméra Arrière", "Caméra Avant",
  "Connecteur Charge", "Vitre Arrière", "Châssis", "Micro/Haut-parleur"
];

export default function GrilleTarifaire() {
  const [prices, setPrices] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadPrices = async () => {
      const { data, error } = await supabase
        .from('grille_tarifaire')
        .select('*');
      
      if (error) {
        console.error("Erreur de chargement des prix:", error);
        return;
      }
      
      if (data) {
        const loadedPrices = {};
        data.forEach(item => {
          let repairName = item.repair;
          if (repairName === 'Écran' || repairName === 'Ecran') {
            repairName = 'ORIGINAL';
          }
          loadedPrices[`${item.model}-${repairName}`] = item.price;
        });
        setPrices(loadedPrices);
      }
    };
    
    loadPrices();
  }, []);

  const handlePriceChange = async (model, repair, value) => {
    setPrices(prev => ({
      ...prev,
      [`${model}-${repair}`]: value
    }));

    // Save to supabase
    const numericValue = value ? parseFloat(value) : null;
    const { error } = await supabase
      .from('grille_tarifaire')
      .upsert(
        { model, repair, price: numericValue },
        { onConflict: 'model,repair' }
      );
      
    if (error) {
      console.error("Erreur de sauvegarde:", error);
    }
  };

  const clearAll = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir tout effacer dans la base de données ?")) {
      const { error } = await supabase
        .from('grille_tarifaire')
        .delete()
        .neq('model', ''); // Deletes all rows
        
      if (!error) {
        setPrices({});
      }
    }
  };

  return (
    <div className="p-8 max-w-full overflow-x-hidden animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Grille Tarifaire</h1>
          <p className="text-muted-foreground mt-2 text-lg">Gérez les prix de réparation pour chaque modèle d'iPhone</p>
        </div>
      </div>

      <Card className="border-border/50 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs uppercase bg-secondary text-secondary-foreground">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold sticky left-0 z-20 bg-secondary border-r border-border min-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                  Modèle
                </th>
                {REPAIRS.map(repair => (
                  <th key={repair} scope="col" className="px-6 py-4 font-semibold text-center whitespace-nowrap min-w-[150px]">
                    {repair}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {IPHONE_MODELS.map((model, idx) => {
                const rowBg = idx % 2 === 0 ? "bg-card" : "bg-muted/40";
                
                return (
                  <tr key={model} className={cn("transition-colors group hover:brightness-110", rowBg)}>
                    <td className={cn(
                      "px-6 py-3 font-medium text-foreground sticky left-0 z-10 border-r border-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]",
                      rowBg
                    )}>
                      {model}
                    </td>
                    {REPAIRS.map(repair => {
                      const key = `${model}-${repair}`;
                      return (
                        <td key={key} className="px-3 py-2">
                          <div className="relative group/input">
                            <input
                              type="number"
                              placeholder="Prix"
                              value={prices[key] || ''}
                              onChange={(e) => handlePriceChange(model, repair, e.target.value)}
                              className="w-full px-3 py-2 text-center bg-transparent border border-transparent rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/30 hover:bg-background/50"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none opacity-0 group-hover/input:opacity-100 transition-opacity">
                              €
                            </span>
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
