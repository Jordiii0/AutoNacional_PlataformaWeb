"use client";

import { Car, Heart } from "lucide-react";
import ChartsPublicaciones from "./components/chartsPublicaciones";
import ChartsCalificaciones from "./components/chartsCalificaciones";
import ChartsVentas from "./components/chartsVentas";
import StatsCard from "./components/statsCard";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  Plus,
  Calendar,
  Gauge,
  AlertCircle,
  CheckCircle,
  MapPin,
  BarChart3,
  X,
} from "lucide-react";

interface Vehicle {
  id: number;
  precio: number;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number;
  transmision: string;
  tipo_combustible: string;
  estado_vehiculo: string;
  descripcion: string;
  cilindrada: string;
  tipo_vehiculo: string;
  region_id: number; // ✅ Cambio aquí
  ciudad_id: number; // ✅ Cambio aquí
  ciudad_nombre?: string; // ✅ Agregado
  region_nombre?: string; // ✅ Agregado
  created_at: string;
  oculto: boolean;
  usuario_id: string | null;
  empresa_id: string | null;
}

interface VehicleWithImages extends Vehicle {
  images: string[];
}

interface Message {
  type: "success" | "error";
  text: string;
}

export default function MyPostsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleWithImages[]>([]);
  const [deleteModal, setDeleteModal] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [regions, setRegions] = useState<Map<number, string>>(new Map());

  const [showCharts, setShowCharts] = useState(false);
  const [isBusiness, setIsBusiness] = useState<boolean>(false);
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndLoadPosts = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        router.push("/login");
        return;
      }

      setUser(session.user);

      let isEmpresa = false;
      let usuarioId = session.user.id;
      let empresaUUID: string | null = null;

      const { data: empresaData } = await supabase
        .from("empresa")
        .select("id")
        .eq("usuario_id", usuarioId)
        .maybeSingle();

      if (empresaData) {
        isEmpresa = true;
        empresaUUID = empresaData.id;
      }

      setIsBusiness(isEmpresa);
      setEmpresaId(empresaUUID);
      await loadVehicles(usuarioId);
      setLoading(false);
    };

    checkAuthAndLoadPosts();
  }, [router]);

  const loadVehicles = async (userAuthId: string) => {
    try {
      console.log("User Auth ID:", userAuthId);

      let isBusiness = false;
      let vehicleOwnerId: string = userAuthId;

      const { data: empresaData } = await supabase
        .from("empresa")
        .select("id")
        .eq("usuario_id", userAuthId)
        .maybeSingle();

      if (empresaData) {
        isBusiness = true;
        vehicleOwnerId = empresaData.id;
        console.log(
          "✅ Usuario es Empresa. ID de Empresa (UUID):",
          vehicleOwnerId
        );
      } else {
        console.log(
          "👤 Usuario Individual. ID de Usuario (UUID):",
          vehicleOwnerId
        );
      }

      // ✅ Cargar regiones
      const { data: regionesData } = await supabase
        .from("region")
        .select("id, nombre_region");

      const regionMap = new Map(
        regionesData?.map((r) => [r.id, r.nombre_region]) || []
      );
      setRegions(regionMap);

      // ✅ Cargar ciudades
      const { data: ciudadesData } = await supabase
        .from("ciudad")
        .select("id, nombre_ciudad");

      const ciudadMap = new Map(
        ciudadesData?.map((c) => [c.id, c.nombre_ciudad]) || []
      );

      const { data: combustibleData } = await supabase
        .from("tipo_combustible")
        .select("id, nombre_combustible");

      const { data: tipoVehiculoData } = await supabase
        .from("tipo_vehiculo")
        .select("id, nombre_tipo");

      let query = supabase.from("vehiculo").select("*");

      if (isBusiness) {
        query = query.eq("empresa_id", vehicleOwnerId).is("usuario_id", null);
      } else {
        query = query.eq("usuario_id", vehicleOwnerId).is("empresa_id", null);
      }

      const { data: vehiculosData, error: vError } = await query.order(
        "created_at",
        { ascending: false }
      );

      console.log("Vehículos Data:", vehiculosData);

      if (vError) throw vError;

      if (!vehiculosData || vehiculosData.length === 0) {
        console.log("No se encontraron vehículos para este usuario/empresa");
        setVehicles([]);
        return;
      }

      const vehiculosConImagenes = await Promise.all(
        vehiculosData.map(async (vehiculo) => {
          const { data: imagenesData } = await supabase
            .from("imagen_vehiculo")
            .select("url_imagen")
            .eq("vehiculo_id", vehiculo.id);

          const combustible = combustibleData?.find(
            (c) => c.id === vehiculo.tipo_combustible_id
          );

          const tipoVehiculo = tipoVehiculoData?.find(
            (t) => t.id === vehiculo.tipo_vehiculo_id
          );

          return {
            ...vehiculo,
            images: imagenesData?.map((img) => img.url_imagen) || [],
            tipo_combustible: combustible?.nombre_combustible || "Desconocido",
            tipo_vehiculo: tipoVehiculo?.nombre_tipo || "Desconocido",
            // ✅ Agregar nombres de ciudad y región
            ciudad_nombre: ciudadMap.get(vehiculo.ciudad_id) || "Desconocida",
            region_nombre: regionMap.get(vehiculo.region_id) || "Desconocida",
          } as VehicleWithImages;
        })
      );

      console.log("Vehículos con imágenes:", vehiculosConImagenes);
      setVehicles(vehiculosConImagenes);
    } catch (error: any) {
      console.error("Error loading vehicles:", error);
      setMessage({
        type: "error",
        text: "Error al cargar tus publicaciones",
      });
    }
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;

      const { error } = await supabase
        .from("vehiculo")
        .update({ oculto: newStatus })
        .eq("id", id);

      if (error) throw error;

      setVehicles(
        vehicles.map((v) => (v.id === id ? { ...v, oculto: newStatus } : v))
      );

      setMessage({
        type: "success",
        text: newStatus
          ? "Publicación oculta correctamente"
          : "Publicación visible nuevamente",
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Error toggling status:", error);
      setMessage({ type: "error", text: "Error al cambiar el estado" });
    }
  };

  const deleteVehicle = async (id: number) => {
    setDeleting(true);
    try {
      const { data: imagenesData } = await supabase
        .from("imagen_vehiculo")
        .select("url_imagen")
        .eq("vehiculo_id", id);

      if (imagenesData && imagenesData.length > 0) {
        for (const img of imagenesData) {
          const urlParts = img.url_imagen.split("/");
          const fileName = urlParts[urlParts.length - 1];

          if (fileName) {
            const { error: storageError } = await supabase.storage
              .from("vehiculo_imagen")
              .remove([fileName]);
            if (storageError) {
              console.warn(
                "Error al eliminar del storage:",
                storageError.message
              );
            }
          }
        }
      }

      await supabase.from("imagen_vehiculo").delete().eq("vehiculo_id", id);
      await supabase.from("usuario_vehiculo").delete().eq("vehiculo_id", id);

      const { error } = await supabase.from("vehiculo").delete().eq("id", id);

      if (error) throw error;

      setVehicles(vehicles.filter((v) => v.id !== id));
      setMessage({
        type: "success",
        text: "Vehículo eliminado exitosamente",
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Delete error:", error);
      setMessage({ type: "error", text: "Error al eliminar el vehículo" });
    } finally {
      setDeleting(false);
      setDeleteModal(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRegionName = (regionId: number) => {
    return regions.get(regionId) || "Desconocida";
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
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Car className="w-6 h-6" />
                Mis Publicaciones
              </h1>
              <p className="text-sm text-gray-500">
                {vehicles.length} vehículos publicados
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCharts(!showCharts)}
                className={`p-2.5 rounded-lg transition-colors ${
                  showCharts
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <BarChart3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push("/publication")}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Publicar
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Mensajes */}
        {message && (
          <div
            className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border ${
              message.type === "success"
                ? "bg-green-50 border-green-100 text-green-700"
                : "bg-red-50 border-red-100 text-red-700"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {/* Charts */}
        {showCharts && (
          <div className="mb-8 bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Estadísticas
              </h2>
              <button
                onClick={() => setShowCharts(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <ChartsPublicaciones
                usuarioId={user?.id}
                empresaId={empresaId ?? undefined}
                isBusiness={isBusiness}
              />
              <ChartsCalificaciones
                usuarioId={user?.id}
                empresaId={empresaId ?? undefined}
                isBusiness={isBusiness}
              />
            </div>
          </div>
        )}

        {/* Vehicles Grid */}
        {vehicles.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tienes publicaciones
            </h3>
            <p className="text-gray-500 mb-6 text-sm">
              Comienza publicando tu primer vehículo
            </p>
            <button
              onClick={() => router.push("/publication")}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Publicar Vehículo
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-300 transition-all group"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-gray-100">
                  {vehicle.images.length > 0 ? (
                    <img
                      src={vehicle.images[0]}
                      alt={`${vehicle.marca} ${vehicle.modelo}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3C/svg%3E";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-12 h-12 text-gray-300" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium ${
                        vehicle.oculto
                          ? "bg-gray-900 text-white"
                          : "bg-green-500 text-white"
                      }`}
                    >
                      {vehicle.oculto ? "Oculta" : "Activa"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="mb-3">
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
                      {vehicle.marca} {vehicle.modelo}
                    </h3>
                    <p className="text-xl font-bold text-gray-900">
                      {formatPrice(vehicle.precio)}
                    </p>
                  </div>

                  <div className="space-y-2 mb-4 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{vehicle.anio}</span>
                      <span className="text-gray-300">•</span>
                      <Gauge className="w-3.5 h-3.5" />
                      <span>{vehicle.kilometraje.toLocaleString()} km</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                        {vehicle.transmision}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                        {vehicle.tipo_combustible}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="line-clamp-1">
                        {vehicle.ciudad_nombre}, {vehicle.region_nombre}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => router.push(`/vehicle/${vehicle.id}`)}
                      className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                      title="Ver"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => toggleStatus(vehicle.id, vehicle.oculto)}
                      className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                        vehicle.oculto
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                      onClick={() =>
                        router.push(`/publication/${vehicle.id}/edit`)
                      }
                      className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeleteModal(vehicle.id)}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-100 max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Confirmar Eliminación
              </h3>
            </div>

            <p className="text-gray-600 text-sm mb-6">
              ¿Estás seguro que deseas eliminar esta publicación? Esta acción no
              se puede deshacer.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteVehicle(deleteModal)}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
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
    </div>
  );
}
