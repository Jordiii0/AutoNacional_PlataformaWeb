"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Heart,
  Loader2,
  Car,
  Calendar,
  Gauge,
  ArrowLeft,
  Trash2,
  Eye,
  AlertCircle,
  MapPin,
  Fuel,
  Settings,
} from "lucide-react";

interface Vehicle {
  id: number;
  precio: number;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number;
  transmision: string;
  tipo_combustible_id: number;
  estado_vehiculo: string;
  descripcion: string;
  cilindrada: string;
  tipo_vehiculo_id: number;
  region: number;
  ciudad: string;
}

interface Favorite {
  id: number;
  vehiculo_id: number;
  created_at: string;
  vehiculo: Vehicle;
  tipo_combustible_nombre?: string;
  tipo_vehiculo_nombre?: string;
  imagen_principal?: string;
  region_nombre?: string;
}

export default function FavoritesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [deleteModal, setDeleteModal] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const checkAuthAndLoadFavorites = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        router.push("/login");
        return;
      }

      setUser(session.user);
      await loadFavorites(session.user.id);
      setLoading(false);
    };

    checkAuthAndLoadFavorites();
  }, [router]);

  const loadFavorites = async (userId: string) => {
    try {
      const { data: favoritosData, error: favError } = await supabase
        .from("favorito")
        .select("id, vehiculo_id, created_at")
        .eq("usuario_id", userId)
        .order("created_at", { ascending: false });

      if (favError) throw favError;

      if (!favoritosData || favoritosData.length === 0) {
        setFavorites([]);
        return;
      }

      const vehiculoIds = favoritosData.map((f) => f.vehiculo_id);

      const { data: vehiculosData } = await supabase
        .from("vehiculo")
        .select("*")
        .in("id", vehiculoIds);

      const { data: combustibleData } = await supabase
        .from("tipo_combustible")
        .select("id, nombre");

      const { data: tipoVehiculoData } = await supabase
        .from("tipo_vehiculo")
        .select("id, nombre");

      const { data: regionesData } = await supabase
        .from("region")
        .select("id, nombre_region");

      const favoritosCompletos = await Promise.all(
        favoritosData.map(async (fav) => {
          const vehiculo = vehiculosData?.find((v) => v.id === fav.vehiculo_id);

          if (!vehiculo) return null;

          const tipoCombustible = combustibleData?.find(
            (c) => c.id === vehiculo.tipo_combustible_id
          );
          const tipoVehiculo = tipoVehiculoData?.find(
            (t) => t.id === vehiculo.tipo_vehiculo_id
          );
          const region = regionesData?.find((r) => r.id === vehiculo.region);

          const { data: imagenesData } = await supabase
            .from("imagen_vehiculo")
            .select("url_imagen")
            .eq("vehiculo_id", vehiculo.id)
            .limit(1);

          return {
            id: fav.id,
            vehiculo_id: fav.vehiculo_id,
            created_at: fav.created_at,
            vehiculo,
            tipo_combustible_nombre: tipoCombustible?.nombre || "Desconocido",
            tipo_vehiculo_nombre: tipoVehiculo?.nombre || "Desconocido",
            region_nombre: region?.nombre_region || "Desconocida",
            imagen_principal:
              imagenesData && imagenesData.length > 0
                ? imagenesData[0].url_imagen
                : null,
          };
        })
      );

      setFavorites(favoritosCompletos.filter((f) => f !== null) as Favorite[]);
    } catch (error: any) {
      console.error("Error loading favorites:", error);
      setFavorites([]);
    }
  };

  const removeFavorite = async (favoriteId: number) => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("favorito")
        .delete()
        .eq("id", favoriteId);

      if (error) throw error;

      setFavorites(favorites.filter((fav) => fav.id !== favoriteId));
    } catch (error: any) {
      console.error("Error removing favorite:", error);
      alert("Error al eliminar favorito");
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
        <div className="max-w-7xl mx-auto px-6 py-4">
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
                <Heart className="w-7 h-7 text-red-500 fill-current" />
                Mis Favoritos
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {favorites.length}{" "}
                {favorites.length === 1 ? "vehículo guardado" : "vehículos guardados"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {favorites.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No tienes favoritos guardados
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              Explora la tienda y guarda los vehículos que te interesen
            </p>
            <button
              onClick={() => router.push("/shop")}
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
            >
              <Car className="w-4 h-4" />
              Ir a la Tienda
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => {
              const vehicle = favorite.vehiculo;
              if (!vehicle) return null;

              return (
                <div
                  key={favorite.id}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all group"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    {favorite.imagen_principal ? (
                      <img
                        src={favorite.imagen_principal}
                        alt={`${vehicle.marca} ${vehicle.modelo}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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

                    {/* Heart Badge */}
                    <button
                      onClick={() => setDeleteModal(favorite.id)}
                      className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-red-50 transition-colors group/heart"
                    >
                      <Heart className="w-4 h-4 text-red-500 fill-current group-hover/heart:scale-110 transition-transform" />
                    </button>

                    {/* Condition Badge */}
                    {vehicle.estado_vehiculo && (
                      <div className="absolute top-3 left-3">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-medium backdrop-blur-sm ${
                            vehicle.estado_vehiculo === "Nuevo"
                              ? "bg-green-500/90 text-white"
                              : vehicle.estado_vehiculo === "Semi-nuevo"
                              ? "bg-blue-500/90 text-white"
                              : "bg-gray-500/90 text-white"
                          }`}
                        >
                          {vehicle.estado_vehiculo}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                        {vehicle.marca} {vehicle.modelo}
                      </h3>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPrice(vehicle.precio)}
                      </p>
                    </div>

                    <div className="space-y-2.5 mb-4">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{vehicle.anio}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Gauge className="w-4 h-4 text-gray-400" />
                          <span>{vehicle.kilometraje.toLocaleString()} km</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-md text-xs text-gray-700">
                          <Settings className="w-3.5 h-3.5 text-gray-400" />
                          {vehicle.transmision}
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-md text-xs text-gray-700">
                          <Fuel className="w-3.5 h-3.5 text-gray-400" />
                          {favorite.tipo_combustible_nombre}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin className="w-3.5 h-3.5" />
                        {vehicle.ciudad}, {favorite.region_nombre}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-1 border-t border-gray-100">
                        <Heart className="w-3 h-3" />
                        Guardado el {formatDate(favorite.created_at)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => router.push(`/vehicle/${vehicle.id}`)}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </button>

                      <button
                        onClick={() => setDeleteModal(favorite.id)}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Quitar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
                    Quitar de Favoritos
                  </h3>
                  <p className="text-sm text-gray-600">
                    ¿Estás seguro que deseas quitar este vehículo de tus favoritos?
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
                  onClick={() => removeFavorite(deleteModal)}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Quitando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Quitar
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
