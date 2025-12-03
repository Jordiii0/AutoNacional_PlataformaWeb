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
  Car,
  Search,
  Loader2,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Building2,
  User,
  X,
  EyeOff,
} from "lucide-react";

interface Vehicle {
  id: number;
  marca: string;
  modelo: string;
  anio: number;
  precio: number;
  kilometraje: number;
  tipo_combustible_id: number;
  transmision: string;
  color: string;
  oculto: boolean;
  correo: string;
  usuario_id?: number;
  empresa_id?: number;
  created_at: string;
  tipo_combustible?: { nombre_combustible: string };
  imagen_vehiculo?: Array<{ url_imagen: string }>;
  usuario?: {
    id: string;
    nombre: string;
    apellido: string;
    correo: string;
    telefono: string;
  };
  empresa?: {
    id: number;
    nombre_comercial: string;
    correo_electronico: string;
    telefono: string;
  };
  dueno_nombre?: string;
  dueno_correo?: string;
  dueno_telefono?: string;
  dueno_tipo?: "usuario" | "empresa";
}

interface ModalData {
  type: "view" | "delete" | null;
  vehicle: Vehicle | null;
}

export default function AdminVehiclesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "visible" | "hidden">("all");
  const [modal, setModal] = useState<ModalData>({ type: null, vehicle: null });
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const lastLoadTime = useRef<number>(0);
  const CACHE_DURATION = 30000;

  useEffect(() => {
    checkAdmin();
  }, []);

  const filteredVehicles = useMemo(() => {
    let filtered = vehicles;
    if (filterStatus === "visible") {
      filtered = filtered.filter((v) => !v.oculto);
    } else if (filterStatus === "hidden") {
      filtered = filtered.filter((v) => v.oculto);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.marca?.toLowerCase().includes(term) ||
          v.modelo?.toLowerCase().includes(term) ||
          v.correo?.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [vehicles, filterStatus, searchTerm]);

  const stats = useMemo(
    () => ({
      total: vehicles.length,
      visible: vehicles.filter((v) => !v.oculto).length,
      hidden: vehicles.filter((v) => v.oculto).length,
    }),
    [vehicles]
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
      const { data: userData, error: userError } = await supabase
        .from("usuario")
        .select("rol")
        .eq("id", session.user.id)
        .single();

      if (userError || !userData || userData.rol !== "administrador") {
        router.push("/");
        return;
      }
      await loadVehicles();
    } catch (error) {
      console.error("Error:", error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = useCallback(async () => {
    try {
      const now = Date.now();
      if (now - lastLoadTime.current < CACHE_DURATION && vehicles.length > 0) {
        return;
      }

      const { data: vehiculos, error } = await supabase
        .from("vehiculo")
        .select(
          `
        *,
        tipo_combustible:tipo_combustible_id (nombre_combustible),
        usuario:usuario_id (
          id,
          nombre,
          apellido,
          correo,
          telefono
        ),
        empresa:empresa_id (
          id,
          nombre_comercial,
          correo_electronico,
          telefono
        )
      `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const vehiclesWithImages = await Promise.all(
        (vehiculos || []).map(async (v: any) => {
          const { data: imagenes } = await supabase
            .from("imagen_vehiculo")
            .select("url_imagen")
            .eq("vehiculo_id", v.id);

          let dueno_nombre = "No especificado";
          let dueno_correo = "No especificado";
          let dueno_telefono = "No especificado";
          let dueno_tipo = "usuario";

          if (v.empresa) {
            dueno_nombre = v.empresa.nombre_comercial;
            dueno_correo = v.empresa.correo_electronico;
            dueno_telefono = v.empresa.telefono;
            dueno_tipo = "empresa";
          } else if (v.usuario) {
            dueno_nombre = `${v.usuario.nombre} ${v.usuario.apellido}`;
            dueno_correo = v.usuario.correo;
            dueno_telefono = v.usuario.telefono;
            dueno_tipo = "usuario";
          }

          return {
            ...v,
            imagen_vehiculo: imagenes || [],
            dueno_nombre,
            dueno_correo,
            dueno_telefono,
            dueno_tipo,
          };
        })
      );

      setVehicles(vehiclesWithImages);
      lastLoadTime.current = now;
      setError("");
    } catch (error) {
      console.error("Error loading vehicles:", error);
      setError("Error al cargar vehículos");
      setVehicles([]);
    }
  }, [vehicles.length]);

  const handleToggleVisibility = useCallback(async (vehicle: Vehicle) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("vehiculo")
        .update({ oculto: !vehicle.oculto })
        .eq("id", vehicle.id);

      if (error) throw error;

      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicle.id ? { ...v, oculto: !v.oculto } : v))
      );
      setError("");
    } catch (error) {
      console.error("Error toggling visibility:", error);
      setError("Error al cambiar la visibilidad");
    } finally {
      setSaving(false);
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (!modal.vehicle) return;
    setSaving(true);
    try {
      if (modal.vehicle.imagen_vehiculo && modal.vehicle.imagen_vehiculo.length > 0) {
        const filePaths = modal.vehicle.imagen_vehiculo.map((img) => {
          const url = img.url_imagen;
          const path = url.split("/storage/v1/object/public/vehiculo_imagen/")[1];
          return path;
        });
        await supabase.storage.from("vehiculo_imagen").remove(filePaths);
      }

      await supabase.from("imagen_vehiculo").delete().eq("vehiculo_id", modal.vehicle.id);
      await supabase.from("usuario_vehiculo").delete().eq("vehiculo_id", modal.vehicle.id);
      await supabase.from("calificacion").delete().eq("vehiculo_id", modal.vehicle.id);
      await supabase.from("vehiculo").delete().eq("id", modal.vehicle.id);

      setVehicles((prev) => prev.filter((v) => v.id !== modal.vehicle!.id));
      setModal({ type: null, vehicle: null });
      setError("");
    } catch (error: any) {
      console.error("Error deleting vehicle:", error);
      setError("Error al eliminar el vehículo");
    } finally {
      setSaving(false);
    }
  }, [modal.vehicle]);

  const closeModal = useCallback(() => {
    setModal({ type: null, vehicle: null });
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
              <Car className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestión de Vehículos
              </h1>
              <p className="text-sm text-gray-500">
                {stats.total} vehículos publicados
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
              <Car className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                {stats.total}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">Total</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                {stats.visible}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">Visibles</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <EyeOff className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                {stats.hidden}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">Ocultos</p>
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
                placeholder="Buscar por marca, modelo..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
            >
              <option value="all">Todos los vehículos</option>
              <option value="visible">Visibles</option>
              <option value="hidden">Ocultos</option>
            </select>
          </div>
        </div>

        {/* Lista de Vehículos */}
        <div className="space-y-3">
          {filteredVehicles.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No se encontraron vehículos
              </h3>
              <p className="text-gray-500 text-sm">
                {filterStatus === "hidden"
                  ? "No hay vehículos ocultos"
                  : "No hay vehículos publicados"}
              </p>
            </div>
          ) : (
            filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-300 transition-all"
              >
                {/* Header del vehículo */}
                <div
                  className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() =>
                    setExpandedId(expandedId === vehicle.id ? null : vehicle.id)
                  }
                >
                  {/* Imagen */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    {vehicle.imagen_vehiculo && vehicle.imagen_vehiculo.length > 0 ? (
                      <img
                        src={vehicle.imagen_vehiculo[0].url_imagen}
                        alt={`${vehicle.marca} ${vehicle.modelo}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                        {vehicle.marca} {vehicle.modelo}
                      </h3>
                      {vehicle.oculto && (
                        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 flex-shrink-0">
                          <EyeOff className="w-3 h-3" />
                          Oculto
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      <span>{vehicle.anio}</span>
                      <span>${vehicle.precio.toLocaleString()}</span>
                      <span className="hidden sm:inline">
                        {vehicle.kilometraje.toLocaleString()} km
                      </span>
                    </div>
                  </div>

                  {/* Acciones Desktop */}
                  <div className="hidden sm:flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModal({ type: "view", vehicle });
                      }}
                      className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleVisibility(vehicle);
                      }}
                      disabled={saving}
                      className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                        vehicle.oculto
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                      }`}
                      title={vehicle.oculto ? "Mostrar" : "Ocultar"}
                    >
                      {vehicle.oculto ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModal({ type: "delete", vehicle });
                      }}
                      disabled={saving}
                      className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      {expandedId === vehicle.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Toggle Mobile */}
                  <button className="sm:hidden p-2 text-gray-400">
                    {expandedId === vehicle.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Detalles expandidos */}
                {expandedId === vehicle.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Año</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {vehicle.anio}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Precio</p>
                        <p className="text-sm font-semibold text-gray-900">
                          ${vehicle.precio.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Kilometraje</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {vehicle.kilometraje.toLocaleString()} km
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Combustible</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {vehicle.tipo_combustible?.nombre_combustible || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Transmisión</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {vehicle.transmision || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Dueño</p>
                        <div className="flex items-center gap-1.5">
                          {vehicle.dueno_tipo === "empresa" ? (
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-green-600" />
                          )}
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {vehicle.dueno_nombre}
                          </p>
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                          {vehicle.dueno_correo}
                        </p>
                      </div>
                    </div>

                    {/* Acciones Mobile */}
                    <div className="sm:hidden flex gap-2 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => setModal({ type: "view", vehicle })}
                        className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => handleToggleVisibility(vehicle)}
                        disabled={saving}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                          vehicle.oculto
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {vehicle.oculto ? "Mostrar" : "Ocultar"}
                      </button>
                      <button
                        onClick={() => setModal({ type: "delete", vehicle })}
                        disabled={saving}
                        className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    </div>

                    {/* Galería */}
                    {vehicle.imagen_vehiculo && vehicle.imagen_vehiculo.length > 1 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-600 mb-3">Imágenes</p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {vehicle.imagen_vehiculo.map((img, idx) => (
                            <img
                              key={idx}
                              src={img.url_imagen}
                              alt={`Imagen ${idx + 1}`}
                              className="w-full h-16 sm:h-20 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modals */}
      {modal.type === "view" && modal.vehicle && (
        <ModalDetalles vehicle={modal.vehicle} onClose={closeModal} />
      )}

      {modal.type === "delete" && modal.vehicle && (
        <ModalEliminar
          vehicle={modal.vehicle}
          onConfirm={handleDelete}
          onClose={closeModal}
          saving={saving}
        />
      )}
    </div>
  );
}

// Modales actualizados

interface ModalDetallesProps {
  vehicle: Vehicle;
  onClose: () => void;
}

function ModalDetalles({ vehicle, onClose }: ModalDetallesProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-gray-100 shadow-xl max-w-3xl w-full p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Detalles del Vehículo
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {vehicle.imagen_vehiculo && vehicle.imagen_vehiculo.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {vehicle.imagen_vehiculo.map((img, idx) => (
              <img
                key={idx}
                src={img.url_imagen}
                alt={`Imagen ${idx + 1}`}
                className="w-full h-40 sm:h-48 object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">
              Marca y Modelo
            </p>
            <p className="text-sm font-bold text-gray-900">
              {vehicle.marca} {vehicle.modelo}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Año</p>
            <p className="text-sm font-semibold text-gray-900">{vehicle.anio}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Precio</p>
            <p className="text-sm font-semibold text-gray-900">
              ${vehicle.precio.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Kilometraje</p>
            <p className="text-sm font-semibold text-gray-900">
              {vehicle.kilometraje.toLocaleString()} km
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Combustible</p>
            <p className="text-sm font-semibold text-gray-900">
              {vehicle.tipo_combustible?.nombre_combustible || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Transmisión</p>
            <p className="text-sm font-semibold text-gray-900">
              {vehicle.transmision || "N/A"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-gray-600 mb-1">Dueño</p>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-gray-900">
                {vehicle.dueno_nombre}
              </p>
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  vehicle.dueno_tipo === "empresa"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {vehicle.dueno_tipo === "empresa" ? "Empresa" : "Usuario"}
              </span>
            </div>
            <p className="text-sm text-gray-700">{vehicle.dueno_correo}</p>
            {vehicle.dueno_telefono && vehicle.dueno_telefono !== "No especificado" && (
              <p className="text-sm text-gray-700">{vehicle.dueno_telefono}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Estado</p>
            <span
              className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                vehicle.oculto
                  ? "bg-orange-100 text-orange-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {vehicle.oculto ? "Oculto" : "Visible"}
            </span>
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

interface ModalEliminarProps {
  vehicle: Vehicle;
  onConfirm: () => void;
  onClose: () => void;
  saving: boolean;
}

function ModalEliminar({ vehicle, onConfirm, onClose, saving }: ModalEliminarProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Confirmar Eliminación
        </h2>
        <p className="text-sm text-gray-700 mb-6">
          ¿Estás seguro de que quieres eliminar el vehículo{" "}
          <span className="font-semibold text-gray-900">
            {vehicle.marca} {vehicle.modelo} {vehicle.anio}
          </span>
          ? Esta acción no se puede deshacer y eliminará todas las imágenes
          asociadas.
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
