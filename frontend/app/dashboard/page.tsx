"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  LayoutDashboard, 
  Search, 
  History, 
  Settings, 
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Bell,
  User,
  ChevronRight,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/verix/theme-toggle";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", active: true },
  { icon: Search, label: "New Analysis", href: "/detect", active: false },
  { icon: History, label: "History", href: "/dashboard/history", active: false },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics", active: false },
  { icon: Settings, label: "Settings", href: "/dashboard/settings", active: false },
];

const stats = [
  { label: "Total Analyses", value: "1,284", change: "+12%", up: true, icon: FileText },
  { label: "Fake Detected", value: "347", change: "+8%", up: true, icon: ShieldAlert },
  { label: "Real Verified", value: "937", change: "+15%", up: true, icon: ShieldCheck },
  { label: "Accuracy Rate", value: "99.2%", change: "+0.3%", up: true, icon: Shield },
];

const areaChartData = [
  { name: "Jan", fake: 40, real: 80 },
  { name: "Feb", fake: 55, real: 90 },
  { name: "Mar", fake: 45, real: 100 },
  { name: "Apr", fake: 60, real: 85 },
  { name: "May", fake: 50, real: 110 },
  { name: "Jun", fake: 70, real: 95 },
  { name: "Jul", fake: 65, real: 120 },
];

const pieChartData = [
  { name: "Fake News", value: 27, color: "hsl(var(--destructive))" },
  { name: "Real News", value: 73, color: "hsl(var(--chart-1))" },
];

const categoryData = [
  { name: "Politics", fake: 45, real: 30 },
  { name: "Health", fake: 35, real: 45 },
  { name: "Tech", fake: 20, real: 60 },
  { name: "Finance", fake: 25, real: 50 },
  { name: "Science", fake: 15, real: 55 },
];

const recentAnalyses = [
  { 
    id: 1,
    title: "Breaking: New climate report reveals...",
    type: "Article",
    result: "real",
    confidence: 94,
    date: "2 hours ago"
  },
  { 
    id: 2,
    title: "Viral post claims miracle cure...",
    type: "Social Media",
    result: "fake",
    confidence: 98,
    date: "3 hours ago"
  },
  { 
    id: 3,
    title: "Government announces new policy...",
    type: "Headline",
    result: "real",
    confidence: 87,
    date: "5 hours ago"
  },
  { 
    id: 4,
    title: "Celebrity endorses controversial...",
    type: "Article",
    result: "fake",
    confidence: 91,
    date: "6 hours ago"
  },
  { 
    id: 5,
    title: "Study finds new treatment effective...",
    type: "Article",
    result: "real",
    confidence: 96,
    date: "8 hours ago"
  },
];

const trendingMisinformation = [
  { topic: "Election fraud claims", mentions: 1243, trend: "up" },
  { topic: "Health misinformation", mentions: 892, trend: "up" },
  { topic: "Financial scams", mentions: 567, trend: "down" },
  { topic: "Deep fake content", mentions: 445, trend: "up" },
];

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border transition-all duration-300 ${
        sidebarOpen ? "w-64" : "w-20"
      }`}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-6 border-b border-border">
          <Shield className="w-8 h-8 shrink-0" />
          {sidebarOpen && (
            <span className="text-xl font-bold whitespace-nowrap">
              VeriX<span className="text-muted-foreground font-normal">AI</span>
            </span>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 py-6 px-3">
          <ul className="space-y-1">
            {sidebarItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    item.active 
                      ? "bg-foreground text-background" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* User section */}
        <div className="p-3 border-t border-border">
          <div className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer ${
            sidebarOpen ? "" : "justify-center"
          }`}>
            <div className="w-9 h-9 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">John Doe</div>
                <div className="text-xs text-muted-foreground truncate">Pro Plan</div>
              </div>
            )}
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </Button>
            <Link href="/detect">
              <Button className="bg-foreground hover:bg-foreground/90 text-background rounded-full">
                New Analysis
              </Button>
            </Link>
          </div>
        </header>
        
        {/* Dashboard Content */}
        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-foreground/5 flex items-center justify-center">
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${
                        stat.up ? "text-success" : "text-destructive"
                      }`}>
                        {stat.up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {stat.change}
                      </div>
                    </div>
                    <div className="text-3xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          {/* Charts Row */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Area Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Analysis Trends</span>
                    <div className="flex items-center gap-4 text-sm font-normal">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-chart-1" />
                        Real
                      </span>
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-destructive" />
                        Fake
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={areaChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }} 
                        />
                        <Area type="monotone" dataKey="real" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.2} />
                        <Area type="monotone" dataKey="fake" stackId="2" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Pie Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Detection Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    {pieChartData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.name}: {item.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          
          {/* Bottom Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Analyses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Recent Analyses</span>
                    <Link href="/dashboard/history" className="text-sm font-normal text-muted-foreground hover:text-foreground flex items-center gap-1">
                      View all <ChevronRight className="w-4 h-4" />
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {recentAnalyses.map((analysis) => (
                      <div key={analysis.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          analysis.result === "fake" 
                            ? "bg-destructive/10 text-destructive" 
                            : "bg-success/10 text-success"
                        }`}>
                          {analysis.result === "fake" ? (
                            <AlertTriangle className="w-5 h-5" />
                          ) : (
                            <CheckCircle className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{analysis.title}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>{analysis.type}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {analysis.date}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${
                            analysis.result === "fake" ? "text-destructive" : "text-success"
                          }`}>
                            {analysis.result === "fake" ? "Fake" : "Real"}
                          </div>
                          <div className="text-xs text-muted-foreground">{analysis.confidence}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Trending Misinformation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Trending Misinformation Topics</span>
                    <Globe className="w-5 h-5 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trendingMisinformation.map((topic, i) => (
                      <div key={topic.topic} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{topic.topic}</span>
                          <div className={`flex items-center gap-1 text-xs ${
                            topic.trend === "up" ? "text-destructive" : "text-success"
                          }`}>
                            {topic.trend === "up" ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {topic.mentions.toLocaleString()} mentions
                          </div>
                        </div>
                        <Progress 
                          value={(topic.mentions / 1500) * 100} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          
          {/* Category Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.8 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Analysis by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="real" name="Real" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="fake" name="Fake" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
