"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Shield,
  Users,
  Car,
  Building2,
  Loader2,
  LogOut,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  XCircle,
  Flag,
  RefreshCw,
  Sparkles,
  Palette,
  X,
  BarChart3,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalCompanies: number;
  totalVehicles: number;
  activeVehicles: number;
  hiddenVehicles: number;
}

// ✅ Definir paletas de colores
const COLOR_THEMES = {
  vibrant: {
    name: "Vibrante",
    bg: "from-purple-50 via-pink-50 to-indigo-50",
    header: "from-purple-600 via-purple-700 to-indigo-700",
    headerBorder: "border-purple-800",
    badge: "from-yellow-400 to-orange-500",
    cards: {
      users: "from-blue-500 to-blue-600",
      companies: "from-purple-500 to-purple-600",
      vehicles: "from-green-500 to-emerald-600",
      active: "from-teal-500 to-cyan-600",
      hidden: "from-orange-500 to-red-500",
    },
    buttons: {
      users: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
      vehicles:
        "from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700",
      companies:
        "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
      validation:
        "from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600",
      rejected:
        "from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700",
      reports: "from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
      statistics:
        "from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700", // ✅ Nuevo
    },
    accent: "purple",
    isDark: false,
  },
  ocean: {
    name: "Océano",
    bg: "from-cyan-50 via-blue-50 to-indigo-50",
    header: "from-blue-600 via-cyan-600 to-teal-700",
    headerBorder: "border-blue-800",
    badge: "from-cyan-400 to-blue-500",
    cards: {
      users: "from-blue-400 to-blue-500",
      companies: "from-cyan-500 to-teal-600",
      vehicles: "from-indigo-500 to-blue-600",
      active: "from-teal-400 to-cyan-500",
      hidden: "from-slate-500 to-gray-600",
    },
    buttons: {
      users: "from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600",
      vehicles:
        "from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700",
      companies:
        "from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700",
      validation:
        "from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600",
      rejected:
        "from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700",
      reports:
        "from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700",
      statistics:
        "from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700", // ✅ Nuevo
    },
    accent: "blue",
    isDark: false,
  },
  sunset: {
    name: "Atardecer",
    bg: "from-orange-50 via-red-50 to-pink-50",
    header: "from-orange-600 via-red-600 to-pink-700",
    headerBorder: "border-orange-800",
    badge: "from-yellow-300 to-orange-400",
    cards: {
      users: "from-orange-400 to-red-500",
      companies: "from-pink-500 to-rose-600",
      vehicles: "from-red-500 to-pink-600",
      active: "from-amber-500 to-orange-600",
      hidden: "from-gray-500 to-slate-600",
    },
    buttons: {
      users:
        "from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600",
      vehicles: "from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700",
      companies:
        "from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700",
      validation:
        "from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700",
      rejected:
        "from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700",
      reports: "from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800",
      statistics:
        "from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700", // ✅ Nuevo
    },
    accent: "orange",
    isDark: false,
  },
  neon: {
    name: "Neón",
    bg: "from-lime-50 via-green-50 to-emerald-50",
    header: "from-lime-600 via-green-600 to-emerald-700",
    headerBorder: "border-lime-800",
    badge: "from-lime-400 to-green-500",
    cards: {
      users: "from-lime-500 to-green-600",
      companies: "from-emerald-500 to-teal-600",
      vehicles: "from-green-500 to-emerald-600",
      active: "from-teal-500 to-cyan-600",
      hidden: "from-slate-500 to-gray-600",
    },
    buttons: {
      users:
        "from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700",
      vehicles:
        "from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700",
      companies:
        "from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700",
      validation:
        "from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700",
      rejected:
        "from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700",
      reports:
        "from-lime-600 to-green-700 hover:from-lime-700 hover:to-green-800",
      statistics:
        "from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700", // ✅ Nuevo
    },
    accent: "green",
    isDark: false,
  },
  dark: {
    name: "Oscuro",
    bg: "from-gray-900 via-slate-900 to-zinc-900",
    header: "from-gray-800 via-slate-800 to-zinc-800",
    headerBorder: "border-gray-700",
    badge: "from-indigo-500 to-purple-600",
    cards: {
      users: "from-indigo-600 to-purple-700",
      companies: "from-violet-600 to-purple-700",
      vehicles: "from-blue-600 to-indigo-700",
      active: "from-emerald-600 to-teal-700",
      hidden: "from-gray-600 to-slate-700",
    },
    buttons: {
      users:
        "from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800",
      vehicles:
        "from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800",
      companies:
        "from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800",
      validation:
        "from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800",
      rejected:
        "from-gray-600 to-slate-700 hover:from-gray-700 hover:to-slate-800",
      reports: "from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800",
      statistics:
        "from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800", // ✅ Nuevo
    },
    accent: "indigo",
    isDark: true,
  },
};

type ThemeKey = keyof typeof COLOR_THEMES;

export default function AdminProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>("vibrant");
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalVehicles: 0,
    activeVehicles: 0,
    hiddenVehicles: 0,
  });
  const [recentVehicles, setRecentVehicles] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);

  const lastLoadTime = useRef<number>(0);
  const CACHE_DURATION = 30000;

  const theme = COLOR_THEMES[currentTheme];

  useEffect(() => {
    // Cargar tema guardado
    const savedTheme = localStorage.getItem("adminTheme") as ThemeKey;
    if (savedTheme && COLOR_THEMES[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
    checkAdminAccess();
  }, []);

  const changeTheme = (themeKey: ThemeKey) => {
    setCurrentTheme(themeKey);
    localStorage.setItem("adminTheme", themeKey);
    setShowThemeSelector(false);
  };

  const checkAdminAccess = async () => {
    try {
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();

      if (!authSession) {
        router.push("/login");
        return;
      }

      const { data: userData, error } = await supabase
        .from("usuario")
        .select("rol")
        .eq("id", authSession.user.id)
        .single();

      if (error || !userData || userData.rol !== "administrador") {
        router.push("/login");
        return;
      }

      setSession(authSession);
      await loadAllData();
      setLoading(false);
    } catch (error: any) {
      console.error("Error en checkAdminAccess:", error);
      router.push("/login");
    }
  };

  const loadAllData = async () => {
    try {
      const now = Date.now();

      if (
        now - lastLoadTime.current < CACHE_DURATION &&
        recentVehicles.length > 0
      ) {
        return;
      }

      const [statsData, recentData, reportsData] = await Promise.all([
        loadStatsData(),
        loadRecentDataParallel(),
        loadPendingReportsCountData(),
      ]);

      setStats(statsData);
      setRecentVehicles(recentData.vehicles);
      setRecentUsers(recentData.users);
      setPendingReportsCount(reportsData);

      lastLoadTime.current = now;
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  };

  const loadStatsData = async () => {
    try {
      const [usersRes, companiesRes, vehiclesRes, activeRes, hiddenRes] =
        await Promise.all([
          supabase.from("usuario").select("*", { count: "exact", head: true }),
          supabase.from("empresa").select("*", { count: "exact", head: true }),
          supabase.from("vehiculo").select("*", { count: "exact", head: true }),
          supabase
            .from("vehiculo")
            .select("*", { count: "exact", head: true })
            .eq("oculto", false),
          supabase
            .from("vehiculo")
            .select("*", { count: "exact", head: true })
            .eq("oculto", true),
        ]);

      return {
        totalUsers: usersRes.count || 0,
        totalCompanies: companiesRes.count || 0,
        totalVehicles: vehiclesRes.count || 0,
        activeVehicles: activeRes.count || 0,
        hiddenVehicles: hiddenRes.count || 0,
      };
    } catch (error) {
      return {
        totalUsers: 0,
        totalCompanies: 0,
        totalVehicles: 0,
        activeVehicles: 0,
        hiddenVehicles: 0,
      };
    }
  };

  const loadRecentDataParallel = async () => {
    try {
      const [vehiclesRes, usersRes] = await Promise.all([
        supabase
          .from("vehiculo")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("usuario")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      return {
        vehicles: vehiclesRes.data || [],
        users: usersRes.data || [],
      };
    } catch (error) {
      return { vehicles: [], users: [] };
    }
  };

  const loadPendingReportsCountData = async () => {
    try {
      const { count, error } = await supabase
        .from("reporte")
        .select("*", { count: "exact", head: true })
        .eq("estado", "pendiente");

      if (error) throw error;
      return count || 0;
    } catch (error) {
      return 0;
    }
  };

  const toggleVehicleVisibility = async (
    vehicleId: number,
    isHidden: boolean
  ) => {
    try {
      const { error } = await supabase
        .from("vehiculo")
        .update({ oculto: !isHidden })
        .eq("id", vehicleId);

      if (error) throw error;

      setRecentVehicles((prev) =>
        prev.map((v) => (v.id === vehicleId ? { ...v, oculto: !isHidden } : v))
      );

      const statsData = await loadStatsData();
      setStats(statsData);
    } catch (error) {
      console.error("Error toggling visibility:", error);
    }
  };

  const deleteVehicle = async (vehicleId: number) => {
    if (!confirm("¿Estás seguro de eliminar este vehículo?")) return;

    try {
      const { data: images } = await supabase
        .from("imagen_vehiculo")
        .select("url_imagen")
        .eq("vehiculo_id", vehicleId);

      if (images && images.length > 0) {
        const filePaths = images.map((img) => img.url_imagen);
        await supabase.storage.from("vehiculo_imagen").remove(filePaths);
      }

      await supabase
        .from("imagen_vehiculo")
        .delete()
        .eq("vehiculo_id", vehicleId);
      await supabase
        .from("usuario_vehiculo")
        .delete()
        .eq("vehiculo_id", vehicleId);
      await supabase.from("vehiculo").delete().eq("id", vehicleId);

      setRecentVehicles((prev) => prev.filter((v) => v.id !== vehicleId));

      const statsData = await loadStatsData();
      setStats(statsData);
    } catch (error: any) {
      alert("Error al eliminar el vehículo: " + error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleRefresh = async () => {
    lastLoadTime.current = 0;
    await loadAllData();
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br ${theme.header} flex items-center justify-center`}
      >
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <Sparkles
            className={`w-6 h-6 text-${theme.accent}-200 animate-pulse mx-auto`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg}`}>
      {/* Header con gradiente */}
      <header
        className={`bg-gradient-to-r ${theme.header} border-b-4 ${theme.headerBorder} sticky top-0 z-10 shadow-xl`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 bg-gradient-to-br ${theme.badge} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg transform hover:scale-110 transition-transform`}
              >
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1
                    className={`text-xl sm:text-2xl font-bold ${
                      theme.isDark ? "text-white" : "text-white"
                    }`}
                  >
                    Panel Administrativo
                  </h1>
                  <Sparkles
                    className={`w-5 h-5 text-${theme.accent}-300 animate-pulse`}
                  />
                </div>
                <p
                  className={`text-xs sm:text-sm ${
                    theme.isDark ? "text-gray-300" : "text-purple-200"
                  } truncate`}
                >
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {/* ✅ Botón selector de temas */}
              <button
                onClick={() => setShowThemeSelector(true)}
                className="flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-3 sm:px-4 py-2 rounded-xl transition-all hover:scale-105 text-sm font-medium border border-white/30"
              >
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">Tema</span>
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-3 sm:px-4 py-2 rounded-xl transition-all hover:scale-105 text-sm font-medium border border-white/30"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refrescar</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-3 sm:px-4 py-2 rounded-xl transition-all hover:scale-105 text-sm font-medium shadow-lg"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ✅ Modal Selector de Temas - RESPONSIVO */}
      {showThemeSelector && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div
            className={`${
              theme.isDark ? "bg-gray-800" : "bg-white"
            } rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6`}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <Palette
                  className={`w-5 h-5 sm:w-6 sm:h-6 ${
                    theme.isDark ? "text-white" : "text-gray-900"
                  }`}
                />
                <h2
                  className={`text-base sm:text-xl font-bold ${
                    theme.isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Seleccionar Tema
                </h2>
              </div>
              <button
                onClick={() => setShowThemeSelector(false)}
                className={`p-1.5 sm:p-2 ${
                  theme.isDark
                    ? "hover:bg-gray-700 text-gray-400"
                    : "hover:bg-gray-100 text-gray-600"
                } rounded-lg transition-colors`}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {(Object.keys(COLOR_THEMES) as ThemeKey[]).map((themeKey) => {
                const themeOption = COLOR_THEMES[themeKey];
                const isSelected = currentTheme === themeKey;

                return (
                  <button
                    key={themeKey}
                    onClick={() => changeTheme(themeKey)}
                    className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                      isSelected
                        ? `border-${themeOption.accent}-500 shadow-lg`
                        : `${
                            theme.isDark ? "border-gray-600" : "border-gray-200"
                          } hover:border-${themeOption.accent}-300`
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                    )}

                    {/* Preview del header */}
                    <div
                      className={`h-16 sm:h-20 md:h-24 rounded-lg bg-gradient-to-r ${themeOption.header} mb-2 sm:mb-3`}
                    />

                    {/* Preview de las tarjetas */}
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <div
                        className={`h-6 sm:h-8 rounded bg-gradient-to-br ${themeOption.cards.users}`}
                      />
                      <div
                        className={`h-6 sm:h-8 rounded bg-gradient-to-br ${themeOption.cards.companies}`}
                      />
                      <div
                        className={`h-6 sm:h-8 rounded bg-gradient-to-br ${themeOption.cards.vehicles}`}
                      />
                    </div>

                    {/* Nombre del tema */}
                    <p
                      className={`text-xs sm:text-sm font-semibold text-center ${
                        theme.isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {themeOption.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          <div
            className={`bg-gradient-to-br ${theme.cards.users} rounded-2xl shadow-xl p-4 sm:p-6 transform hover:scale-105 transition-transform`}
          >
            <div className="flex items-center justify-between mb-2">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white/90" />
              <span className="text-2xl sm:text-3xl font-bold text-white">
                {stats.totalUsers}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-white/80">
              Usuarios
            </p>
          </div>

          <div
            className={`bg-gradient-to-br ${theme.cards.companies} rounded-2xl shadow-xl p-4 sm:p-6 transform hover:scale-105 transition-transform`}
          >
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-white/90" />
              <span className="text-2xl sm:text-3xl font-bold text-white">
                {stats.totalCompanies}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-white/80">
              Empresas
            </p>
          </div>

          <div
            className={`bg-gradient-to-br ${theme.cards.vehicles} rounded-2xl shadow-xl p-4 sm:p-6 transform hover:scale-105 transition-transform`}
          >
            <div className="flex items-center justify-between mb-2">
              <Car className="w-6 h-6 sm:w-8 sm:h-8 text-white/90" />
              <span className="text-2xl sm:text-3xl font-bold text-white">
                {stats.totalVehicles}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-white/80">
              Vehículos
            </p>
          </div>

          <div
            className={`bg-gradient-to-br ${theme.cards.active} rounded-2xl shadow-xl p-4 sm:p-6 transform hover:scale-105 transition-transform`}
          >
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white/90" />
              <span className="text-2xl sm:text-3xl font-bold text-white">
                {stats.activeVehicles}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-white/80">
              Activos
            </p>
          </div>

          <div
            className={`bg-gradient-to-br ${theme.cards.hidden} rounded-2xl shadow-xl p-4 sm:p-6 transform hover:scale-105 transition-transform`}
          >
            <div className="flex items-center justify-between mb-2">
              <EyeOff className="w-6 h-6 sm:w-8 sm:h-8 text-white/90" />
              <span className="text-2xl sm:text-3xl font-bold text-white">
                {stats.hiddenVehicles}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-white/80">
              Ocultos
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Vehículos Recientes */}
          <div
            className={`${
              theme.isDark ? "bg-gray-800/80" : "bg-white/80"
            } backdrop-blur-sm rounded-2xl border-2 border-${
              theme.accent
            }-200 shadow-xl p-4 sm:p-6`}
          >
            <h2
              className={`text-lg sm:text-xl font-bold bg-gradient-to-r ${theme.buttons.vehicles} bg-clip-text text-transparent mb-4 flex items-center gap-2`}
            >
              <Car className={`w-5 h-5 text-${theme.accent}-600`} />
              Vehículos Recientes
            </h2>
            <div className="space-y-3">
              {recentVehicles.length === 0 ? (
                <p
                  className={`${
                    theme.isDark ? "text-gray-400" : "text-gray-500"
                  } text-center py-8 text-sm`}
                >
                  No hay vehículos registrados
                </p>
              ) : (
                recentVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className={`bg-gradient-to-r ${
                      theme.isDark
                        ? "from-gray-700 to-gray-600"
                        : `from-${theme.accent}-50 to-pink-50`
                    } rounded-xl p-3 sm:p-4 flex items-start sm:items-center justify-between gap-3 border border-${
                      theme.accent
                    }-100 hover:shadow-md transition-shadow`}
                  >
                    <div className="min-w-0 flex-1">
                      <h3
                        className={`text-sm sm:text-base font-semibold ${
                          theme.isDark ? "text-white" : "text-gray-900"
                        } truncate`}
                      >
                        {vehicle.marca} {vehicle.modelo}
                      </h3>
                      <p
                        className={`text-xs sm:text-sm ${
                          theme.isDark ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {vehicle.anio} • $
                        {vehicle.precio?.toLocaleString() || "N/A"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() =>
                          toggleVehicleVisibility(vehicle.id, vehicle.oculto)
                        }
                        className={`p-2 rounded-xl transition-all hover:scale-110 ${
                          vehicle.oculto
                            ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg"
                            : "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg"
                        }`}
                      >
                        {vehicle.oculto ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteVehicle(vehicle.id)}
                        className="p-2 bg-gradient-to-r from-red-400 to-pink-500 text-white hover:from-red-500 hover:to-pink-600 rounded-xl transition-all hover:scale-110 shadow-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Usuarios Recientes */}
          <div
            className={`${
              theme.isDark ? "bg-gray-800/80" : "bg-white/80"
            } backdrop-blur-sm rounded-2xl border-2 border-${
              theme.accent
            }-200 shadow-xl p-4 sm:p-6`}
          >
            <h2
              className={`text-lg sm:text-xl font-bold bg-gradient-to-r ${theme.buttons.users} bg-clip-text text-transparent mb-4 flex items-center gap-2`}
            >
              <Users className={`w-5 h-5 text-${theme.accent}-600`} />
              Usuarios Recientes
            </h2>
            <div className="space-y-3">
              {recentUsers.length === 0 ? (
                <p
                  className={`${
                    theme.isDark ? "text-gray-400" : "text-gray-500"
                  } text-center py-8 text-sm`}
                >
                  No hay usuarios registrados
                </p>
              ) : (
                recentUsers.map((usr) => (
                  <div
                    key={usr.id}
                    className={`bg-gradient-to-r ${
                      theme.isDark
                        ? "from-gray-700 to-gray-600"
                        : `from-${theme.accent}-50 to-cyan-50`
                    } rounded-xl p-3 sm:p-4 border border-${
                      theme.accent
                    }-100 hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3
                          className={`text-sm sm:text-base font-semibold ${
                            theme.isDark ? "text-white" : "text-gray-900"
                          } truncate`}
                        >
                          {usr.nombre} {usr.apellido}
                        </h3>
                        <p
                          className={`text-xs ${
                            theme.isDark ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          RUT: {usr.rut}
                        </p>
                        <p
                          className={`text-xs ${
                            theme.isDark ? "text-gray-400" : "text-gray-500"
                          } truncate`}
                        >
                          {usr.correo_electronico}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-bold flex-shrink-0 shadow-md ${
                          usr.rol === "administrador"
                            ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
                            : `bg-gradient-to-r ${theme.buttons.users} text-white`
                        }`}
                      >
                        {usr.rol}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div
          className={`${
            theme.isDark ? "bg-gray-800/80" : "bg-white/80"
          } backdrop-blur-sm rounded-2xl border-2 border-${
            theme.accent
          }-200 shadow-xl p-4 sm:p-6`}
        >
          <h2
            className={`text-lg sm:text-xl font-bold mb-4 flex items-center gap-2 ${
              theme.isDark
                ? "text-white"
                : `bg-gradient-to-r ${theme.header} bg-clip-text text-transparent`
            }`}
          >
            <Sparkles
              className={`w-5 h-5 ${
                theme.isDark ? "text-purple-400" : `text-${theme.accent}-600`
              }`}
            />
            Acciones Rápidas
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            <button
              onClick={() => router.push("/admin/users")}
              className={`bg-gradient-to-br ${theme.buttons.users} text-white p-3 sm:p-4 rounded-2xl transition-all hover:scale-105 flex flex-col items-center justify-center gap-2 text-center shadow-lg`}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs sm:text-sm font-semibold">Usuarios</span>
            </button>

            <button
              onClick={() => router.push("/admin/vehicles")}
              className={`bg-gradient-to-br ${theme.buttons.vehicles} text-white p-3 sm:p-4 rounded-2xl transition-all hover:scale-105 flex flex-col items-center justify-center gap-2 text-center shadow-lg`}
            >
              <Car className="w-5 h-5" />
              <span className="text-xs sm:text-sm font-semibold">
                Vehículos
              </span>
            </button>

            <button
              onClick={() => router.push("/admin/companies")}
              className={`bg-gradient-to-br ${theme.buttons.companies} text-white p-3 sm:p-4 rounded-2xl transition-all hover:scale-105 flex flex-col items-center justify-center gap-2 text-center shadow-lg`}
            >
              <Building2 className="w-5 h-5" />
              <span className="text-xs sm:text-sm font-semibold">Empresas</span>
            </button>

            <button
              onClick={() => router.push("/admin/validation")}
              className={`bg-gradient-to-br ${theme.buttons.validation} text-white p-3 sm:p-4 rounded-2xl transition-all hover:scale-105 flex flex-col items-center justify-center gap-2 text-center shadow-lg`}
            >
              <Shield className="w-5 h-5" />
              <span className="text-xs sm:text-sm font-semibold">
                Validación
              </span>
            </button>

            <button
              onClick={() => router.push("/admin/rejected")}
              className={`bg-gradient-to-br ${theme.buttons.rejected} text-white p-3 sm:p-4 rounded-2xl transition-all hover:scale-105 flex flex-col items-center justify-center gap-2 text-center shadow-lg`}
            >
              <XCircle className="w-5 h-5" />
              <span className="text-xs sm:text-sm font-semibold">
                Rechazadas
              </span>
            </button>

            {/* ✅ Nuevo botón de Estadísticas */}
            <button
              onClick={() => router.push("/admin/statistics")}
              className={`bg-gradient-to-br ${theme.buttons.statistics} text-white p-3 sm:p-4 rounded-2xl transition-all hover:scale-105 flex flex-col items-center justify-center gap-2 text-center shadow-lg`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs sm:text-sm font-semibold">
                Estadísticas
              </span>
            </button>

            <div className="relative">
              <button
                onClick={() => router.push("/admin/reports")}
                className={`w-full bg-gradient-to-br ${theme.buttons.reports} text-white p-3 sm:p-4 rounded-2xl transition-all hover:scale-105 flex flex-col items-center justify-center gap-2 text-center shadow-lg`}
              >
                <Flag className="w-5 h-5" />
                <span className="text-xs sm:text-sm font-semibold">
                  Reportes
                </span>
              </button>
              {pendingReportsCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shadow-lg animate-bounce border-2 border-white">
                  {pendingReportsCount > 9 ? "9+" : pendingReportsCount}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
