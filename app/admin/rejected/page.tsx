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
  XCircle,
  Search,
  Loader2,
  ArrowLeft,
  Building2,
  Mail,
  Calendar,
  FileText,
  AlertCircle,
} from "lucide-react";

interface Empresa {
  nombre_comercial: string;
  rut_empresa: string;
  correo_electronico: string;
}

interface RejectedCompany {
  id: number;
  empresa_id: number;
  motivo: string;
  created_at: string;
  empresa: Empresa;
}

export default function RejectedCompaniesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rejected, setRejected] = useState<RejectedCompany[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  const lastLoadTime = useRef<number>(0);
  const CACHE_DURATION = 30000;

  useEffect(() => {
    checkAdmin();
  }, []);

  const filteredRejected = useMemo(() => {
    if (!searchTerm) return rejected;

    const term = searchTerm.toLowerCase();
    return rejected.filter(
      (r) =>
        r.empresa?.nombre_comercial?.toLowerCase().includes(term) ||
        r.empresa?.correo_electronico?.toLowerCase().includes(term) ||
        r.empresa?.rut_empresa?.includes(term)
    );
  }, [rejected, searchTerm]);

  const stats = useMemo(
    () => ({
      total: rejected.length,
      unique: new Set(rejected.map((r) => r.empresa?.rut_empresa)).size,
      withReason: rejected.filter((r) => r.motivo).length,
    }),
    [rejected]
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

      await loadRejected();
    } catch (error) {
      console.error("Error:", error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const loadRejected = useCallback(async () => {
    try {
      const now = Date.now();

      if (now - lastLoadTime.current < CACHE_DURATION && rejected.length > 0) {
        return;
      }

      const { data, error } = await supabase
        .from("empresa_rechazo")
        .select(
          `
            *,
            empresa:empresa_id (
              nombre_comercial,
              rut_empresa,
              correo_electronico
            )
          `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRejected(data || []);
      lastLoadTime.current = now;
      setError("");
    } catch (error: any) {
      setError("No se pudieron cargar los rechazos.");
      console.error("Error loading rejected companies:", error);
      setRejected([]);
    }
  }, [rejected.length]);

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
              <XCircle className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Empresas Rechazadas
              </h1>
              <p className="text-sm text-gray-500">
                Historial de {rejected.length} rechazos
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                {stats.total}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">
              Total
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-slate-600" />
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                {stats.unique}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">
              Únicas
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                {stats.withReason}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">
              Con Motivo
            </p>
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
              placeholder="Buscar por nombre, email o RUT..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
        </div>

        {/* Lista de Rechazos */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {filteredRejected.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {rejected.length === 0
                  ? "No hay empresas rechazadas"
                  : "No se encontraron resultados"}
              </h3>
              <p className="text-gray-500 text-sm">
                {rejected.length === 0
                  ? "El historial de rechazos aparecerá aquí"
                  : "Intenta con otro término de búsqueda"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredRejected.map((item) => (
                <RejectedCompanyCard key={item.id} company={item} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Componente de tarjeta individual

interface RejectedCompanyCardProps {
  company: RejectedCompany;
}

function RejectedCompanyCard({ company }: RejectedCompanyCardProps) {
  const formattedDate = useMemo(() => {
    return new Date(company.created_at).toLocaleString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [company.created_at]);

  return (
    <div className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
              {company.empresa?.nombre_comercial || "Sin nombre"}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 font-mono">
              {company.empresa?.rut_empresa || "N/A"}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid sm:grid-cols-2 gap-2 sm:gap-3 pl-11">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 min-w-0">
            <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            {company.empresa?.correo_electronico ? (
              <a
                href={`mailto:${company.empresa.correo_electronico}`}
                className="text-blue-600 hover:underline truncate"
              >
                {company.empresa.correo_electronico}
              </a>
            ) : (
              <span className="text-gray-400">No disponible</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">{formattedDate}</span>
          </div>
        </div>

        {/* Motivo del rechazo */}
        {company.motivo && (
          <div className="bg-red-50 rounded-lg p-3 sm:p-4 border-l-4 border-red-500 ml-0 sm:ml-11">
            <div className="flex items-start gap-2 sm:gap-3">
              <FileText className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">
                  Motivo del rechazo:
                </p>
                <p className="text-xs sm:text-sm text-gray-700 break-words">
                  {company.motivo}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
