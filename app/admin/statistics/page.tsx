"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  Users,
  Car,
  Building2,
  Heart,
  MessageSquare,
  Activity,
  BarChart3,
} from "lucide-react";

// Importar componentes
import StatsCard from "./components/StatsCard";
import BrandChart from "./components/BrandChart";
import PriceRangeChart from "./components/PriceRangeChart";
import TopCompaniesCard from "./components/TopCompaniesCard";
import FeaturedMetrics from "./components/FeaturedMetrics";

interface Statistics {
  totalUsers: number;
  totalCompanies: number;
  totalVehicles: number;
  totalFavorites: number;
  totalQuotes: number;
  totalReports: number;
  averageVehiclePrice: number;
  mostPopularBrand: string;
  mostActiveCompany: string;
  recentGrowth: {
    usersThisMonth: number;
    vehiclesThisMonth: number;
    quotesThisMonth: number;
  };
  vehiclesByBrand: { brand: string; count: number }[];
  priceRanges: { range: string; count: number }[];
  topCompanies: { name: string; vehicleCount: number }[];
  userGrowthData: {
    week: string;
    usuariosNormales: number;
    usuariosEmpresa: number;
  }[];
}

export default function AdminStatisticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("month");

  useEffect(() => {
    checkAdminAndLoadStats();
  }, [timeframe]);

  const checkAdminAndLoadStats = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const { data: userData, error } = await supabase
        .from("usuario")
        .select("rol")
        .eq("id", session.user.id)
        .single();

      if (error || !userData || userData.rol !== "administrador") {
        router.push("/login");
        return;
      }

      await loadStatistics();
    } catch (error) {
      console.error("Error:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const capitalizeWords = (str: string) => {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const formatWeekLabel = (year: number, weekNumber: number): string => {
    const jan4 = new Date(year, 0, 4);
    const weekStart = new Date(jan4.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);
    weekStart.setDate(weekStart.getDate() - (jan4.getDay() || 7) + 1);
    
    const day = weekStart.getDate();
    const month = weekStart.getMonth() + 1;
    
    return `S${weekNumber} (${day}/${month})`;
  };

  const loadUserGrowthData = async () => {
    try {
      const { data: allUsers } = await supabase
        .from("usuario")
        .select("id, created_at")
        .order("created_at", { ascending: true });

      const { data: allCompanies } = await supabase
        .from("empresa")
        .select("usuario_id, created_at");

      if (!allUsers) return [];

      const companyUserIds = new Set(allCompanies?.map((c) => c.usuario_id));

      const weeklyData: {
        [key: string]: { normal: number; empresa: number };
      } = {};

      allUsers.forEach((user) => {
        const date = new Date(user.created_at);
        
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const weekStart = new Date(date.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);
        
        const year = weekStart.getFullYear();
        const weekNumber = getWeekNumber(weekStart);
        const weekKey = `${year}-W${String(weekNumber).padStart(2, "0")}`;

        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { normal: 0, empresa: 0 };
        }

        if (companyUserIds.has(user.id)) {
          weeklyData[weekKey].empresa++;
        } else {
          weeklyData[weekKey].normal++;
        }
      });

      const sortedWeeks = Object.keys(weeklyData).sort();
      let accumulatedNormal = 0;
      let accumulatedEmpresa = 0;

      const growthData = sortedWeeks.slice(-12).map((weekKey) => {
        accumulatedNormal += weeklyData[weekKey].normal;
        accumulatedEmpresa += weeklyData[weekKey].empresa;

        const [year, week] = weekKey.split("-W");
        const weekLabel = formatWeekLabel(parseInt(year), parseInt(week));

        return {
          week: weekLabel,
          usuariosNormales: accumulatedNormal,
          usuariosEmpresa: accumulatedEmpresa,
        };
      });

      return growthData;
    } catch (error) {
      console.error("Error loading user growth data:", error);
      return [];
    }
  };

  const loadStatistics = async () => {
    try {
      // Obtener totales básicos
      const [
        usersRes,
        companiesRes,
        vehiclesRes,
        favoritesRes,
        quotesRes,
        reportsRes,
      ] = await Promise.all([
        supabase.from("usuario").select("*", { count: "exact", head: true }),
        supabase.from("empresa").select("*", { count: "exact", head: true }),
        supabase.from("vehiculo").select("*", { count: "exact", head: true }),
        supabase.from("favorito").select("*", { count: "exact", head: true }),
        supabase.from("cotizacion").select("*", { count: "exact", head: true }),
        supabase.from("reporte").select("*", { count: "exact", head: true }),
      ]);

      // Calcular fecha de inicio según timeframe
      const now = new Date();
      let startDate = new Date();
      if (timeframe === "week") {
        startDate.setDate(now.getDate() - 7);
      } else if (timeframe === "month") {
        startDate.setMonth(now.getMonth() - 1);
      } else {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      // Obtener crecimiento reciente
      const [recentUsers, recentVehicles, recentQuotes] = await Promise.all([
        supabase
          .from("usuario")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startDate.toISOString()),
        supabase
          .from("vehiculo")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startDate.toISOString()),
        supabase
          .from("cotizacion")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startDate.toISOString()),
      ]);

      // Obtener datos para el gráfico de crecimiento
      const userGrowthData = await loadUserGrowthData();

      // Obtener vehículos con precios
      const { data: vehicles } = await supabase
        .from("vehiculo")
        .select("marca, precio, empresa_id");

      console.log("🚗 Total vehículos:", vehicles?.length);

      // Calcular precio promedio
      const avgPrice =
        vehicles && vehicles.length > 0
          ? vehicles.reduce((sum, v) => sum + (v.precio || 0), 0) /
            vehicles.length
          : 0;

      // Contar vehículos por marca (normalizado)
      const brandCounts: { [key: string]: number } = {};
      vehicles?.forEach((v) => {
        if (v.marca) {
          const normalizedBrand = v.marca.trim().toLowerCase();
          brandCounts[normalizedBrand] = (brandCounts[normalizedBrand] || 0) + 1;
        }
      });

      const vehiclesByBrand = Object.entries(brandCounts)
        .map(([brand, count]) => ({
          brand: capitalizeWords(brand),
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const mostPopularBrand = vehiclesByBrand[0]?.brand || "N/A";

      // Rangos de precio
      const priceRanges = [
        { range: "< $5M", count: 0 },
        { range: "$5M - $10M", count: 0 },
        { range: "$10M - $20M", count: 0 },
        { range: "$20M - $30M", count: 0 },
        { range: "> $30M", count: 0 },
      ];

      vehicles?.forEach((v) => {
        const price = v.precio || 0;
        if (price < 5000000) priceRanges[0].count++;
        else if (price < 10000000) priceRanges[1].count++;
        else if (price < 20000000) priceRanges[2].count++;
        else if (price < 30000000) priceRanges[3].count++;
        else priceRanges[4].count++;
      });

      // ============================================
      // CONTAR VEHÍCULOS POR EMPRESA
      // ============================================
      
      const companyCounts: { [key: string]: number } = {};
      let vehiclesWithCompany = 0;

      vehicles?.forEach((v) => {
        if (v.empresa_id) {
          companyCounts[v.empresa_id] = (companyCounts[v.empresa_id] || 0) + 1;
          vehiclesWithCompany++;
        }
      });

      console.log("🏢 Vehículos con empresa_id:", vehiclesWithCompany);
      console.log("📊 Conteo por empresa:", companyCounts);

      let topCompanies: { name: string; vehicleCount: number }[] = [];
      let mostActiveCompany = "N/A";

      if (Object.keys(companyCounts).length === 0) {
        // No hay vehículos con empresa_id
        console.warn("⚠️ No hay vehículos asociados a empresas");
        
        // Obtener todas las empresas
        const { data: allCompaniesData, error: allCompError } = await supabase
          .from("empresa")
          .select("id, nombre_comercial")
          .order("created_at", { ascending: false })
          .limit(5);

        if (allCompError) {
          console.error("❌ Error al obtener empresas:", allCompError);
        } else {
          console.log("✅ Empresas encontradas (sin vehículos):", allCompaniesData?.length);
          
          topCompanies =
            allCompaniesData?.map((c) => ({
              name: c.nombre_comercial?.trim() || "Sin nombre",
              vehicleCount: 0,
            })) || [];
        }

        mostActiveCompany = topCompanies[0]?.name || "N/A";
      } else {
        // Hay vehículos con empresa_id
        const sortedCompanies = Object.entries(companyCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5);

        const topCompanyIds = sortedCompanies.map(([id]) => id);

        console.log("🔝 Top 5 empresa IDs:", topCompanyIds);
        console.log("📈 Con cantidades:", sortedCompanies);

        // Obtener información de las empresas
        const { data: companiesData, error: companiesError } = await supabase
          .from("empresa")
          .select("id, nombre_comercial")
          .in("id", topCompanyIds);

        if (companiesError) {
          console.error("❌ Error al cargar empresas:", companiesError);
        } else {
          console.log("✅ Empresas obtenidas:", companiesData);
        }

        // Mapear y ordenar correctamente
        if (companiesData && companiesData.length > 0) {
          // Crear un mapa para acceso rápido
          const companyMap = new Map(
            companiesData.map((c) => [c.id, c.nombre_comercial?.trim() || "Sin nombre"])
          );

          // Mantener el orden del conteo original
          topCompanies = sortedCompanies
            .map(([id, count]) => ({
              name: companyMap.get(id) || "Empresa sin nombre",
              vehicleCount: count,
            }))
            .filter((c) => c.name !== "Empresa sin nombre");

          console.log("📋 Top empresas final:", topCompanies);

          mostActiveCompany = topCompanies[0]?.name || "N/A";
        } else {
          console.warn("⚠️ No se encontraron datos de empresas para los IDs");
          
          // Fallback: obtener empresas sin filtro
          const { data: fallbackCompanies } = await supabase
            .from("empresa")
            .select("id, nombre_comercial")
            .limit(5);

          topCompanies =
            fallbackCompanies?.map((c) => ({
              name: c.nombre_comercial?.trim() || "Sin nombre",
              vehicleCount: 0,
            })) || [];

          mostActiveCompany = topCompanies[0]?.name || "N/A";
        }
      }

      console.log("🏆 Empresa más activa:", mostActiveCompany);
      console.log("📊 Lista final de top empresas:", topCompanies);

      setStats({
        totalUsers: usersRes.count || 0,
        totalCompanies: companiesRes.count || 0,
        totalVehicles: vehiclesRes.count || 0,
        totalFavorites: favoritesRes.count || 0,
        totalQuotes: quotesRes.count || 0,
        totalReports: reportsRes.count || 0,
        averageVehiclePrice: Math.round(avgPrice),
        mostPopularBrand,
        mostActiveCompany,
        recentGrowth: {
          usersThisMonth: recentUsers.count || 0,
          vehiclesThisMonth: recentVehicles.count || 0,
          quotesThisMonth: recentQuotes.count || 0,
        },
        vehiclesByBrand,
        priceRanges,
        topCompanies,
        userGrowthData,
      });
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const getTimeframeLabel = () => {
    if (timeframe === "week") return "últimos 7 días";
    if (timeframe === "month") return "último mes";
    return "último año";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center">
        <p className="text-gray-600">Error al cargar estadísticas</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 border-b-4 border-purple-800 sticky top-0 z-10 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/admin/profile")}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white">
                    Estadísticas del Sistema
                  </h1>
                  <p className="text-xs sm:text-sm text-purple-200">
                    Análisis completo de la plataforma
                  </p>
                </div>
              </div>
            </div>

            {/* Timeframe Selector */}
            <div className="flex gap-2">
              {(["week", "month", "year"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    timeframe === tf
                      ? "bg-white text-purple-700"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  {tf === "week" && "7 días"}
                  {tf === "month" && "1 mes"}
                  {tf === "year" && "1 año"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Métricas Principales */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
          <StatsCard
            icon={Users}
            value={stats.totalUsers}
            label="Usuarios"
            gradient="from-blue-500 to-blue-600"
          />
          <StatsCard
            icon={Building2}
            value={stats.totalCompanies}
            label="Empresas"
            gradient="from-purple-500 to-purple-600"
          />
          <StatsCard
            icon={Car}
            value={stats.totalVehicles}
            label="Vehículos"
            gradient="from-green-500 to-emerald-600"
          />
          <StatsCard
            icon={Heart}
            value={stats.totalFavorites}
            label="Favoritos"
            gradient="from-pink-500 to-rose-600"
          />
          <StatsCard
            icon={MessageSquare}
            value={stats.totalQuotes}
            label="Cotizaciones"
            gradient="from-cyan-500 to-blue-600"
          />
          <StatsCard
            icon={Activity}
            value={stats.totalReports}
            label="Reportes"
            gradient="from-orange-500 to-red-500"
          />
        </div>

        {/* Crecimiento Reciente */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-purple-200 shadow-xl p-4 sm:p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Crecimiento en {getTimeframeLabel()}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-6 h-6 text-blue-600" />
                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  +{stats.recentGrowth.usersThisMonth}
                </span>
              </div>
              <p className="text-sm text-gray-600">Nuevos usuarios</p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <Car className="w-6 h-6 text-green-600" />
                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  +{stats.recentGrowth.vehiclesThisMonth}
                </span>
              </div>
              <p className="text-sm text-gray-600">Vehículos publicados</p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
              <div className="flex items-center justify-between mb-2">
                <MessageSquare className="w-6 h-6 text-purple-600" />
                <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                  +{stats.recentGrowth.quotesThisMonth}
                </span>
              </div>
              <p className="text-sm text-gray-600">Cotizaciones recibidas</p>
            </div>
          </div>
        </div>

        {/* Gráficos de Marcas y Precios */}
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <BrandChart data={stats.vehiclesByBrand} />
          <PriceRangeChart data={stats.priceRanges} />
        </div>

        {/* Top Empresas y Métricas Destacadas */}
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          <TopCompaniesCard data={stats.topCompanies} />
          <FeaturedMetrics
            averagePrice={stats.averageVehiclePrice}
            mostPopularBrand={stats.mostPopularBrand}
            mostActiveCompany={stats.mostActiveCompany}
          />
        </div>
      </main>
    </div>
  );
}
