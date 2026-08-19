import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, UserPlus, Users, Loader2 } from 'lucide-react';

export default function Stagiaires() {
  const [stagiaires, setStagiaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');

  const fetchStagiaires = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('stagiaires')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching stagiaires:', error);
    } else {
      setStagiaires(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStagiaires();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!nom.trim() || !prenom.trim()) return;
    
    setAdding(true);
    const { data, error } = await supabase
      .from('stagiaires')
      .insert([{ nom: nom.trim(), prenom: prenom.trim() }])
      .select();

    if (error) {
      console.error('Error adding stagiaire:', error);
    } else if (data) {
      setStagiaires([data[0], ...stagiaires]);
      setNom('');
      setPrenom('');
    }
    setAdding(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce stagiaire ?')) return;

    const { error } = await supabase
      .from('stagiaires')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting stagiaire:', error);
    } else {
      setStagiaires(stagiaires.filter(s => s.id !== id));
    }
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in max-w-5xl mx-auto w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Gestion des Stagiaires
          </h1>
          <p className="text-muted-foreground mt-2">
            Ajoutez ou supprimez des profils de stagiaires.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Formulaire d'ajout */}
        <div className="md:col-span-1">
          <div className="bg-card border border-border/50 rounded-2xl shadow-sm p-6 sticky top-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
              <UserPlus className="w-5 h-5 text-primary" />
              Nouveau Stagiaire
            </h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Ex: Dupont"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Ex: Jean"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={adding || !nom.trim() || !prenom.trim()}
                className="w-full bg-primary text-primary-foreground font-bold py-2.5 px-4 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                Ajouter
              </button>
            </form>
          </div>
        </div>

        {/* Liste des stagiaires */}
        <div className="md:col-span-2">
          <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border/50 bg-muted/20">
              <h2 className="text-xl font-bold text-foreground">Liste des Stagiaires</h2>
            </div>
            
            {loading ? (
              <div className="p-12 flex justify-center items-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : stagiaires.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                <Users className="w-12 h-12 mb-4 opacity-20" />
                <p>Aucun stagiaire trouvé.</p>
                <p className="text-sm mt-1">Ajoutez-en un via le formulaire.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border/50">
                {stagiaires.map((stagiaire) => (
                  <li key={stagiaire.id} className="p-4 sm:p-6 hover:bg-muted/10 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
                        {stagiaire.prenom[0]?.toUpperCase()}{stagiaire.nom[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-lg">
                          {stagiaire.prenom} {stagiaire.nom}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Ajouté le {new Date(stagiaire.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(stagiaire.id)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
