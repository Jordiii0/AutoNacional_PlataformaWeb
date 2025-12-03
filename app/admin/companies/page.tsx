"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Building2,
  Search,
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  User,
  Globe,
  Calendar,
  X,
  ShieldCheck,
  ShieldX,
} from "lucide-react";

interface Empresa {
  id: string;
  nombre_comercial: string;
  rut_empresa: string;
  correo_electronico: string;
  telefono: string | null;
  direccion: string | null;
  region_id: number | null;
  ciudad_id: number | null;
  representante_legal: string | null;
  rut_representante: string | null;
  sitio_web: string | null;
  descripcion: string | null;
  habilitado: boolean;
  validada: boolean;
  created_at: string;
  updated_at: string;
}

interface ModalData {
  type: "view" | null;
  empresa: Empresa | null;
}

export default function AdminCompaniesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [modal, setModal] = useState<ModalData>({ type: null, empresa: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const lastLoadTime = useRef<number>(0);
  const CACHE_DURATION = 30000;

  useEffect(() => {
    checkAdmin();
  }, []);

  const filteredEmpresas = useMemo(() => {
    let filtered = empresas;
    if (searchTerm) {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (e) =>
          (e.nombre_comercial || "").toLowerCase().includes(term) ||
          (e.rut_empresa || "").toLowerCase().includes(term) ||
          (e.representante_legal || "").toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [empresas, searchTerm]);

  const stats = useMemo(
    () => ({
      total: empresas.length,
      habilitadas: empresas.filter((e) => e.habilitado).length,
      validadas: empresas.filter((e) => e.validada).length,
    }),
    [empresas]
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
      await loadEmpresas();
    } catch (error) {
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const loadEmpresas = async () => {
    try {
      const now = Date.now();
      if (now - lastLoadTime.current < CACHE_DURATION && empresas.length > 0) {
        return;
      }
      const { data, error } = await supabase
        .from("empresa")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setEmpresas(data || []);
      lastLoadTime.current = now;
      setError("");
    } catch (error) {
      setError("Error al cargar empresas");
    }
  };

  const handleToggleHabilitado = async (empresa: Empresa) => {
    setSaving(true);
    try {
      const newHabilitado = !empresa.habilitado;
      const { error } = await supabase
        .from("empresa")
        .update({ habilitado: newHabilitado })
        .eq("id", empresa.id);
      if (error) throw error;
      setEmpresas((prev) =>
        prev.map((e) =>
          e.id === empresa.id ? { ...e, habilitado: newHabilitado } : e
        )
      );
      setError("");
    } catch (error) {
      console.error("Error toggling habilitado:", error);
      setError("Error al cambiar el estado de la empresa");
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setModal({ type: null, empresa: null });
    setError("");
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
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestión de Empresas
              </h1>
              <p className="text-sm text-gray-500">
                {empresas.length} empresas registradas
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
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
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                {stats.habilitadas}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">
              Habilitadas
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                {stats.validadas}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">
              Validadas
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
              placeholder="Buscar por nombre, RUT o representante..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    RUT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Representante
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEmpresas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">
                        No se encontraron empresas
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredEmpresas.map((empresa) => (
                    <tr
                      key={empresa.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {empresa.nombre_comercial}
                          </p>
                          <p className="text-xs text-gray-500">
                            {empresa.correo_electronico}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {empresa.rut_empresa}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">
                          {empresa.telefono || "Sin teléfono"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {empresa.direccion || "Sin dirección"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {empresa.representante_legal || "Sin representante"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => handleToggleHabilitado(empresa)}
                            disabled={saving}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 ${
                              empresa.habilitado
                                ? "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200"
                                : "bg-red-100 text-red-700 border border-red-200 hover:bg-red-200"
                            }`}
                          >
                            {empresa.habilitado ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Habilitada
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                Inhabilitada
                              </>
                            )}
                          </button>
                          {empresa.validada && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold">
                              <ShieldCheck className="w-3 h-3" />
                              Validada
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => setModal({ type: "view", empresa })}
                            className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {filteredEmpresas.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                No se encontraron empresas
              </p>
            </div>
          ) : (
            filteredEmpresas.map((empresa) => (
              <div
                key={empresa.id}
                className="bg-white rounded-xl border border-gray-100 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">
                      {empresa.nombre_comercial}
                    </h3>
                    <p className="text-xs text-gray-600 mb-1">
                      RUT: {empresa.rut_empresa}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {empresa.correo_electronico}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {empresa.validada && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Validada
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    {empresa.telefono || "Sin teléfono"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {empresa.direccion || "Sin dirección"}
                  </div>
                  {empresa.representante_legal && (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {empresa.representante_legal}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleToggleHabilitado(empresa)}
                    disabled={saving}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                      empresa.habilitado
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {empresa.habilitado ? "Habilitada" : "Inhabilitada"}
                  </button>

                  <button
                    onClick={() => setModal({ type: "view", empresa })}
                    className="p-1.5 bg-blue-100 text-blue-700 rounded-lg"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal */}
      {modal.type === "view" && modal.empresa && (
        <ModalDetallesEmpresa empresa={modal.empresa} onClose={closeModal} />
      )}
    </div>
  );
}

interface ModalDetallesEmpresaProps {
  empresa: Empresa;
  onClose: () => void;
}

function ModalDetallesEmpresa({
  empresa,
  onClose,
}: ModalDetallesEmpresaProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Detalles de la Empresa
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">
              Nombre Comercial
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {empresa.nombre_comercial}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">RUT Empresa</p>
            <p className="text-sm font-semibold text-gray-900">
              {empresa.rut_empresa}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Correo Electrónico
            </p>
            <p className="text-sm text-gray-900 break-all">
              {empresa.correo_electronico || "Sin correo"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> Teléfono
            </p>
            <p className="text-sm text-gray-900">
              {empresa.telefono || "Sin teléfono"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Dirección
            </p>
            <p className="text-sm text-gray-900">
              {empresa.direccion || "Sin dirección"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Representante Legal
            </p>
            <p className="text-sm text-gray-900">
              {empresa.representante_legal || "Sin representante"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">
              RUT Representante
            </p>
            <p className="text-sm text-gray-900">
              {empresa.rut_representante || "Sin RUT"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> Sitio Web
            </p>
            <p className="text-sm text-gray-900 break-all">
              {empresa.sitio_web || "Sin sitio web"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-gray-600 mb-1">Descripción</p>
            <p className="text-sm text-gray-900">
              {empresa.descripcion || "Sin descripción"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Estado</p>
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                empresa.habilitado
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {empresa.habilitado ? (
                <>
                  <CheckCircle className="w-3 h-3" />
                  Habilitada
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3" />
                  Inhabilitada
                </>
              )}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Validación</p>
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                empresa.validada
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {empresa.validada ? (
                <>
                  <ShieldCheck className="w-3 h-3" />
                  Validada
                </>
              ) : (
                <>
                  <ShieldX className="w-3 h-3" />
                  No validada
                </>
              )}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Fecha de Registro
            </p>
            <p className="text-sm text-gray-900">
              {new Date(empresa.created_at).toLocaleDateString("es-CL")}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">
              Última Modificación
            </p>
            <p className="text-sm text-gray-900">
              {new Date(empresa.updated_at).toLocaleDateString("es-CL")}
            </p>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
