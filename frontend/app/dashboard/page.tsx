"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/utils";
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
  Globe,
  Loader2
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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

// Dynamic stats will be calculated inside DashboardPage using real-time database data

export default function DashboardPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<{ firstName: string; lastName: string; email: string } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Get user state from localStorage
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    
    if (!token) {
      router.push("/login");
      return;
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error(e);
      }
    }
    
    // 2. Fetch history from backend
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/api/detect/history`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (err) {
        console.error("Error fetching history for dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHistory();
  }, [router]);

  // Dynamically compute stats from history
  const totalAnalyses = history.length;
  const fakeCount = history.filter(item => item.result?.isFake).length;
  const realCount = totalAnalyses - fakeCount;
  
  // Calculate average confidence score
  const avgConfidence = totalAnalyses > 0 
    ? Math.round(history.reduce((acc, item) => acc + (item.result?.confidence || 0), 0) / totalAnalyses)
    : 0;

  const stats = [
    { label: "Total Analyses", value: totalAnalyses.toLocaleString(), change: "Real-time", up: true, icon: FileText },
    { label: "Fake Detected", value: fakeCount.toLocaleString(), change: `${totalAnalyses > 0 ? Math.round((fakeCount / totalAnalyses) * 100) : 0}% of total`, up: false, icon: ShieldAlert },
    { label: "Real Verified", value: realCount.toLocaleString(), change: `${totalAnalyses > 0 ? Math.round((realCount / totalAnalyses) * 100) : 0}% of total`, up: true, icon: ShieldCheck },
    { label: "Avg. Confidence", value: `${avgConfidence}%`, change: "Analysis precision", up: true, icon: Shield },
  ];

  // Dynamic Area Chart Data (last 6 months)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyData: Record<string, { name: string; fake: number; real: number }> = {};
  
  // Initialize last 6 months
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mName = months[d.getMonth()];
    monthlyData[mName] = { name: mName, fake: 0, real: 0 };
  }
  
  history.forEach(item => {
    const date = new Date(item.createdAt);
    const monthName = months[date.getMonth()];
    if (monthName in monthlyData) {
      if (item.result?.isFake) {
        monthlyData[monthName].fake++;
      } else {
        monthlyData[monthName].real++;
      }
    }
  });
  const areaChartData = Object.values(monthlyData);

  // Dynamic Pie Chart Data
  const pieChartData = [
    { name: "Fake News", value: fakeCount, color: "hsl(var(--destructive))" },
    { name: "Real News", value: realCount, color: "hsl(var(--chart-1))" },
  ];

  // Dynamic Category Data
  const categories: Record<string, string[]> = {
    "Politics": ["politics", "election", "government", "president", "trump", "biden", "modi", "pm", "minister", "senate", "congress", "democrat", "republican"],
    "Health": ["health", "virus", "vaccine", "covid", "medicine", "doctor", "hospital", "disease", "cure", "cancer", "medical"],
    "Tech": ["tech", "ai", "artificial intelligence", "software", "apple", "google", "meta", "microsoft", "cyber", "security", "phone", "internet"],
    "Finance": ["finance", "economy", "money", "stocks", "market", "bitcoin", "crypto", "tax", "inflation", "bank", "financial"],
    "Science": ["science", "space", "nasa", "earth", "climate", "research", "scientists", "study", "physics", "mars", "energy"]
  };
  
  const categoryCounts: Record<string, { name: string; fake: number; real: number }> = {
    "Politics": { name: "Politics", fake: 0, real: 0 },
    "Health": { name: "Health", fake: 0, real: 0 },
    "Tech": { name: "Tech", fake: 0, real: 0 },
    "Finance": { name: "Finance", fake: 0, real: 0 },
    "Science": { name: "Science", fake: 0, real: 0 },
    "General": { name: "General", fake: 0, real: 0 }
  };

  history.forEach(item => {
    const contentLower = item.content.toLowerCase();
    let categorized = false;
    for (const [catName, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => contentLower.includes(kw))) {
        if (item.result?.isFake) {
          categoryCounts[catName].fake++;
        } else {
          categoryCounts[catName].real++;
        }
        categorized = true;
        break;
      }
    }
    if (!categorized) {
      if (item.result?.isFake) {
        categoryCounts["General"].fake++;
      } else {
        categoryCounts["General"].real++;
      }
    }
  });
  
  const categoryData = Object.values(categoryCounts).filter(c => c.fake > 0 || c.real > 0);

  // Dynamic Recent Analyses
  const recentAnalyses = history.slice(0, 5).map((item, idx) => ({
    id: item._id || idx,
    title: item.content,
    type: item.result?.contentType ? item.result.contentType.charAt(0).toUpperCase() + item.result.contentType.slice(1) : "Article",
    result: item.result?.isFake ? "fake" : "real",
    confidence: item.result?.confidence || 0,
    date: new Date(item.createdAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }));

  // Dynamic Trending Misinformation
  const wordFrequency: Record<string, number> = {};
  history.forEach(item => {
    if (item.result?.isFake) {
      const words = item.content.toLowerCase().split(/\s+/);
      words.forEach(w => {
        const clean = w.replace(/[^a-z]/g, "");
        if (clean.length > 4 && !["about", "their", "there", "would", "could", "should", "claims", "breaking", "viral", "report", "claims", "people", "after", "before"].includes(clean)) {
          wordFrequency[clean] = (wordFrequency[clean] || 0) + 1;
        }
      });
    }
  });
  
  const sortedWords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const trendingMisinformation = sortedWords.length > 0
    ? sortedWords.map(([word, count]) => ({
        topic: word.charAt(0).toUpperCase() + word.slice(1) + " claims",
        mentions: count,
        trend: Math.random() > 0.4 ? "up" : "down" as "up" | "down"
      }))
    : [
        { topic: "No active false claims recorded", mentions: 0, trend: "down" as "up" | "down" }
      ];
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground font-mono">Loading real-time analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border transition-all duration-300 ${
        sidebarOpen ? "w-64" : "w-20"
      }`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-border">
          <Link href="/" className="flex items-center justify-center">
            {/* Light Mode V-Icon */}
            <Image
              src="/logo-icon-light-v2.png"
              alt="VeriX AI"
              width={44}
              height={36}
              className="w-[44px] h-[36px] object-contain dark:hidden"
            />
            {/* Dark Mode V-Icon */}
            <Image
              src="/logo-icon-dark-v2.png"
              alt="VeriX AI"
              width={44}
              height={36}
              className="w-[44px] h-[36px] object-contain hidden dark:block"
            />
          </Link>
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
                <div className="text-sm font-medium truncate">{user ? `${user.firstName} ${user.lastName}` : "Loading..."}</div>
                <div className="text-xs text-muted-foreground truncate">{user?.email || ""}</div>
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
