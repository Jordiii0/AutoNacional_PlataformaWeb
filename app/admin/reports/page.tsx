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
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
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
  const [filterStatus, setFilterStatus] = useState<"all" | "pendiente">(
    "pendiente"
  );
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
        setError("Acceso denegado");
        router.push("/");
        return;
      }

      await loadReports();
    } catch (error) {
      console.error("Error:", error);
      setError("Error al verificar acceso");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const loadReports = useCallback(async () => {
    try {
      const now = Date.now();

      if (now - lastLoadTime.current < CACHE_DURATION && reports.length > 0) {
        console.log("📦 Usando caché de reportes");
        return;
      }

      console.log("📥 Cargando reportes...");

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

  // ✅ NUEVA FUNCIÓN: Marcar como revisada
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
        // Obtener ID del administrador actual
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const adminId = session?.user.id;

        // 1. Obtener datos del vehículo y propietario
        const { data: vehiculoData } = await supabase
          .from("vehiculo")
          .select("usuario_id, empresa_id")
          .eq("id", report.vehiculo_id)
          .single();

        if (!vehiculoData) {
          throw new Error("Vehículo no encontrado");
        }

        // 2. Crear notificación informando que fue revisada
        if (vehiculoData.usuario_id || vehiculoData.empresa_id) {
          console.log("📢 Creando notificación de revisión...");

          const { error: notifError } = await supabase
            .from("notificacion")
            .insert({
              usuario_id: vehiculoData.usuario_id || null,
              empresa_id: vehiculoData.empresa_id || null,
              usuario_reporta_id: adminId || null,
              tipo: "publicacion_revisada",
              titulo: "Tu publicación ha sido revisada",
              mensaje: `Tu publicación de ${report.vehiculo?.marca} ${
                report.vehiculo?.modelo
              } ${report.vehiculo?.anio} ha sido revisada y cumple con todas las normas de la plataforma. ✅`,
              referencia_id: report.vehiculo_id,
              leida: false,
            });

          if (notifError) {
            console.error("❌ Error creando notificación:", notifError);
            throw new Error(`Error en notificación: ${notifError.message}`);
          }
        }

        // 3. Marcar reporte como resuelto
        const { error: updateError } = await supabase
          .from("reporte")
          .update({ estado: "resuelto" })
          .eq("id", reportId);

        if (updateError) throw updateError;

        // 4. Actualizar lista local
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId ? { ...r, estado: "resuelto" } : r
          )
        );

        setSuccessMessage(
          "✅ Publicación validada y notificación enviada al propietario"
        );
        setTimeout(() => setSuccessMessage(""), 3000);
        setError("");
      } catch (err: any) {
        console.error("❌ Error reviewing publication:", err);
        setError("Error al validar la publicación: " + err.message);
      } finally {
        setSaving(false);
      }
    },
    []
  );

  // ✅ FUNCIÓN ORIGINAL: Eliminar publicación y notificar
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
        // Obtener ID del administrador actual
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const adminId = session?.user.id;

        // 1. Obtener datos del vehículo y propietario
        const { data: vehiculoData } = await supabase
          .from("vehiculo")
          .select("usuario_id, empresa_id")
          .eq("id", report.vehiculo_id)
          .single();

        if (!vehiculoData) {
          throw new Error("Vehículo no encontrado");
        }

        // 2. Crear notificación PRIMERO (antes de eliminar)
        if (vehiculoData.usuario_id || vehiculoData.empresa_id) {
          console.log("📢 Intentando crear notificación...");

          const { data: notifData, error: notifError } = await supabase
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
            })
            .select();

          if (notifError) {
            console.error("❌ Error creando notificación:", notifError);
            throw new Error(`Error en notificación: ${notifError.message}`);
          } else {
            console.log("✅ Notificación creada:", notifData);
          }
        }

        // 3. Eliminar imágenes del storage
        const { data: imagenes } = await supabase
          .from("imagen_vehiculo")
          .select("url_imagen")
          .eq("vehiculo_id", report.vehiculo_id);

        if (imagenes && imagenes.length > 0) {
          const filePaths = imagenes.map((img) => {
            const url = img.url_imagen;
            const path = url.split(
              "/storage/v1/object/public/vehiculo_imagen/"
            )[1];
            return path;
          });

          await supabase.storage
            .from("vehiculo_imagen")
            .remove(filePaths)
            .catch((err) => console.error("Error eliminando imágenes:", err));
        }

        // 4. Eliminar registros relacionados
        await supabase
          .from("imagen_vehiculo")
          .delete()
          .eq("vehiculo_id", report.vehiculo_id);

        await supabase
          .from("usuario_vehiculo")
          .delete()
          .eq("vehiculo_id", report.vehiculo_id);

        await supabase
          .from("calificacion")
          .delete()
          .eq("vehiculo_id", report.vehiculo_id);

        // 5. Eliminar el vehículo
        const { error: deleteError } = await supabase
          .from("vehiculo")
          .delete()
          .eq("id", report.vehiculo_id);

        if (deleteError) throw deleteError;

        // 6. Marcar reporte como resuelto
        const { error: updateError } = await supabase
          .from("reporte")
          .update({ estado: "resuelto" })
          .eq("id", reportId);

        if (updateError) throw updateError;

        // 7. Actualizar lista local
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId ? { ...r, estado: "resuelto" } : r
          )
        );

        setSuccessMessage(
          "✅ Publicación eliminada y notificación enviada al propietario"
        );
        setTimeout(() => setSuccessMessage(""), 3000);
        setError("");
      } catch (err: any) {
        console.error("❌ Error deleting publication:", err);
        setError("Error al eliminar la publicación: " + err.message);
      } finally {
        setSaving(false);
      }
    },
    []
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al Panel
          </button>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-slate-700">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Flag className="w-8 h-8 text-red-400" />
              Reportes de Publicaciones
            </h1>
            <p className="text-slate-400 mt-2">
              Total de reportes pendientes: {stats.pending}
            </p>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-green-900/30 border border-green-500 text-green-200 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {successMessage}
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-1 gap-6 mb-6">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.pending}</span>
            </div>
            <p className="text-amber-100 font-semibold">Reportes Pendientes</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-slate-700 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por vehículo o motivo..."
              className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Lista de reportes */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
          {filteredReports.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No hay reportes pendientes
              </h3>
              <p className="text-slate-400">
                Todos los reportes han sido resueltos
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {filteredReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onMarkAsReviewed={markAsReviewed}
                  onDeletePublication={deletePublication}
                  onViewVehicle={() =>
                    router.push(`/vehicle/${report.vehiculo_id}`)
                  }
                  saving={saving}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ✅ Componente separado
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
    return new Date(report.created_at).toLocaleDateString("es-ES", {
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
    <div className="p-6 hover:bg-slate-700/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Encabezado */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <Car className="w-5 h-5 text-red-400 flex-shrink-0" />
            <h3 className="text-lg font-bold text-white truncate">
              {report.vehiculo?.marca} {report.vehiculo?.modelo}{" "}
              {report.vehiculo?.anio}
            </h3>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-600 text-white flex-shrink-0">
              {report.estado}
            </span>
          </div>

          {/* Info principal */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-slate-300 text-sm min-w-0">
              <Flag className="w-4 h-4 flex-shrink-0" />
              <span className="font-semibold flex-shrink-0">Motivo:</span>
              <span className="truncate">{motivoLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              {formattedDate}
            </div>
          </div>

          {/* Descripción */}
          {report.descripcion && (
            <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-slate-300 break-words">
                {report.descripcion}
              </p>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={onViewVehicle}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Ver Vehículo
            </button>

            {/* ✅ NUEVO BOTÓN: Revisada */}
            <button
              onClick={() => onMarkAsReviewed(report.id, report)}
              disabled={saving}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Revisada
                </>
              )}
            </button>

            <button
              onClick={() => onDeletePublication(report.id, report)}
              disabled={saving}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Eliminar Publicación
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
