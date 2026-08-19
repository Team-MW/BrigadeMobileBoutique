import { useState } from 'react'
import { useShop } from '@/context/ShopContext'
import Header from '@/components/Header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  TrendingUp, TrendingDown, Euro, Wrench, ShoppingBag,
  CheckCircle, Clock, ArrowUpRight, Activity, Smartphone
} from 'lucide-react'
import { Link } from 'react-router-dom'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const periodLabels = {
  today: "Aujourd'hui",
  week: 'Cette semaine',
  month: 'Ce mois',
  all: 'Tout le temps',
}

function StatCard({ title, value, icon: Icon, trend, trendValue, color, subtitle }) {
  const isPositive = trend === 'up'
  return (
    <Card className="hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            {trendValue !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform duration-200`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-sm">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="text-xs">
            {p.name}: <span className="font-bold">{p.value.toFixed(2)} €</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { getStats, sales, updateSale, loading } = useShop()
  const [period, setPeriod] = useState('month')
  const stats = getStats(period)

  const recentSales = sales.slice(0, 5)

  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  let currentMonthRevenue = 0
  let lastMonthRevenue = 0

  sales.forEach(sale => {
    if (!sale.date) return
    const d = new Date(sale.date)
    const price = parseFloat(sale.price) || 0

    if (d >= currentMonthStart && d < nextMonthStart) {
      currentMonthRevenue += price
    } else if (d >= lastMonthStart && d < currentMonthStart) {
      lastMonthRevenue += price
    }
  })

  // Compute monthly revenue and profit for the chart
  const monthlyDataMap = new Map()
  sales.forEach(sale => {
    if (!sale.date) return
    const d = new Date(sale.date)
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthlyDataMap.has(yearMonth)) {
      const monthName = d.toLocaleDateString('fr-FR', { month: 'short' })
      monthlyDataMap.set(yearMonth, { 
        date: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${d.getFullYear()}`, 
        sortKey: yearMonth,
        revenue: 0, 
        profit: 0 
      })
    }
    
    const entry = monthlyDataMap.get(yearMonth)
    entry.revenue += parseFloat(sale.price) || 0
    entry.profit += parseFloat(sale.profit) || 0
  })

  const monthlyRevenueData = Array.from(monthlyDataMap.values())
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .slice(-12) // Keep only the last 12 months

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
      <Header title="Tableau de Bord" subtitle="Vue d'ensemble de votre boutique" />
      
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 animate-pulse">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground font-medium">Récupération des données cloud...</p>
        </div>
      ) : (
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
        
        {/* Action Bar (Period + Depot Client Button) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Period Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Période :</span>
            {Object.entries(periodLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  period === key
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <Link
            to="/depot"
            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95"
          >
            <Smartphone className="w-5 h-5" />
            Nouveau Dépôt Client
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Chiffre d'Affaires"
            value={`${stats.totalRevenue.toFixed(2)} €`}
            icon={Euro}
            trend="up"
            trendValue="+12% vs période précédente"
            color="bg-blue-600"
            subtitle={`${stats.totalSales} transaction(s)`}
          />
          <StatCard
            title="Bénéfice Net"
            value={`${stats.totalProfit.toFixed(2)} €`}
            icon={TrendingUp}
            trend="up"
            trendValue={`Marge : ${stats.marginRate}%`}
            color="bg-emerald-600"
          />
          <StatCard
            title="CA Mois en Cours"
            value={`${currentMonthRevenue.toFixed(2)} €`}
            icon={Euro}
            color="bg-violet-600"
            subtitle="Chiffre d'affaires du mois"
          />
          <StatCard
            title="CA Mois Dernier"
            value={`${lastMonthRevenue.toFixed(2)} €`}
            icon={Euro}
            color="bg-amber-600"
            subtitle="Chiffre d'affaires précédent"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          
          {/* Revenue & Profit Chart */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Revenus & Bénéfices (Mois par mois)
                  </CardTitle>
                  <CardDescription>Évolution mensuelle</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlyRevenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217.2 32.6% 17.5%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `${v}€`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenus"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="Bénéfice"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#colorProfit)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Modes de Paiement</CardTitle>
              <CardDescription>Répartition des paiements</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.byPayment}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stats.byPayment.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value.toFixed(2)} €`, 'Montant']} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Services & Recent Sales */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          
          {/* Top Services */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Services</CardTitle>
              <CardDescription>Par chiffre d'affaires</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.byService.slice(0, 5).map((service, i) => {
                const maxRevenue = stats.byService[0]?.revenue || 1
                const pct = (service.revenue / maxRevenue) * 100
                return (
                  <div key={service.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-foreground font-medium truncate max-w-[200px]">{service.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{service.count}x</Badge>
                        <span className="text-primary font-bold">{service.revenue.toFixed(0)} €</span>
                      </div>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 1) % COLORS.length]})`
                        }}
                      />
                    </div>
                  </div>
                )
              })}
              {stats.byService.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Sales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dernières Transactions</CardTitle>
              <CardDescription>Les 5 plus récentes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentSales.map(sale => (
                <div key={sale.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      sale.type === 'Réparation' ? 'bg-violet-600/20' : 'bg-amber-600/20'
                    }`}>
                      {sale.type === 'Réparation'
                        ? <Wrench className="w-4 h-4 text-violet-400" />
                        : <ShoppingBag className="w-4 h-4 text-amber-400" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{sale.client}</p>
                      <p className="text-xs text-muted-foreground">{sale.phone} · {sale.service}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="text-sm font-bold text-foreground">{parseFloat(sale.price).toFixed(2)} €</p>
                    <div className="flex items-center gap-2">
                      {sale.status !== 'Terminé' && (
                        <button 
                          onClick={() => updateSale(sale.id, { status: 'Terminé' })}
                          className="p-1 rounded-md hover:bg-green-500/20 text-green-400 transition-colors"
                          title="Valider"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <Badge
                        variant={sale.status === 'Terminé' ? 'success' : sale.status === 'En cours' ? 'warning' : 'secondary'}
                        className="text-xs"
                      >
                        {sale.status === 'En attente' && sale.type === 'Réparation' ? 'Dépôt' : sale.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Summary Bar */}
        <Card className="bg-gradient-to-r from-blue-900/20 to-emerald-900/20 border-primary/20">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Total Revenus</p>
                <p className="text-xl font-bold text-blue-400">{stats.totalRevenue.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Coûts</p>
                <p className="text-xl font-bold text-red-400">{stats.totalCost.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bénéfice Net</p>
                <p className="text-xl font-bold text-emerald-400">{stats.totalProfit.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taux de Marge</p>
                <p className="text-xl font-bold text-amber-400">{stats.marginRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

      </main>
      )}
    </div>
  )
}
