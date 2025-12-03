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
  Building2,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Shield,
  AlertCircle,
  Clock,
  X,
} from "lucide-react";

interface Empresa {
  id: number;
  usuario_id: string;
  nombre_comercial: string;
  rut_empresa: string;
  correo_electronico: string;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  sitio_web: string | null;
  validada: boolean;
  created_at: string;
}

interface ModalData {
  type: "view" | "approve" | "reject" | null;
  empresa: Empresa | null;
}

export default function ValidationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<Empresa[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"pending" | "validated" | "all">("pending");
  const [modal, setModal] = useState<ModalData>({ type: null, empresa: null });
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState("");

  const lastLoadTime = useRef<number>(0);
  const CACHE_DURATION = 30000;

  useEffect(() => {
    checkAdmin();
  }, []);

  const filteredCompanies = useMemo(() => {
    let filtered = companies;

    if (filterStatus === "pending") {
      filtered = filtered.filter((c) => !c.validada);
    } else if (filterStatus === "validated") {
      filtered = filtered.filter((c) => c.validada);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.nombre_comercial.toLowerCase().includes(term) ||
          c.correo_electronico.toLowerCase().includes(term) ||
          c.rut_empresa.includes(term)
      );
    }

    return filtered;
  }, [companies, filterStatus, searchTerm]);

  const stats = useMemo(
    () => ({
      pending: companies.filter((c) => !c.validada).length,
      validated: companies.filter((c) => c.validada).length,
      total: companies.length,
    }),
    [companies]
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

      await loadCompanies();
    } catch (error) {
      console.error("Error:", error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = useCallback(async () => {
    try {
      const now = Date.now();

      if (now - lastLoadTime.current < CACHE_DURATION && companies.length > 0) {
        return;
      }

      const { data, error } = await supabase
        .from("empresa")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
      lastLoadTime.current = now;
      setError("");
    } catch (error) {
      console.error("Error loading companies:", error);
      setError("Error al cargar empresas");
    }
  }, [companies.length]);

  const handleApprove = useCallback(async () => {
    if (!modal.empresa) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("empresa")
        .update({ validada: true })
        .eq("id", modal.empresa.id);

      if (error) throw error;

      setCompanies((prev) =>
        prev.map((e) =>
          e.id === modal.empresa!.id ? { ...e, validada: true } : e
        )
      );

      setModal({ type: null, empresa: null });
      setError("");
    } catch (error) {
      console.error("Error approving company:", error);
      setError("Error al aprobar la empresa");
    } finally {
      setSaving(false);
    }
  }, [modal.empresa]);

  const handleReject = useCallback(async () => {
    if (!modal.empresa) return;

    setSaving(true);
    try {
      try {
        await supabase.auth.admin.deleteUser(modal.empresa.usuario_id);
      } catch (authError) {
        console.warn("⚠️ No se pudo eliminar de auth:", authError);
      }

      const { error } = await supabase
        .from("empresa")
        .delete()
        .eq("id", modal.empresa.id);

      if (error) throw error;

      if (rejectReason.trim()) {
        try {
          await supabase.from("empresa_rechazos").insert({
            empresa_nombre: modal.empresa.nombre_comercial,
            empresa_rut: modal.empresa.rut_empresa,
            correo: modal.empresa.correo_electronico,
            motivo: rejectReason,
            rechazado_el: new Date().toISOString(),
          });
        } catch (logError) {
          console.warn("⚠️ No se pudo guardar log del rechazo:", logError);
        }
      }

      setCompanies((prev) => prev.filter((e) => e.id !== modal.empresa!.id));

      setModal({ type: null, empresa: null });
      setRejectReason("");
      setError("");
    } catch (error) {
      console.error("Error rejecting company:", error);
      setError("Error al rechazar la empresa");
    } finally {
      setSaving(false);
    }
  }, [modal.empresa, rejectReason]);

  const closeModal = useCallback(() => {
    setModal({ type: null, empresa: null });
    setRejectReason("");
  }, []);

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
              <Shield className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Validación de Empresas
              </h1>
              <p className="text-sm text-gray-500">
                Revisa y aprueba empresas que desean registrarse
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
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                {stats.pending}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">
              Pendientes
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                {stats.validated}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">
              Validadas
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                {stats.total}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">Total</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
          <div className="grid sm:grid-cols-2 gap-3">
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

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
            >
              <option value="pending">Pendientes de validación</option>
              <option value="validated">Validadas</option>
              <option value="all">Todas</option>
            </select>
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
                    Fecha Registro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">
                        {filterStatus === "pending"
                          ? "No hay empresas pendientes de validación"
                          : "No se encontraron empresas"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((empresa) => (
                    <tr
                      key={empresa.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                            {empresa.nombre_comercial}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {empresa.correo_electronico}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                        {empresa.rut_empresa}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">
                          {empresa.telefono || "—"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {empresa.ciudad || "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(empresa.created_at).toLocaleDateString("es-CL")}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                            empresa.validada
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-amber-100 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {empresa.validada ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Validada
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              Pendiente
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setModal({ type: "view", empresa })}
                            disabled={saving}
                            className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors disabled:opacity-50"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {!empresa.validada && (
                            <>
                              <button
                                onClick={() =>
                                  setModal({ type: "approve", empresa })
                                }
                                disabled={saving}
                                className="p-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors disabled:opacity-50"
                                title="Aprobar"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setModal({ type: "reject", empresa })
                                }
                                disabled={saving}
                                className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
                                title="Rechazar"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
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
          {filteredCompanies.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {filterStatus === "pending"
                  ? "No hay empresas pendientes de validación"
                  : "No se encontraron empresas"}
              </p>
            </div>
          ) : (
            filteredCompanies.map((empresa) => (
              <div
                key={empresa.id}
                className="bg-white rounded-xl border border-gray-100 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      {empresa.nombre_comercial}
                    </h3>
                    <p className="text-xs text-gray-600 mb-1">
                      RUT: {empresa.rut_empresa}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {empresa.correo_electronico}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${
                      empresa.validada
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {empresa.validada ? "Validada" : "Pendiente"}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    {empresa.telefono || "Sin teléfono"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {empresa.ciudad || "Sin ciudad"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(empresa.created_at).toLocaleDateString("es-CL")}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setModal({ type: "view", empresa })}
                    className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
                  >
                    Ver
                  </button>
                  {!empresa.validada && (
                    <>
                      <button
                        onClick={() => setModal({ type: "approve", empresa })}
                        disabled={saving}
                        className="flex-1 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium disabled:opacity-50"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => setModal({ type: "reject", empresa })}
                        disabled={saving}
                        className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modals */}
      {modal.type === "view" && modal.empresa && (
        <ModalDetalles
          empresa={modal.empresa}
          onClose={closeModal}
          onApprove={() => setModal({ type: "approve", empresa: modal.empresa })}
          onReject={() => setModal({ type: "reject", empresa: modal.empresa })}
        />
      )}

      {modal.type === "approve" && modal.empresa && (
        <ModalAprobar
          empresa={modal.empresa}
          onConfirm={handleApprove}
          onClose={closeModal}
          saving={saving}
        />
      )}

      {modal.type === "reject" && modal.empresa && (
        <ModalRechazar
          empresa={modal.empresa}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          onConfirm={handleReject}
          onClose={closeModal}
          saving={saving}
        />
      )}
    </div>
  );
}

// Modales actualizados

interface ModalDetallesProps {
  empresa: Empresa;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

function ModalDetalles({
  empresa,
  onClose,
  onApprove,
  onReject,
}: ModalDetallesProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-purple-600" />
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
            <p className="text-xs font-medium text-gray-600 mb-1">Nombre</p>
            <p className="text-sm font-bold text-gray-900">
              {empresa.nombre_comercial}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">RUT</p>
            <p className="text-sm font-semibold text-gray-900 font-mono">
              {empresa.rut_empresa}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Email
            </p>
            <p className="text-sm text-gray-900 break-all">
              {empresa.correo_electronico}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> Teléfono
            </p>
            <p className="text-sm text-gray-900">
              {empresa.telefono || "No especificado"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Ciudad
            </p>
            <p className="text-sm text-gray-900">
              {empresa.ciudad || "No especificado"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> Sitio Web
            </p>
            {empresa.sitio_web ? (
              <a
                href={empresa.sitio_web}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline break-all"
              >
                {empresa.sitio_web}
              </a>
            ) : (
              <p className="text-sm text-gray-900">No especificado</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-gray-600 mb-1">Dirección</p>
            <p className="text-sm text-gray-900">
              {empresa.direccion || "No especificado"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Registro
            </p>
            <p className="text-sm text-gray-900">
              {new Date(empresa.created_at).toLocaleDateString("es-CL")}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Estado</p>
            <span
              className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                empresa.validada
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {empresa.validada ? "Validada" : "Pendiente"}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
          {!empresa.validada && (
            <>
              <button
                onClick={onApprove}
                className="px-6 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Aprobar
              </button>
              <button
                onClick={onReject}
                className="px-6 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Rechazar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface ModalAprobarProps {
  empresa: Empresa;
  onConfirm: () => void;
  onClose: () => void;
  saving: boolean;
}

function ModalAprobar({
  empresa,
  onConfirm,
  onClose,
  saving,
}: ModalAprobarProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-green-600" />
          Aprobar Empresa
        </h2>
        <p className="text-sm text-gray-700 mb-6">
          ¿Estás seguro de que quieres aprobar a{" "}
          <span className="font-semibold text-gray-900">
            {empresa.nombre_comercial}
          </span>
          ? La empresa podrá acceder a todas las funcionalidades.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="px-6 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Aprobando...
              </>
            ) : (
              "Aprobar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ModalRechazarProps {
  empresa: Empresa;
  rejectReason: string;
  setRejectReason: (reason: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  saving: boolean;
}

function ModalRechazar({
  empresa,
  rejectReason,
  setRejectReason,
  onConfirm,
  onClose,
  saving,
}: ModalRechazarProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <XCircle className="w-6 h-6 text-red-600" />
          Rechazar Empresa
        </h2>
        <p className="text-sm text-gray-700 mb-4">
          ¿Estás seguro de que quieres rechazar a{" "}
          <span className="font-semibold text-gray-900">
            {empresa.nombre_comercial}
          </span>
          ? Esta acción eliminará permanentemente el registro.
        </p>
        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Motivo del rechazo (opcional)
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Explica el motivo del rechazo..."
            rows={3}
            disabled={saving}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50 disabled:bg-gray-50"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="px-6 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Rechazando...
              </>
            ) : (
              "Rechazar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
