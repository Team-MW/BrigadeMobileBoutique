import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, Smartphone, TrendingUp, Settings, Menu, X, FileText, Tags, Kanban, Package, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Tableau de Bord', shortLabel: 'Accueil' },
  { to: '/ventes', icon: ShoppingCart, label: 'Suivi des Ventes', shortLabel: 'Ventes' },
  { to: '/demandes-mobile', icon: Smartphone, label: 'Demande Mobile', shortLabel: 'Livraisons' },
  { to: '/factures', icon: FileText, label: 'Factures', shortLabel: 'Factures' },
  { to: '/tarifs', icon: Tags, label: 'Grille Tarifaire', shortLabel: 'Tarifs' },
  { to: '/organisation', icon: Kanban, label: 'Organisation', shortLabel: 'Tickets' },
  { to: '/stock', icon: Package, label: 'Stock', shortLabel: 'Stock' },
  { to: '/stock-ecran', icon: Smartphone, label: 'Stock Réparation', shortLabel: 'Pièces' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const mobileVisibleItems = [
    { to: '/', icon: LayoutDashboard, shortLabel: 'Accueil' },
    { to: '/ventes', icon: ShoppingCart, shortLabel: 'Ventes' },
    { to: '/tarifs', icon: Tags, shortLabel: 'Tarifs' },
    { to: '/organisation', icon: Kanban, shortLabel: 'Tickets' },
    { to: '/stock-ecran', icon: Smartphone, shortLabel: 'Pièces' },
  ]

  return (
    <>
      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border flex items-center justify-around px-1 py-2 pb-safe shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.1)]">
        {mobileVisibleItems.map(({ to, icon: Icon, shortLabel }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all duration-200 min-w-[3.5rem]",
                isActive
                  ? "text-sidebar-primary scale-110"
                  : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:scale-105"
              )
            }
          >
            <Icon className={cn("w-5 h-5")} />
            <span className="text-[10px] font-bold tracking-wider uppercase">{shortLabel}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={cn(
            "flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all duration-200 min-w-[3.5rem]",
            mobileMenuOpen
              ? "text-sidebar-primary scale-110"
              : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:scale-105"
          )}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wider uppercase">Plus</span>
        </button>
      </nav>

      {/* --- MOBILE MENU BOTTOM SHEET --- */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Slide-up sheet */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border rounded-t-3xl p-6 pb-8 z-50 shadow-2xl animate-fade-in">
            {/* Grab handle */}
            <div className="w-12 h-1 bg-sidebar-foreground/20 rounded-full mx-auto mb-6" />
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-extrabold text-sidebar-foreground">Menu</h3>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-sidebar-accent hover:brightness-110 text-sidebar-foreground transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid of menu items */}
            <div className="grid grid-cols-2 gap-3">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border",
                      isActive
                        ? "bg-sidebar-primary border-sidebar-primary/20 text-sidebar-primary-foreground shadow-md shadow-primary/20"
                        : "bg-sidebar-accent/50 border-sidebar-border/30 text-sidebar-foreground hover:bg-sidebar-accent"
                    )
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-xs font-bold">{label}</span>
                </NavLink>
              ))}
              
              {/* Dépôt Client Link in the grid */}
              <NavLink
                to="/depot"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border col-span-2 mt-2",
                    isActive
                      ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "bg-primary/5 border-primary/20 text-foreground hover:bg-primary/10"
                  )
                }
              >
                <Smartphone className="w-5 h-5 shrink-0 text-primary" />
                <span className="text-xs font-bold">Dépôt Client</span>
              </NavLink>
            </div>
          </div>
        </>
      )}

      {/* --- DESKTOP SIDEBAR --- */}
      <aside
        className={cn(
          "hidden md:flex fixed left-0 top-0 h-full z-40 flex-col transition-all duration-300 ease-in-out",
          "border-r border-sidebar-border bg-sidebar",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-sidebar-border",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-3 animate-slide-in">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
              <div>
                <p className="text-sm font-bold text-sidebar-foreground leading-tight">Brigade Mobile</p>
                <p className="text-xs text-muted-foreground">Réparation & Vente</p>
              </div>
            </div>
          )}
          {collapsed && (
            <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors",
              collapsed && "mx-auto mt-0"
            )}
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto hide-scrollbar">
          {!collapsed && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-3 mt-2">
              Menu Principal
            </p>
          )}
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-primary/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )
              }
              title={collapsed ? label : undefined}
            >
              <Icon className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
              {!collapsed && <span className="text-sm font-medium">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Action Rapide */}
        <div className="px-3 py-3 border-t border-sidebar-border/50">
          <NavLink
            to="/depot"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group border",
                collapsed && "justify-center px-2",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "border-primary/20 bg-primary/5 text-foreground hover:bg-primary/10 hover:border-primary/30"
              )
            }
            title={collapsed ? "Dépôt Client" : undefined}
          >
            <Smartphone className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4", "text-primary group-hover:scale-110 transition-transform")} />
            {!collapsed && <span className="text-sm font-bold">Dépôt Client</span>}
          </NavLink>
        </div>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shadow-inner">
                <span className="text-xs font-bold text-primary">BM</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-sidebar-foreground">Brigade Mobile</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">En ligne</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Content spacer for Desktop */}
      <div className={cn("hidden md:block flex-shrink-0 transition-all duration-300", collapsed ? "w-16" : "w-64")} />
    </>
  )
}
