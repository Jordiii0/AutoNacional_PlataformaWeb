"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Flag,
  Search,
  Loader2,
  ArrowLeft,
  Eye,
  Trash2,
  Car,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";

interface Report {
  id: number;
  vehiculo_id: number;
  usuario_id: string;
  motivo: string;
  descripcion: string | null;
  estado: string;
  created_at: string;
  vehiculo?: {
    marca: string;
    modelo: string;
    anio: number;
  };
}

const MOTIVO_LABELS: Record<string, string> = {
  spam: "Spam",
  estafa: "Posible estafa",
  danado: "Vehículo dañado/accidentado",
  falso: "Información falsa",
  ofensivo: "Contenido ofensivo",
  otro: "Otro",
};

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pendiente">("pendiente");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const lastLoadTime = useRef<number>(0);
  const CACHE_DURATION = 30000;

  useEffect(() => {
    checkAdmin();
  }, []);

  const filteredReports = useMemo(() => {
    let filtered = reports;

    if (filterStatus !== "all") {
      filtered = filtered.filter((r) => r.estado === filterStatus);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.vehiculo?.marca.toLowerCase().includes(term) ||
          r.vehiculo?.modelo.toLowerCase().includes(term) ||
          r.motivo.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [reports, filterStatus, searchTerm]);

  const stats = useMemo(
    () => ({
      pending: reports.filter((r) => r.estado === "pendiente").length,
      total: reports.length,
    }),
    [reports]
  );

  const checkAdmin = async () => {
    try {
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
        router.push("/");
        return;
      }

      await loadReports();
    } catch (error) {
      console.error("Error:", error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const loadReports = useCallback(async () => {
    try {
      const now = Date.now();

      if (now - lastLoadTime.current < CACHE_DURATION && reports.length > 0) {
        return;
      }

      const { data, error } = await supabase
        .from("reporte")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setReports([]);
        lastLoadTime.current = now;
        return;
      }

      const reportsWithRelations = await Promise.all(
        data.map(async (report) => {
          const { data: vehiculoData } = await supabase
            .from("vehiculo")
            .select("marca, modelo, anio")
            .eq("id", report.vehiculo_id)
            .single();

          return {
            ...report,
            vehiculo: vehiculoData,
          };
        })
      );

      setReports(reportsWithRelations);
      lastLoadTime.current = now;
      setError("");
    } catch (error) {
      console.error("Error loading reports:", error);
      setError("Error al cargar reportes");
      setReports([]);
    }
  }, [reports.length]);

  const markAsReviewed = useCallback(
    async (reportId: number, report: Report) => {
      if (
        !confirm(
          "¿Estás seguro de que la publicación cumple con todas las normas? Se marcará como revisada."
        )
      )
        return;

      setSaving(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const adminId = session?.user.id;

        const { data: vehiculoData } = await supabase
          .from("vehiculo")
          .select("usuario_id, empresa_id")
          .eq("id", report.vehiculo_id)
          .single();

        if (!vehiculoData) {
          throw new Error("Vehículo no encontrado");
        }

        if (vehiculoData.usuario_id || vehiculoData.empresa_id) {
          const { error: notifError } = await supabase
            .from("notificacion")
            .insert({
              usuario_id: vehiculoData.usuario_id || null,
              empresa_id: vehiculoData.empresa_id || null,
              usuario_reporta_id: adminId || null,
              tipo: "publicacion_revisada",
              titulo: "Tu publicación ha sido revisada",
              mensaje: `Tu publicación de ${report.vehiculo?.marca} ${report.vehiculo?.modelo} ${report.vehiculo?.anio} ha sido revisada y cumple con todas las normas de la plataforma. ✅`,
              referencia_id: report.vehiculo_id,
              leida: false,
            });

          if (notifError) {
            throw new Error(`Error en notificación: ${notifError.message}`);
          }
        }

        const { error: updateError } = await supabase
          .from("reporte")
          .update({ estado: "resuelto" })
          .eq("id", reportId);

        if (updateError) throw updateError;

        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, estado: "resuelto" } : r))
        );

        setSuccessMessage("✅ Publicación validada y notificación enviada");
        setTimeout(() => setSuccessMessage(""), 3000);
        setError("");
      } catch (err: any) {
        console.error("Error reviewing publication:", err);
        setError("Error al validar la publicación: " + err.message);
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const deletePublication = useCallback(
    async (reportId: number, report: Report) => {
      if (
        !confirm(
          "¿Estás seguro de que deseas eliminar esta publicación? Se enviará una notificación al usuario."
        )
      )
        return;

      setSaving(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const adminId = session?.user.id;

        const { data: vehiculoData } = await supabase
          .from("vehiculo")
          .select("usuario_id, empresa_id")
          .eq("id", report.vehiculo_id)
          .single();

        if (!vehiculoData) {
          throw new Error("Vehículo no encontrado");
        }

        if (vehiculoData.usuario_id || vehiculoData.empresa_id) {
          const { error: notifError } = await supabase
            .from("notificacion")
            .insert({
              usuario_id: vehiculoData.usuario_id || null,
              empresa_id: vehiculoData.empresa_id || null,
              usuario_reporta_id: adminId || null,
              tipo: "publicacion_eliminada",
              titulo: "Tu publicación ha sido eliminada",
              mensaje: `Tu publicación de ${report.vehiculo?.marca} ${
                report.vehiculo?.modelo
              } ${report.vehiculo?.anio} ha sido eliminada por: ${
                MOTIVO_LABELS[report.motivo] || report.motivo
              }`,
              referencia_id: report.vehiculo_id,
              leida: false,
            });

          if (notifError) {
            throw new Error(`Error en notificación: ${notifError.message}`);
          }
        }

        const { data: imagenes } = await supabase
          .from("imagen_vehiculo")
          .select("url_imagen")
          .eq("vehiculo_id", report.vehiculo_id);

        if (imagenes && imagenes.length > 0) {
          const filePaths = imagenes.map((img) => {
            const url = img.url_imagen;
            const path = url.split("/storage/v1/object/public/vehiculo_imagen/")[1];
            return path;
          });

          await supabase.storage.from("vehiculo_imagen").remove(filePaths);
        }

        await supabase.from("imagen_vehiculo").delete().eq("vehiculo_id", report.vehiculo_id);
        await supabase.from("usuario_vehiculo").delete().eq("vehiculo_id", report.vehiculo_id);
        await supabase.from("calificacion").delete().eq("vehiculo_id", report.vehiculo_id);

        const { error: deleteError } = await supabase
          .from("vehiculo")
          .delete()
          .eq("id", report.vehiculo_id);

        if (deleteError) throw deleteError;

        const { error: updateError } = await supabase
          .from("reporte")
          .update({ estado: "resuelto" })
          .eq("id", reportId);

        if (updateError) throw updateError;

        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, estado: "resuelto" } : r))
        );

        setSuccessMessage("✅ Publicación eliminada y notificación enviada");
        setTimeout(() => setSuccessMessage(""), 3000);
        setError("");
      } catch (err: any) {
        console.error("Error deleting publication:", err);
        setError("Error al eliminar la publicación: " + err.message);
      } finally {
        setSaving(false);
      }
    },
    []
  );

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
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Flag className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Reportes de Publicaciones
              </h1>
              <p className="text-sm text-gray-500">
                {stats.pending} reportes pendientes
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Mensajes */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{successMessage}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-8 h-8 text-amber-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.pending}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Reportes Pendientes</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <Flag className="w-8 h-8 text-red-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.total}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Total de Reportes</p>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por vehículo o motivo..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
        </div>

        {/* Lista de reportes */}
        <div className="space-y-3">
          {filteredReports.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay reportes pendientes
              </h3>
              <p className="text-gray-500 text-sm">
                Todos los reportes han sido resueltos
              </p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onMarkAsReviewed={markAsReviewed}
                onDeletePublication={deletePublication}
                onViewVehicle={() => router.push(`/vehicle/${report.vehiculo_id}`)}
                saving={saving}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

// Componente de tarjeta de reporte

interface ReportCardProps {
  report: Report;
  onMarkAsReviewed: (reportId: number, report: Report) => void;
  onDeletePublication: (reportId: number, report: Report) => void;
  onViewVehicle: () => void;
  saving: boolean;
}

function ReportCard({
  report,
  onMarkAsReviewed,
  onDeletePublication,
  onViewVehicle,
  saving,
}: ReportCardProps) {
  const formattedDate = useMemo(() => {
    return new Date(report.created_at).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [report.created_at]);

  const motivoLabel = useMemo(
    () => MOTIVO_LABELS[report.motivo] || report.motivo,
    [report.motivo]
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 hover:border-gray-300 transition-all">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Car className="w-5 h-5 text-red-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                {report.vehiculo?.marca} {report.vehiculo?.modelo}{" "}
                {report.vehiculo?.anio}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                ID: {report.vehiculo_id}
              </p>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex-shrink-0 ${
              report.estado === "pendiente"
                ? "bg-amber-100 text-amber-700 border border-amber-200"
                : "bg-green-100 text-green-700 border border-green-200"
            }`}
          >
            {report.estado}
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid sm:grid-cols-2 gap-3 pl-0 sm:pl-11">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
            <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 text-red-600" />
            <span className="font-semibold flex-shrink-0">Motivo:</span>
            <span className="truncate">{motivoLabel}</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">{formattedDate}</span>
          </div>
        </div>

        {/* Descripción */}
        {report.descripcion && (
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border-l-4 border-red-500">
            <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">
              Descripción del reporte:
            </p>
            <p className="text-xs sm:text-sm text-gray-700 break-words">
              {report.descripcion}
            </p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={onViewVehicle}
            disabled={saving}
            className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Ver Vehículo
          </button>

          <button
            onClick={() => onMarkAsReviewed(report.id, report)}
            disabled={saving || report.estado === "resuelto"}
            className="flex-1 sm:flex-initial px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Validar
              </>
            )}
          </button>

          <button
            onClick={() => onDeletePublication(report.id, report)}
            disabled={saving || report.estado === "resuelto"}
            className="flex-1 sm:flex-initial px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Eliminar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
