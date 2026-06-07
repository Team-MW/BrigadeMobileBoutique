import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, GripVertical, Trash2, Calendar, LayoutGrid, Clock, User, Flag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const COLUMNS = {
  todo: { name: 'A FAIRE', dot: 'bg-slate-300', icon: null },
  inProgress: { name: 'EN COURS', dot: 'bg-blue-400', icon: null },
  blocked: { name: 'BLOQUÉ', dot: 'bg-red-400', icon: null },
  done: { name: 'TERMINÉ', dot: 'bg-emerald-400', icon: null }
};

export default function Organisation() {
  const [columns, setColumns] = useState({
    todo: [],
    inProgress: [],
    blocked: [],
    done: []
  });
  const [loading, setLoading] = useState(true);

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
        id: ticket.id.includes('-') ? ticket.id : undefined,
        title: ticket.title,
        client: ticket.client,
        phone: ticket.phone,
        status: ticket.status,
        price: ticket.price
      });
      
    if (error) {
      localStorage.setItem('local_tickets_v2', JSON.stringify(columns));
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
      const sourceCol = [...columns[source.droppableId]];
      const destCol = [...columns[destination.droppableId]];
      const [removed] = sourceCol.splice(source.index, 1);
      
      let newStatus = 'A FAIRE';
      if (destination.droppableId === 'inProgress') newStatus = 'EN COURS';
      if (destination.droppableId === 'blocked') newStatus = 'BLOQUÉ';
      if (destination.droppableId === 'done') newStatus = 'TERMINÉ';
      
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

  const addNewTicket = async (colId) => {
    const title = prompt('Tâche ou mission à ajouter :');
    if (!title) return;
    const client = prompt('Assigné à / Client :') || 'Utilisateur';
    
    let newStatus = 'A FAIRE';
    if (colId === 'inProgress') newStatus = 'EN COURS';
    if (colId === 'blocked') newStatus = 'BLOQUÉ';
    if (colId === 'done') newStatus = 'TERMINÉ';

    const newTicketLocal = { 
      id: `temp-${generateId()}`, 
      title, 
      client, 
      phone: '', 
      price: null, 
      status: newStatus,
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    };
    
    const { data, error } = await supabase
      .from('repair_tickets')
      .insert([{ title, client, status: newStatus, position: columns[colId].length }])
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
      [colId]: [...columns[colId], finalTicket]
    };
    setColumns(newColumns);
    localStorage.setItem('local_tickets_v2', JSON.stringify(newColumns));
  };

  const deleteTicket = async (colId, ticketId, index) => {
    if (!window.confirm("Supprimer cette tâche ?")) return;
    
    const col = [...columns[colId]];
    col.splice(index, 1);
    
    const newColumns = { ...columns, [colId]: col };
    setColumns(newColumns);
    localStorage.setItem('local_tickets_v2', JSON.stringify(newColumns));
    
    if (!ticketId.startsWith('temp-')) {
      await supabase.from('repair_tickets').delete().eq('id', ticketId);
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-[calc(100vh-4rem)] flex flex-col w-full animate-in fade-in duration-500 bg-background md:bg-transparent">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground uppercase tracking-tight">Organisation & Missions</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base font-medium uppercase tracking-wider">Gérez vos tâches comme sur clickup.</p>
        </div>
        
        <div className="flex items-center bg-card rounded-xl p-1 shadow-sm border border-border/50">
          <button className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 rounded-lg">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">CALENDRIER</span>
          </button>
          <button className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg shadow-md flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">TABLEAU</span>
          </button>
        </div>
      </div>

      {/* KANBAN BOARD */}
      <div className="flex-1 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none hide-scrollbar">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 md:gap-6 items-start h-full px-1">
            {Object.entries(columns).map(([colId, colTickets]) => (
              <div key={colId} className="flex-shrink-0 w-[85vw] sm:w-80 flex flex-col bg-slate-50/50 dark:bg-card/40 border border-border/40 rounded-2xl p-4 snap-center">
                
                {/* COLUMN HEADER */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-3 h-3 rounded-full shadow-sm", COLUMNS[colId].dot)} />
                    <span className="font-bold text-sm text-foreground tracking-wide">{COLUMNS[colId].name}</span>
                    <span className="bg-muted px-2 py-0.5 rounded-full text-xs font-semibold text-muted-foreground">
                      {colTickets.length}
                    </span>
                  </div>
                  <button 
                    onClick={() => addNewTicket(colId)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                {/* DROP AREA */}
                <Droppable droppableId={colId}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={cn(
                        "flex-1 flex flex-col gap-3 min-h-[150px] transition-colors rounded-xl",
                        snapshot.isDraggingOver && "bg-muted/30"
                      )}
                    >
                      {/* EMPTY STATE */}
                      {colTickets.length === 0 && !snapshot.isDraggingOver && (
                        <div className="border-2 border-dashed border-border/60 rounded-xl p-8 flex items-center justify-center text-muted-foreground/50 text-xs font-bold tracking-widest uppercase">
                          Aucune Mission
                        </div>
                      )}

                      {/* TICKETS */}
                      {colTickets.map((ticket, index) => (
                        <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                "select-none group relative bg-card rounded-xl p-4 border border-border/50",
                                "shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_4px_15px_-3px_rgba(6,81,237,0.15)]",
                                snapshot.isDragging && "rotate-2 scale-105 shadow-2xl z-50 ring-2 ring-primary/20",
                                "transition-all duration-200"
                              )}
                            >
                              <div 
                                {...provided.dragHandleProps} 
                                className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-foreground transition-opacity"
                              >
                                <GripVertical className="w-4 h-4" />
                              </div>

                              <div className="flex flex-col gap-3 ml-2 group-hover:ml-6 transition-all duration-200">
                                {/* CARD HEADER */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center border border-border">
                                      <User className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider">{ticket.client}</span>
                                  </div>
                                  <Flag className={cn(
                                    "w-4 h-4",
                                    colId === 'done' ? "text-emerald-500" :
                                    colId === 'blocked' ? "text-red-500" :
                                    colId === 'inProgress' ? "text-blue-500" : "text-slate-400"
                                  )} />
                                </div>

                                {/* CARD TITLE */}
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-extrabold text-[15px] text-foreground leading-tight">{ticket.title}</h4>
                                  <button 
                                    onClick={() => deleteTicket(colId, ticket.id, index)}
                                    className="text-muted-foreground/30 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all p-1"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>

                                {/* CARD FOOTER */}
                                <div className="flex items-center gap-1.5 text-muted-foreground/80 mt-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span className="text-[11px] font-bold uppercase tracking-wider">{ticket.date}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {/* ADD BUTTON */}
                      <button
                        onClick={() => addNewTicket(colId)}
                        className="mt-2 w-full border-2 border-dashed border-border/60 hover:border-border hover:bg-muted/30 rounded-xl p-3 flex items-center justify-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-widest transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter
                      </button>
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

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
