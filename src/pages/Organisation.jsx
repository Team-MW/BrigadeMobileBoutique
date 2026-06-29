import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Plus,
  GripVertical,
  Trash2,
  Calendar,
  LayoutGrid,
  Clock,
  User,
  Flag,
  Search,
  Phone,
  Edit2,
  Euro,
  X,
  PlusCircle,
  FolderKanban,
  Eye
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const COLUMNS = {
  todo: { 
    name: 'A FAIRE', 
    dot: 'bg-slate-400', 
    headerBg: 'bg-slate-100', 
    badgeBg: 'bg-slate-200/80', 
    badgeText: 'text-slate-700',
    accentBorder: 'border-l-slate-400' 
  },
  inProgress: { 
    name: 'EN COURS', 
    dot: 'bg-blue-500', 
    headerBg: 'bg-blue-50', 
    badgeBg: 'bg-blue-100', 
    badgeText: 'text-blue-700',
    accentBorder: 'border-l-blue-500'
  },
  blocked: { 
    name: 'BLOQUÉ', 
    dot: 'bg-rose-500', 
    headerBg: 'bg-rose-50', 
    badgeBg: 'bg-rose-100', 
    badgeText: 'text-rose-700',
    accentBorder: 'border-l-rose-500'
  },
  done: { 
    name: 'TERMINÉ', 
    dot: 'bg-emerald-500', 
    headerBg: 'bg-emerald-50', 
    badgeBg: 'bg-emerald-100', 
    badgeText: 'text-emerald-700',
    accentBorder: 'border-l-emerald-500'
  }
};

const STATUS_DB_MAPPING = {
  todo: 'A FAIRE',
  inProgress: 'EN COURS',
  blocked: 'BLOQUÉ',
  done: 'TERMINÉ'
};

const STATUS_COL_MAPPING = {
  'A FAIRE': 'todo',
  'EN COURS': 'inProgress',
  'BLOQUÉ': 'blocked',
  'TERMINÉ': 'done'
};

export default function Organisation() {
  const [columns, setColumns] = useState({
    todo: [],
    inProgress: [],
    blocked: [],
    done: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const viewSaleSheet = (ticket) => {
    localStorage.setItem('sales_search_filter', ticket.client);
    navigate('/ventes');
  };

  // Dialog state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addColId, setAddColId] = useState('todo');
  const [addForm, setAddForm] = useState({ title: '', client: '', phone: '', price: '' });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', title: '', client: '', phone: '', price: '', status: '' });

  const generateId = () => Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('repair_tickets')
      .select('*')
      .order('position', { ascending: true });

    if (error) {
      const local = localStorage.getItem('local_tickets_v2');
      if (local) setColumns(JSON.parse(local));
      setLoading(false);
      return;
    }

    if (data) {
      const newCols = { todo: [], inProgress: [], blocked: [], done: [] };
      data.forEach(ticket => {
        let colId = 'todo';
        if (ticket.status === 'EN COURS') colId = 'inProgress';
        if (ticket.status === 'BLOQUÉ') colId = 'blocked';
        if (ticket.status === 'TERMINÉ') colId = 'done';
        
        if (newCols[colId]) {
          newCols[colId].push({
            id: ticket.id,
            title: ticket.title,
            client: ticket.client || 'Client',
            phone: ticket.phone,
            price: ticket.price,
            status: ticket.status,
            date: ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Aujourd\'hui'
          });
        }
      });
      setColumns(newCols);
    }
    setLoading(false);
  };

  const saveToSupabase = async (ticket) => {
    const { error } = await supabase
      .from('repair_tickets')
      .upsert({
        id: ticket.id.startsWith('temp-') ? undefined : ticket.id,
        title: ticket.title,
        client: ticket.client,
        phone: ticket.phone,
        status: ticket.status,
        price: ticket.price
      });
      
    if (error) {
      localStorage.setItem('local_tickets_v2', JSON.stringify(columns));
    } else {
      await syncTicketToSales(ticket);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
      const sourceCol = [...columns[source.droppableId]];
      const destCol = [...columns[destination.droppableId]];
      const [removed] = sourceCol.splice(source.index, 1);
      
      let newStatus = STATUS_DB_MAPPING[destination.droppableId];
      
      removed.status = newStatus;
      destCol.splice(destination.index, 0, removed);

      const newColumns = {
        ...columns,
        [source.droppableId]: sourceCol,
        [destination.droppableId]: destCol
      };
      
      setColumns(newColumns);
      await saveToSupabase(removed);
      localStorage.setItem('local_tickets_v2', JSON.stringify(newColumns));
      
      destCol.forEach(async (t, idx) => {
        await supabase.from('repair_tickets').update({ position: idx }).eq('id', t.id);
      });
      sourceCol.forEach(async (t, idx) => {
        await supabase.from('repair_tickets').update({ position: idx }).eq('id', t.id);
      });

    } else {
      const col = [...columns[source.droppableId]];
      const [removed] = col.splice(source.index, 1);
      col.splice(destination.index, 0, removed);
      
      const newColumns = { ...columns, [source.droppableId]: col };
      setColumns(newColumns);
      localStorage.setItem('local_tickets_v2', JSON.stringify(newColumns));
      
      col.forEach(async (t, idx) => {
        await supabase.from('repair_tickets').update({ position: idx }).eq('id', t.id);
      });
    }
  };

  // Add Ticket dialog triggers
  const handleOpenAdd = (colId) => {
    setAddColId(colId);
    setAddForm({ title: '', client: '', phone: '', price: '' });
    setIsAddOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.title.trim()) return;

    const newStatus = STATUS_DB_MAPPING[addColId];
    
    // Optimistic temporary ID
    const tempId = `temp-${generateId()}`;
    const newTicketLocal = { 
      id: tempId, 
      title: addForm.title, 
      client: addForm.client || 'Client', 
      phone: addForm.phone || '', 
      price: addForm.price ? parseFloat(addForm.price) : null, 
      status: newStatus,
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    };

    // Insert to DB
    const { data, error } = await supabase
      .from('repair_tickets')
      .insert([{ 
        title: addForm.title, 
        client: addForm.client || 'Client', 
        phone: addForm.phone || '', 
        status: newStatus, 
        price: addForm.price ? parseFloat(addForm.price) : null,
        position: columns[addColId].length 
      }])
      .select();

    let finalTicket = newTicketLocal;
    if (!error && data && data.length > 0) {
      finalTicket = {
        ...data[0],
        date: new Date(data[0].created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      };
    }

    const newColumns = {
      ...columns,
      [addColId]: [...columns[addColId], finalTicket]
    };
    setColumns(newColumns);
    localStorage.setItem('local_tickets_v2', JSON.stringify(newColumns));
    setIsAddOpen(false);
  };

  // Edit Ticket dialog triggers
  const handleOpenEdit = (ticket, colId) => {
    setEditForm({
      id: ticket.id,
      title: ticket.title,
      client: ticket.client,
      phone: ticket.phone || '',
      price: ticket.price !== null && ticket.price !== undefined ? String(ticket.price) : '',
      status: colId
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) return;

    const oldColId = Object.keys(columns).find(colId => 
      columns[colId].some(t => t.id === editForm.id)
    );

    if (!oldColId) return;

    const newStatus = STATUS_DB_MAPPING[editForm.status];
    const priceVal = editForm.price ? parseFloat(editForm.price) : null;

    const updatedLocalTicket = {
      id: editForm.id,
      title: editForm.title,
      client: editForm.client || 'Client',
      phone: editForm.phone,
      price: priceVal,
      status: newStatus,
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) // fallback
    };

    // Update DB
    const { error } = await supabase
      .from('repair_tickets')
      .update({
        title: editForm.title,
        client: editForm.client,
        phone: editForm.phone,
        status: newStatus,
        price: priceVal
      })
      .eq('id', editForm.id);

    if (error) {
      console.error("Error updating ticket:", error.message);
    } else {
      await syncTicketToSales(updatedLocalTicket);
    }

    // Local update
    let newColumns = { ...columns };

    if (oldColId === editForm.status) {
      newColumns[oldColId] = newColumns[oldColId].map(t => 
        t.id === editForm.id ? { ...t, ...updatedLocalTicket } : t
      );
    } else {
      // Move between columns
      newColumns[oldColId] = newColumns[oldColId].filter(t => t.id !== editForm.id);
      newColumns[editForm.status] = [...newColumns[editForm.status], updatedLocalTicket];

      // Update positions
      newColumns[editForm.status].forEach(async (t, idx) => {
        await supabase.from('repair_tickets').update({ position: idx }).eq('id', t.id);
      });
      newColumns[oldColId].forEach(async (t, idx) => {
        await supabase.from('repair_tickets').update({ position: idx }).eq('id', t.id);
      });
    }

    setColumns(newColumns);
    localStorage.setItem('local_tickets_v2', JSON.stringify(newColumns));
    setIsEditOpen(false);
  };

  const deleteTicket = async (colId, ticketId, index) => {
    if (!window.confirm("Supprimer définitivement cette tâche ?")) return;
    
    const col = [...columns[colId]];
    col.splice(index, 1);
    
    const newColumns = { ...columns, [colId]: col };
    setColumns(newColumns);
    localStorage.setItem('local_tickets_v2', JSON.stringify(newColumns));
    
    if (!ticketId.startsWith('temp-')) {
      await supabase.from('repair_tickets').delete().eq('id', ticketId);
    }
  };

  // Text filters
  const getFilteredTickets = (colTickets) => {
    if (!searchTerm.trim()) return colTickets;
    const term = searchTerm.toLowerCase();
    return colTickets.filter(t => 
      (t.title && t.title.toLowerCase().includes(term)) ||
      (t.client && t.client.toLowerCase().includes(term)) ||
      (t.phone && t.phone.toLowerCase().includes(term))
    );
  };

  // ClickUp initials helper
  const getInitials = (name) => {
    if (!name) return 'U';
    const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const parts = cleanName.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Pastel generator for avatar backgrounds
  const getPastelColor = (name) => {
    if (!name) return '#F1F5F9';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 90%)`;
  };

  const getTextColor = (name) => {
    if (!name) return '#475569';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 75%, 25%)`;
  };

  // Title parser to split the tags
  const parseTitle = (title) => {
    if (!title) return { type: null, clean: '' };
    let type = null;
    let clean = title;
    
    if (title.toUpperCase().includes('[VENTE]')) {
      type = 'VENTE';
      clean = title.replace(/\[VENTE\]/gi, '').trim();
    } else if (title.toUpperCase().includes('[RÉPARATION]')) {
      type = 'RÉPARATION';
      clean = title.replace(/\[RÉPARATION\]/gi, '').trim();
    }
    
    return { type, clean };
  };

  // Sync ticket status changes to the sales table in Supabase
  const syncTicketToSales = async (ticket) => {
    let saleStatus = null;
    if (ticket.status === 'TERMINÉ') saleStatus = 'Terminé';
    else if (ticket.status === 'EN COURS') saleStatus = 'En cours';
    else if (ticket.status === 'A FAIRE') saleStatus = 'En attente';

    if (!saleStatus) return;

    const { type, clean } = parseTitle(ticket.title);
    const parts = clean.split(' - ');
    const service = parts[0] ? parts[0].trim() : '';
    const phone = parts[1] ? parts[1].trim() : '';

    let query = supabase
      .from('sales')
      .update({ status: saleStatus })
      .eq('client', ticket.client);

    if (ticket.phone) {
      query = query.eq('clientphone', ticket.phone);
    }
    if (service) {
      query = query.eq('service', service);
    }
    if (phone) {
      query = query.eq('phone', phone);
    }

    const { error } = await query;
    if (error) {
      console.warn('Silent warning syncing ticket status to sales:', error.message);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#f7f8f9] text-slate-800 font-sans p-6 animate-in fade-in duration-300">
      
      {/* HEADER SECTION - CLICKUP STYLE */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Organisation & Tâches
              </h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide">
                Tableau de bord de gestion des réparations et commandes
              </p>
            </div>
          </div>
          
          {/* SEARCH BAR & VIEW SELECTOR */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher une tâche..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-8 bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-medium text-slate-700 shadow-sm focus:outline-none transition-all"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>

            <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200 shadow-sm">
              <button className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1.5 rounded-md">
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Calendrier</span>
              </button>
              <button className="px-3.5 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-md flex items-center gap-1.5 border border-indigo-100 shadow-xs">
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Tableau</span>
              </button>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-slate-200 w-full" />
      </div>

      {/* LOADING STATE */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-24">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider animate-pulse">Chargement de ClickUp Board...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-6 snap-x snap-mandatory md:snap-none hide-scrollbar">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-5 items-start h-full px-1">
              
              {Object.entries(columns).map(([colId, colTickets]) => {
                const colConfig = COLUMNS[colId];
                const filteredTickets = getFilteredTickets(colTickets);
                
                return (
                  <div 
                    key={colId} 
                    className="flex-shrink-0 w-[85vw] sm:w-[300px] flex flex-col bg-slate-100/70 border border-slate-200/50 rounded-2xl p-3 snap-center shadow-xs"
                  >
                    {/* COLUMN HEADER */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", colConfig.dot)} />
                        <span className="font-extrabold text-[11px] text-slate-700 tracking-wider uppercase">
                          {colConfig.name}
                        </span>
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-extrabold", colConfig.badgeBg, colConfig.badgeText)}>
                          {filteredTickets.length}
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => handleOpenAdd(colId)}
                        className="text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg p-1.5 transition-all shadow-xs border border-transparent hover:border-slate-200/50"
                        title="Ajouter une tâche"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* DROP AREA */}
                    <Droppable droppableId={colId}>
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={cn(
                            "flex-1 flex flex-col gap-2.5 min-h-[400px] transition-colors rounded-xl p-0.5",
                            snapshot.isDraggingOver && "bg-slate-200/30"
                          )}
                        >
                          {/* EMPTY STATE */}
                          {filteredTickets.length === 0 && !snapshot.isDraggingOver && (
                            <div className="border border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 bg-white/50 text-[10px] font-bold uppercase tracking-widest text-center gap-2">
                              Aucune tâche
                            </div>
                          )}

                          {/* TICKETS */}
                          {filteredTickets.map((ticket, index) => {
                            const { type, clean } = parseTitle(ticket.title);
                            const initials = getInitials(ticket.client);
                            const avatarBg = getPastelColor(ticket.client);
                            const avatarText = getTextColor(ticket.client);

                            return (
                              <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={cn(
                                      "select-none group relative bg-white rounded-xl p-3.5 border border-slate-200/80",
                                      "shadow-sm hover:shadow-md transition-all duration-200 border-l-4",
                                      colConfig.accentBorder,
                                      "cursor-grab active:cursor-grabbing",
                                      snapshot.isDragging && "rotate-1.5 scale-102 shadow-xl z-50 ring-2 ring-indigo-500/10 cursor-grabbing",
                                      "transition-all duration-200"
                                    )}
                                  >
                                    {/* CARD BODY */}
                                    <div className="flex flex-col gap-2.5 transition-all duration-200">
                                      
                                      {/* BADGES ROW */}
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                          {type === 'VENTE' && (
                                            <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-amber-50 text-amber-600 border border-amber-200/50 rounded-md">
                                              Vente
                                            </span>
                                          )}
                                          {type === 'RÉPARATION' && (
                                            <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-indigo-50 text-indigo-600 border border-indigo-200/50 rounded-md">
                                              Réparation
                                            </span>
                                          )}
                                          {!type && (
                                            <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-slate-50 text-slate-500 border border-slate-200/50 rounded-md">
                                              Mission
                                            </span>
                                          )}
                                        </div>

                                        {/* HOVER ACTIONS */}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          {(type === 'VENTE' || type === 'RÉPARATION') && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                viewSaleSheet(ticket);
                                              }}
                                              className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded transition-colors"
                                              title="Voir la fiche vente"
                                            >
                                              <Eye className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOpenEdit(ticket, colId);
                                            }}
                                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded transition-colors"
                                            title="Modifier"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              deleteTicket(colId, ticket.id, index);
                                            }}
                                            className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded transition-colors"
                                            title="Supprimer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>

                                      {/* TASK TITLE */}
                                      <h4 className="font-bold text-[13px] text-slate-800 leading-snug group-hover:text-slate-900 transition-colors">
                                        {clean}
                                      </h4>

                                      {/* CLIENT AVATAR & NAME */}
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black border border-black/5 shadow-inner"
                                          style={{ backgroundColor: avatarBg, color: avatarText }}
                                        >
                                          {initials}
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-600 truncate max-w-[150px]">
                                          {ticket.client}
                                        </span>
                                      </div>

                                      {/* METADATA FOOTER */}
                                      <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-0.5">
                                        
                                        {/* PRICE TAG */}
                                        {ticket.price !== null && ticket.price !== undefined && ticket.price > 0 ? (
                                          <div className="flex items-center text-[10px] font-extrabold text-slate-600 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md">
                                            {ticket.price.toFixed(2)} €
                                          </div>
                                        ) : (
                                          <div className="w-2" />
                                        )}

                                        {/* DATE & PHONE */}
                                        <div className="flex items-center gap-2.5 text-[10px] text-slate-400 font-bold">
                                          {ticket.phone && (
                                            <span className="flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors" title={ticket.phone}>
                                              <Phone className="w-3 h-3 text-slate-300" />
                                            </span>
                                          )}
                                          <span className="uppercase tracking-wider">
                                            {ticket.date}
                                          </span>
                                        </div>
                                      </div>

                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}

                          {/* INLINE ADD BUTTON */}
                          <button
                            onClick={() => handleOpenAdd(colId)}
                            className="mt-1 w-full border border-dashed border-slate-300 hover:border-indigo-400 bg-white/40 hover:bg-white rounded-xl py-2 px-3 flex items-center justify-center gap-1.5 text-slate-500 hover:text-indigo-600 font-bold text-[10px] uppercase tracking-wider transition-all shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Créer une tâche
                          </button>
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>
      )}

      {/* --- ADD TICKET DIALOG --- */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 font-black">
              <PlusCircle className="w-5 h-5 text-indigo-600" />
              Ajouter une mission / tâche
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="add-title" className="text-xs font-bold text-slate-700">Titre de la tâche / Diagnostic *</Label>
              <Input
                id="add-title"
                placeholder="Ex: Remplacement batterie - iPhone 12"
                value={addForm.title}
                onChange={e => setAddForm(prev => ({ ...prev, title: e.target.value }))}
                required
                className="h-10 bg-slate-50 border-slate-200 text-slate-800 text-sm focus:bg-white transition-all rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="add-client" className="text-xs font-bold text-slate-700">Client / Assigné</Label>
                <Input
                  id="add-client"
                  placeholder="Nom du client"
                  value={addForm.client}
                  onChange={e => setAddForm(prev => ({ ...prev, client: e.target.value }))}
                  className="h-10 bg-slate-50 border-slate-200 text-slate-800 text-sm focus:bg-white transition-all rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-phone" className="text-xs font-bold text-slate-700">N° Téléphone</Label>
                <Input
                  id="add-phone"
                  placeholder="06 00 00 00 00"
                  value={addForm.phone}
                  onChange={e => setAddForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="h-10 bg-slate-50 border-slate-200 text-slate-800 text-sm focus:bg-white transition-all rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-price" className="text-xs font-bold text-slate-700">Tarif / Prix (€)</Label>
              <Input
                id="add-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={addForm.price}
                onChange={e => setAddForm(prev => ({ ...prev, price: e.target.value }))}
                className="h-10 bg-slate-50 border-slate-200 text-slate-800 text-sm focus:bg-white transition-all rounded-lg"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-lg h-10 text-xs font-bold">
                Annuler
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-10 text-xs font-bold shadow-md shadow-indigo-100">
                Créer la tâche
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- EDIT TICKET DIALOG --- */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 font-black">
              <Edit2 className="w-5 h-5 text-indigo-600" />
              Modifier la tâche
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title" className="text-xs font-bold text-slate-700">Titre de la tâche / Diagnostic *</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                required
                className="h-10 bg-slate-50 border-slate-200 text-slate-800 text-sm focus:bg-white transition-all rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-client" className="text-xs font-bold text-slate-700">Client / Assigné</Label>
                <Input
                  id="edit-client"
                  value={editForm.client}
                  onChange={e => setEditForm(prev => ({ ...prev, client: e.target.value }))}
                  className="h-10 bg-slate-50 border-slate-200 text-slate-800 text-sm focus:bg-white transition-all rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-phone" className="text-xs font-bold text-slate-700">N° Téléphone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="h-10 bg-slate-50 border-slate-200 text-slate-800 text-sm focus:bg-white transition-all rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-price" className="text-xs font-bold text-slate-700">Tarif / Prix (€)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.price}
                  onChange={e => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                  className="h-10 bg-slate-50 border-slate-200 text-slate-800 text-sm focus:bg-white transition-all rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-status" className="text-xs font-bold text-slate-700">Statut / Colonne</Label>
                <select
                  id="edit-status"
                  value={editForm.status}
                  onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
                >
                  <option value="todo">A FAIRE</option>
                  <option value="inProgress">EN COURS</option>
                  <option value="blocked">BLOQUÉ</option>
                  <option value="done">TERMINÉ</option>
                </select>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-lg h-10 text-xs font-bold">
                Annuler
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-10 text-xs font-bold shadow-md shadow-indigo-100">
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
