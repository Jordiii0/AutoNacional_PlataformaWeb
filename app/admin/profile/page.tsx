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
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalCompanies: number;
  totalVehicles: number;
  activeVehicles: number;
  hiddenVehicles: number;
}

export default function AdminProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
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

  useEffect(() => {
    checkAdminAccess();
  }, []);

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

      await supabase.from("imagen_vehiculo").delete().eq("vehiculo_id", vehicleId);
      await supabase.from("usuario_vehiculo").delete().eq("vehiculo_id", vehicleId);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gray-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Panel Admin
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refrescar</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                {stats.totalUsers}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">Usuarios</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                {stats.totalCompanies}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">Empresas</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <Car className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                {stats.totalVehicles}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">Vehículos</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-teal-600" />
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                {stats.activeVehicles}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">Activos</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <EyeOff className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                {stats.hiddenVehicles}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">Ocultos</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Vehículos Recientes */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-gray-600" />
              Vehículos Recientes
            </h2>
            <div className="space-y-3">
              {recentVehicles.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm">
                  No hay vehículos registrados
                </p>
              ) : (
                recentVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="bg-gray-50 rounded-lg p-3 sm:p-4 flex items-start sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                        {vehicle.marca} {vehicle.modelo}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {vehicle.anio} • ${vehicle.precio?.toLocaleString() || "N/A"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() =>
                          toggleVehicleVisibility(vehicle.id, vehicle.oculto)
                        }
                        className={`p-2 rounded-lg transition-colors ${
                          vehicle.oculto
                            ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
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
                        className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
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
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              Usuarios Recientes
            </h2>
            <div className="space-y-3">
              {recentUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm">
                  No hay usuarios registrados
                </p>
              ) : (
                recentUsers.map((usr) => (
                  <div key={usr.id} className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                          {usr.nombre} {usr.apellido}
                        </h3>
                        <p className="text-xs text-gray-600">RUT: {usr.rut}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {usr.correo_electronico}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-semibold flex-shrink-0 ${
                          usr.rol === "administrador"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
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
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <button
              onClick={() => router.push("/admin/users")}
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 sm:p-4 rounded-lg transition-colors flex flex-col items-center justify-center gap-2 text-center"
            >
              <Users className="w-5 h-5" />
              <span className="text-xs sm:text-sm font-semibold">Usuarios</span>
            </button>

            <button
              onClick={() => router.push("/admin/vehicles")}
              className="bg-green-600 hover:bg-green-700 text-white p-3 sm:p-4 rounded-lg transition-colors flex flex-col items-center justify-center gap-2 text-center"
            >
              <Car className="w-5 h-5" />
              <span className="text-xs sm:text-sm font-semibold">Vehículos</span>
            </button>

            <button
              onClick={() => router.push("/admin/companies")}
              className="bg-purple-600 hover:bg-purple-700 text-white p-3 sm:p-4 rounded-lg transition-colors flex flex-col items-center justify-center gap-2 text-center"
            >
              <Building2 className="w-5 h-5" />
              <span className="text-xs sm:text-sm font-semibold">Empresas</span>
            </button>

            <button
              onClick={() => router.push("/admin/validation")}
              className="bg-amber-600 hover:bg-amber-700 text-white p-3 sm:p-4 rounded-lg transition-colors flex flex-col items-center justify-center gap-2 text-center"
            >
              <Shield className="w-5 h-5" />
              <span className="text-xs sm:text-sm font-semibold">Validación</span>
            </button>

            <button
              onClick={() => router.push("/admin/rejected")}
              className="bg-rose-600 hover:bg-rose-700 text-white p-3 sm:p-4 rounded-lg transition-colors flex flex-col items-center justify-center gap-2 text-center"
            >
              <XCircle className="w-5 h-5" />
              <span className="text-xs sm:text-sm font-semibold">Rechazadas</span>
            </button>

            <div className="relative">
              <button
                onClick={() => router.push("/admin/reports")}
                className="w-full bg-red-600 hover:bg-red-700 text-white p-3 sm:p-4 rounded-lg transition-colors flex flex-col items-center justify-center gap-2 text-center"
              >
                <Flag className="w-5 h-5" />
                <span className="text-xs sm:text-sm font-semibold">Reportes</span>
              </button>
              {pendingReportsCount > 0 && (
                <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-lg">
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
