"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
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
  Ban,
  ShieldCheck,
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
  type: "view" | "delete" | null;
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
      await loadEmpresas();
    } catch (error) {
      setError("Error al verificar acceso");
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

  // Cambiar estado habilitado/inhabilitado
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
          <a
            href="/admin/profile"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al Panel
          </a>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-slate-700">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-500" />
              Gestión de Empresas
            </h1>
            <p className="text-slate-400 mt-2">
              Total: {empresas.length} empresas registradas
            </p>
          </div>
        </div>
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-slate-700 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, RUT o representante..."
              className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Empresa
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    RUT
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Contacto
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Representante
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredEmpresas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <p className="text-slate-400">
                        No se encontraron empresas
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredEmpresas.map((empresa) => (
                    <tr
                      key={empresa.id}
                      className="hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-semibold">
                            {empresa.nombre_comercial}
                          </p>
                          <p className="text-sm text-slate-400">
                            {empresa.correo_electronico}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {empresa.rut_empresa}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-300 text-sm">
                          {empresa.telefono || "Sin teléfono"}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {empresa.direccion || "Sin dirección"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {empresa.representante_legal || "Sin representante"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleHabilitado(empresa)}
                          disabled={saving}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 
                            ${empresa.habilitado ? "bg-green-600 text-white hover:bg-green-700" : "bg-red-600 text-white hover:bg-red-700"}
                          `}
                          title={empresa.habilitado ? "Deshabilitar" : "Habilitar"}
                        >
                          {saving && (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          )}
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
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setModal({ type: "view", empresa })}
                            disabled={saving}
                            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4 text-white" />
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
      </div>
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

function ModalDetallesEmpresa({ empresa, onClose }: ModalDetallesEmpresaProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-6">
          Detalles de la Empresa
        </h2>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Nombre Comercial</p>
              <p className="text-white font-semibold">
                {empresa.nombre_comercial}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">RUT Empresa</p>
              <p className="text-white font-semibold">{empresa.rut_empresa}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Correo Electrónico</p>
              <p className="text-white">{empresa.correo_electronico || "Sin correo"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Teléfono</p>
              <p className="text-white">{empresa.telefono || "Sin teléfono"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Dirección</p>
              <p className="text-white">{empresa.direccion || "Sin dirección"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Representante Legal</p>
              <p className="text-white">{empresa.representante_legal || "Sin representante"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Sitio Web</p>
              <p className="text-white">{empresa.sitio_web || "Sin sitio web"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Descripción</p>
              <p className="text-white">{empresa.descripcion || "Sin descripción"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Estado</p>
              <p className="text-white font-semibold">
                {empresa.habilitado ? "Habilitada" : "Inhabilitada"}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Validada</p>
              <p className="text-white font-semibold">
                {empresa.validada ? "Validada" : "No validada"}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Fecha de Registro</p>
              <p className="text-white">
                {new Date(empresa.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Última Modificación</p>
              <p className="text-white">
                {new Date(empresa.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
