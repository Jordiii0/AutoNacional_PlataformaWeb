"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Flag,
  Search,
  Loader2,
  ArrowLeft,
  Car,
  Calendar,
  AlertCircle,
  Trash2,
  X,
} from "lucide-react";

interface MyReport {
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

export default function MyReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<MyReport[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadMyReports();
  }, []);

  const filteredReports = useMemo(() => {
    if (!searchTerm) return reports;

    const term = searchTerm.toLowerCase();
    return reports.filter(
      (r) =>
        r.vehiculo?.marca.toLowerCase().includes(term) ||
        r.vehiculo?.modelo.toLowerCase().includes(term) ||
        r.motivo.toLowerCase().includes(term) ||
        (MOTIVO_LABELS[r.motivo] || r.motivo).toLowerCase().includes(term)
    );
  }, [reports, searchTerm]);

  const loadMyReports = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const userId = session.user.id;

      const { data, error: queryError } = await supabase
        .from("reporte")
        .select("*")
        .eq("usuario_id", userId)
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;

      if (data && data.length > 0) {
        const reportsWithVehicles = await Promise.all(
          data.map(async (report) => {
            const { data: vehiculoData } = await supabase
              .from("vehiculo")
              .select("marca, modelo, anio")
              .eq("id", report.vehiculo_id)
              .single();

            return {
              ...report,
              vehiculo: vehiculoData || {
                marca: "Desconocido",
                modelo: "Desconocido",
                anio: 0,
              },
            };
          })
        );

        setReports(reportsWithVehicles);
      } else {
        setReports([]);
      }
    } catch (err: any) {
      console.error("Error loading reports:", err);
      setError("Error al cargar tus reportes");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleDelete = useCallback(async (reportId: number) => {
    setDeleting(true);
    try {
      const { error: deleteError } = await supabase
        .from("reporte")
        .delete()
        .eq("id", reportId);

      if (deleteError) throw deleteError;

      setReports((prev) => prev.filter((r) => r.id !== reportId));
      setDeleteModal(null);
    } catch (err: any) {
      console.error("Error deleting report:", err);
      setError("Error al eliminar el reporte");
    } finally {
      setDeleting(false);
    }
  }, []);

  const getMotivoLabel = (motivo: string) => {
    return MOTIVO_LABELS[motivo] || motivo;
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "bg-yellow-50 text-yellow-700 border border-yellow-200";
      case "revisado":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "resuelto":
        return "bg-green-50 text-green-700 border border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
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
        <div className="max-w-6xl mx-auto px-6 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Flag className="w-7 h-7 text-red-500" />
                Mis Reportes
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {reports.length}{" "}
                {reports.length === 1 ? "reporte realizado" : "reportes realizados"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError("")}
              className="ml-auto p-1 hover:bg-red-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por vehículo o motivo..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Flag className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No hay reportes
            </h3>
            <p className="text-gray-600 text-sm">
              {reports.length === 0
                ? "Aún no has realizado ningún reporte"
                : "No se encontraron reportes con esos criterios"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onDelete={() => setDeleteModal(report.id)}
                getMotivoLabel={getMotivoLabel}
                getEstadoColor={getEstadoColor}
              />
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-xl max-w-md w-full p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Eliminar Reporte
                  </h3>
                  <p className="text-sm text-gray-600">
                    ¿Estás seguro de que deseas eliminar este reporte? Esta acción
                    no se puede deshacer.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setDeleteModal(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deleteModal)}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? (
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
        )}
      </main>
    </div>
  );
}

interface ReportCardProps {
  report: MyReport;
  onDelete: () => void;
  getMotivoLabel: (motivo: string) => string;
  getEstadoColor: (estado: string) => string;
}

function ReportCard({
  report,
  onDelete,
  getMotivoLabel,
  getEstadoColor,
}: ReportCardProps) {
  const formattedDate = useMemo(() => {
    return new Date(report.created_at).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [report.created_at]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Car className="w-4 h-4 text-red-500 flex-shrink-0" />
              <h3 className="text-base font-bold text-gray-900 truncate">
                {report.vehiculo?.marca} {report.vehiculo?.modelo}{" "}
                {report.vehiculo?.anio}
              </h3>
            </div>
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex-shrink-0 ${getEstadoColor(
                report.estado
              )}`}
            >
              {report.estado.charAt(0).toUpperCase() + report.estado.slice(1)}
            </span>
          </div>

          {/* Info */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Flag className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="font-medium">Motivo:</span>
              <span className="text-gray-900">
                {getMotivoLabel(report.motivo)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Description */}
          {report.descripcion && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-sm text-gray-700 break-words leading-relaxed">
                {report.descripcion}
              </p>
            </div>
          )}
        </div>

        {/* Delete Button */}
        <button
          onClick={onDelete}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 group-hover:opacity-100 opacity-0"
          title="Eliminar reporte"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
