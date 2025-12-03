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
  Users,
  Search,
  Loader2,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Shield,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  X,
} from "lucide-react";

interface Usuario {
  id: number;
  usuario_id: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string | null;
  rut: string;
  region_id: number | null;
  ciudad_id: number | null;
  ciudad: string | null;
  rol: string;
  habilitado: boolean;
  created_at: string;
}

interface ModalData {
  type: "view" | "edit" | "delete" | null;
  usuario: Usuario | null;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [modal, setModal] = useState<ModalData>({ type: null, usuario: null });
  const [editForm, setEditForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    rol: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const lastLoadTime = useRef<number>(0);
  const CACHE_DURATION = 30000;

  useEffect(() => {
    checkAdmin();
  }, []);

  const filteredUsers = useMemo(() => {
    let filtered = users;
    if (searchTerm) {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (u) =>
          (u.nombre || "").toLowerCase().includes(term) ||
          (u.apellido || "").toLowerCase().includes(term) ||
          (u.correo || "").toLowerCase().includes(term) ||
          (u.rut || "").toLowerCase().includes(term)
      );
    }
    if (filterRole !== "all") {
      filtered = filtered.filter((u) => u.rol === filterRole);
    }
    return filtered;
  }, [users, searchTerm, filterRole]);

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

      await loadUsers();
    } catch (error) {
      console.error("Error:", error);
      setError("Error al verificar acceso");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const now = Date.now();
      if (now - lastLoadTime.current < CACHE_DURATION && users.length > 0) {
        return;
      }

      const { data: usuariosData, error: usuariosError } = await supabase
        .from("usuario")
        .select("*")
        .order("created_at", { ascending: false });

      if (usuariosError) throw usuariosError;

      const { data: ciudadesData, error: ciudadesError } = await supabase
        .from("ciudad")
        .select("id, nombre_ciudad");

      if (ciudadesError) throw ciudadesError;

      const ciudadesMap = new Map(
        (ciudadesData || []).map((c) => [c.id, c.nombre_ciudad])
      );

      const mapped: Usuario[] = (usuariosData || []).map((u) => ({
        ...u,
        ciudad: u.ciudad_id ? ciudadesMap.get(u.ciudad_id) || null : null,
      }));

      setUsers(mapped);
      lastLoadTime.current = now;
      setError("");
    } catch (error: any) {
      console.error("Error loading users:", error?.message || error);
      setError("Error al cargar usuarios");
    }
  };

  const handleToggleStatus = useCallback(async (usuario: Usuario) => {
    setSaving(true);
    try {
      const newStatus = !usuario.habilitado;
      const { error } = await supabase
        .from("usuario")
        .update({ habilitado: newStatus })
        .eq("id", usuario.id);
      if (error) throw error;
      setUsers((prev) =>
        prev.map((u) =>
          u.id === usuario.id ? { ...u, habilitado: newStatus } : u
        )
      );
      setError("");
    } catch (error) {
      console.error("Error toggling status:", error);
      setError("Error al cambiar el estado del usuario");
    } finally {
      setSaving(false);
    }
  }, []);

  const openEditModal = useCallback((usuario: Usuario) => {
    setEditForm({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      telefono: usuario.telefono || "",
      rol: usuario.rol,
    });
    setModal({ type: "edit", usuario });
  }, []);

  const handleEdit = useCallback(async () => {
    if (!modal.usuario) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("usuario")
        .update({
          nombre: editForm.nombre.trim(),
          apellido: editForm.apellido.trim(),
          telefono: editForm.telefono?.trim() || null,
          rol: editForm.rol,
        })
        .eq("id", modal.usuario.id);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === modal.usuario!.id
            ? {
                ...u,
                nombre: editForm.nombre,
                apellido: editForm.apellido,
                telefono: editForm.telefono || null,
                rol: editForm.rol,
              }
            : u
        )
      );
      setModal({ type: null, usuario: null });
      setError("");
    } catch (error: any) {
      console.error("Error updating user:", error?.message || error);
      setError("Error al actualizar el usuario");
    } finally {
      setSaving(false);
    }
  }, [modal.usuario, editForm]);

  const handleDelete = useCallback(async () => {
    if (!modal.usuario) return;
    setSaving(true);
    try {
      const { data: vehiculos } = await supabase
        .from("vehiculo")
        .select("id")
        .eq("usuario_id", modal.usuario.id);

      if (vehiculos && vehiculos.length > 0) {
        const vehiculoIds = vehiculos.map((v) => v.id);
        await supabase.from("calificacion").delete().in("vehiculo_id", vehiculoIds);
      }

      await supabase.from("vehiculo").delete().eq("usuario_id", modal.usuario.id);

      if (modal.usuario.usuario_id) {
        try {
          await supabase.auth.admin.deleteUser(modal.usuario.usuario_id);
        } catch (authError: any) {
          console.warn("No se pudo eliminar de auth:", authError?.message);
        }
      }

      await supabase.from("usuario").delete().eq("id", modal.usuario.id);

      setUsers((prev) => prev.filter((u) => u.id !== modal.usuario!.id));
      setModal({ type: null, usuario: null });
      setError("");
    } catch (error: any) {
      console.error("Error deleting user:", error?.message || error);
      setError("Error al eliminar el usuario");
    } finally {
      setSaving(false);
    }
  }, [modal.usuario]);

  const closeModal = useCallback(() => {
    setModal({ type: null, usuario: null });
    setError("");
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
              <Users className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestión de Usuarios
              </h1>
              <p className="text-sm text-gray-500">
                {users.length} usuarios registrados
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
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
            >
              <option value="all">Todos los roles</option>
              <option value="usuario">Usuario</option>
              <option value="administrador">Administrador</option>
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
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Correo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    RUT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Rol
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
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">
                        No se encontraron usuarios
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((usuario) => (
                    <tr
                      key={usuario.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-900">
                          {usuario.nombre} {usuario.apellido}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{usuario.correo}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {usuario.rut}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">
                          {usuario.telefono || "Sin teléfono"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {usuario.ciudad || "Sin ciudad"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                            usuario.rol === "administrador"
                              ? "bg-amber-100 text-amber-700 border border-amber-200"
                              : "bg-blue-100 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {usuario.rol === "administrador" && (
                            <Shield className="w-3 h-3" />
                          )}
                          {usuario.rol}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(usuario)}
                          disabled={saving}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 ${
                            usuario.habilitado
                              ? "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200"
                              : "bg-red-100 text-red-700 border border-red-200 hover:bg-red-200"
                          }`}
                        >
                          {usuario.habilitado ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Activo
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              Inactivo
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setModal({ type: "view", usuario })}
                            className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(usuario)}
                            className="p-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setModal({ type: "delete", usuario })}
                            className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
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
          {filteredUsers.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                No se encontraron usuarios
              </p>
            </div>
          ) : (
            filteredUsers.map((usuario) => (
              <div
                key={usuario.id}
                className="bg-white rounded-xl border border-gray-100 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">
                      {usuario.nombre} {usuario.apellido}
                    </h3>
                    <p className="text-xs text-gray-600 mb-1">{usuario.correo}</p>
                    <p className="text-xs text-gray-500">RUT: {usuario.rut}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-semibold flex-shrink-0 ${
                      usuario.rol === "administrador"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {usuario.rol}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    {usuario.telefono || "Sin teléfono"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {usuario.ciudad || "Sin ciudad"}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleToggleStatus(usuario)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                      usuario.habilitado
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {usuario.habilitado ? "Activo" : "Inactivo"}
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setModal({ type: "view", usuario })}
                      className="p-1.5 bg-blue-100 text-blue-700 rounded-lg"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(usuario)}
                      className="p-1.5 bg-yellow-100 text-yellow-700 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setModal({ type: "delete", usuario })}
                      className="p-1.5 bg-red-100 text-red-700 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modals */}
      {modal.type === "view" && modal.usuario && (
        <ModalDetalles usuario={modal.usuario} onClose={closeModal} />
      )}

      {modal.type === "edit" && modal.usuario && (
        <ModalEditar
          usuario={modal.usuario}
          editForm={editForm}
          setEditForm={setEditForm}
          onSave={handleEdit}
          onClose={closeModal}
          saving={saving}
        />
      )}

      {modal.type === "delete" && modal.usuario && (
        <ModalEliminar
          usuario={modal.usuario}
          onConfirm={handleDelete}
          onClose={closeModal}
          saving={saving}
        />
      )}
    </div>
  );
}

// Modales actualizados con estilos minimalistas

interface ModalDetallesProps {
  usuario: Usuario;
  onClose: () => void;
}

function ModalDetalles({ usuario, onClose }: ModalDetallesProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Detalles del Usuario
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
              Nombre Completo
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {usuario.nombre} {usuario.apellido}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">RUT</p>
            <p className="text-sm font-semibold text-gray-900">{usuario.rut}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Email
            </p>
            <p className="text-sm text-gray-900 break-all">{usuario.correo}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> Teléfono
            </p>
            <p className="text-sm text-gray-900">
              {usuario.telefono || "No especificado"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Ciudad
            </p>
            <p className="text-sm text-gray-900">
              {usuario.ciudad || "No especificado"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Rol</p>
            <p className="text-sm font-semibold text-gray-900">{usuario.rol}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Registro
            </p>
            <p className="text-sm text-gray-900">
              {new Date(usuario.created_at).toLocaleDateString("es-CL")}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Estado</p>
            <p className="text-sm font-semibold text-gray-900">
              {usuario.habilitado ? "Activo" : "Inactivo"}
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

interface ModalEditarProps {
  usuario: Usuario;
  editForm: any;
  setEditForm: (form: any) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
}

function ModalEditar({
  usuario,
  editForm,
  setEditForm,
  onSave,
  onClose,
  saving,
}: ModalEditarProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Editar Usuario</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Nombre
            </label>
            <input
              type="text"
              value={editForm.nombre}
              onChange={(e) =>
                setEditForm({ ...editForm, nombre: e.target.value })
              }
              disabled={saving}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50 disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Apellido
            </label>
            <input
              type="text"
              value={editForm.apellido}
              onChange={(e) =>
                setEditForm({ ...editForm, apellido: e.target.value })
              }
              disabled={saving}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50 disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="text"
              value={editForm.telefono}
              onChange={(e) =>
                setEditForm({ ...editForm, telefono: e.target.value })
              }
              disabled={saving}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50 disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Rol
            </label>
            <select
              value={editForm.rol}
              onChange={(e) =>
                setEditForm({ ...editForm, rol: e.target.value })
              }
              disabled={saving}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50 disabled:bg-gray-50"
            >
              <option value="usuario">Usuario</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>
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
            onClick={onSave}
            disabled={saving}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ModalEliminarProps {
  usuario: Usuario;
  onConfirm: () => void;
  onClose: () => void;
  saving: boolean;
}

function ModalEliminar({
  usuario,
  onConfirm,
  onClose,
  saving,
}: ModalEliminarProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Confirmar Eliminación
        </h2>
        <p className="text-sm text-gray-700 mb-6">
          ¿Estás seguro de que quieres eliminar a{" "}
          <span className="font-semibold text-gray-900">
            {usuario.nombre} {usuario.apellido}
          </span>
          ? Esta acción no se puede deshacer.
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
            className="px-6 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
