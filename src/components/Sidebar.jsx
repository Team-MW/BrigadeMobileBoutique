import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, Smartphone, TrendingUp, Settings, Menu, X, FileText } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Tableau de Bord' },
  { to: '/ventes', icon: ShoppingCart, label: 'Suivi des Ventes' },
  { to: '/factures', icon: FileText, label: 'Factures' },
  { to: '/depot', icon: Smartphone, label: 'Dépôt Client' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Mobile overlay */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out",
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
        <nav className="flex-1 px-3 py-4 space-y-1">
          {!collapsed && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-3">
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
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
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

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">BM</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-sidebar-foreground">Brigade Mobile</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-xs text-muted-foreground">En ligne</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Content spacer */}
      <div className={cn("flex-shrink-0 transition-all duration-300", collapsed ? "w-16" : "w-64")} />
    </>
  )
}
