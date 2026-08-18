import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Save, RefreshCw, Search, X, Tags } from 'lucide-react';
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
  "OLED", "OLED +", "LCD", "ORIGINAL", "Batt", "Batt +", "Cam Arr", "Cam Av",
  "Conn Charge", "Vitre Arr", "Châssis", "Micro/HP"
];

export default function GrilleTarifaire() {
  const [prices, setPrices] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredModels = IPHONE_MODELS.filter(model =>
    model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const loadPrices = async () => {
      setIsLoading(true);
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
          if (repairName === 'Écran' || repairName === 'Ecran') repairName = 'ORIGINAL';
          if (repairName === 'Batterie') repairName = 'Batt';
          if (repairName === 'Batterie +') repairName = 'Batt +';
          if (repairName === 'Caméra Arrière') repairName = 'Cam Arr';
          if (repairName === 'Caméra Avant') repairName = 'Cam Av';
          if (repairName === 'Connecteur Charge') repairName = 'Conn Charge';
          if (repairName === 'Vitre Arrière') repairName = 'Vitre Arr';
          if (repairName === 'Micro/Haut-parleur') repairName = 'Micro/HP';
          loadedPrices[`${item.model}-${repairName}`] = item.price;
        });
        setPrices(loadedPrices);
      }
      setIsLoading(false);
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
    <div className="p-4 sm:p-8 max-w-full overflow-x-hidden animate-in fade-in zoom-in-95 duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <Tags className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            Grille Tarifaire
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-lg">Gérez les prix de réparation pour chaque modèle d'iPhone</p>
        </div>
        <button
          onClick={() => {
            const loadPrices = async () => {
              setIsLoading(true);
              const { data, error } = await supabase.from('grille_tarifaire').select('*');
              if (data) {
                const loadedPrices = {};
                data.forEach(item => {
                  let repairName = item.repair;
                  if (repairName === 'Écran' || repairName === 'Ecran') repairName = 'ORIGINAL';
                  if (repairName === 'Batterie') repairName = 'Batt';
                  if (repairName === 'Batterie +') repairName = 'Batt +';
                  if (repairName === 'Caméra Arrière') repairName = 'Cam Arr';
                  if (repairName === 'Caméra Avant') repairName = 'Cam Av';
                  if (repairName === 'Connecteur Charge') repairName = 'Conn Charge';
                  if (repairName === 'Vitre Arrière') repairName = 'Vitre Arr';
                  if (repairName === 'Micro/Haut-parleur') repairName = 'Micro/HP';
                  loadedPrices[`${item.model}-${repairName}`] = item.price;
                });
                setPrices(loadedPrices);
              }
              setIsLoading(false);
            };
            loadPrices();
          }}
          disabled={isLoading}
          className="p-2.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 transition-colors flex items-center gap-2 text-sm font-semibold text-foreground shrink-0 self-start sm:self-auto"
          title="Actualiser les prix"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          Actualiser
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-4 h-4 text-muted-foreground" />
        </span>
        <input
          type="text"
          placeholder="Rechercher un modèle..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-card/50 backdrop-blur-sm rounded-xl border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm font-medium text-foreground transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <Card className="border-border/50 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs uppercase bg-secondary text-secondary-foreground">
              <tr>
                <th scope="col" className="px-3 sm:px-6 py-3 sm:py-4 font-semibold sticky left-0 z-20 bg-secondary border-r border-border min-w-[100px] sm:min-w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                  Modèle
                </th>
                {REPAIRS.map(repair => (
                  <th key={repair} scope="col" className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-center whitespace-nowrap min-w-[85px] sm:min-w-[120px]">
                    {repair}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {isLoading ? (
                <tr>
                  <td colSpan={REPAIRS.length + 1} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      Chargement des prix...
                    </div>
                  </td>
                </tr>
              ) : filteredModels.length === 0 ? (
                <tr>
                  <td colSpan={REPAIRS.length + 1} className="px-6 py-12 text-center text-muted-foreground font-medium">
                    Aucun modèle trouvé pour "{searchQuery}".
                  </td>
                </tr>
              ) : filteredModels.map((model, idx) => {
                const rowBg = idx % 2 === 0 ? "bg-card" : "bg-muted/40";
                
                return (
                  <tr key={model} className={cn("transition-colors group hover:brightness-110", rowBg)}>
                    <td className={cn(
                      "px-3 sm:px-6 py-2.5 sm:py-3 font-medium text-foreground sticky left-0 z-10 border-r border-border min-w-[100px] sm:min-w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]",
                      idx % 2 === 0 ? "bg-card" : "bg-muted"
                    )}>
                      {model}
                    </td>
                    {REPAIRS.map(repair => {
                      const key = `${model}-${repair}`;
                      const priceValue = prices[key] || '';
                      
                      return (
                        <td key={repair} className="px-1.5 sm:px-4 py-2 sm:py-3 border-r border-border/20 last:border-r-0 min-w-[85px] sm:min-w-[120px]">
                          <div className="flex justify-center bg-background/30 p-1 sm:p-1.5 rounded-xl border border-border/10 group/cell hover:border-primary/30 hover:bg-background/50 transition-all relative">
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={priceValue}
                              onChange={(e) => handlePriceChange(model, repair, e.target.value)}
                              className={cn(
                                "w-full max-w-[65px] sm:max-w-[80px] px-1.5 sm:px-2 py-0.5 sm:py-1 text-center font-bold bg-secondary/50 rounded-lg border border-transparent focus:border-primary focus:ring-1 focus:ring-primary transition-all text-xs sm:text-sm",
                                priceValue ? "text-emerald-500" : "text-muted-foreground/30"
                              )}
                            />
                            {priceValue && (
                              <span className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-emerald-500/50 pointer-events-none font-bold">
                                €
                              </span>
                            )}
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
