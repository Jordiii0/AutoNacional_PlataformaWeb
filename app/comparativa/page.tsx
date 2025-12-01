"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Car,
  Plus,
  X,
  Search,
  Loader2,
  AlertCircle,
  DollarSign,
  Calendar,
  Gauge,
  Fuel,
  Cog,
  Wrench,
  CheckCircle,
  ArrowLeft,
  Heart,
} from "lucide-react";

interface VehiclePublication {
  id: number;
  precio: number;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number;
  transmision: string;
  tipo_combustible_id: number;
  cilindrada: string;
  descripcion: string;
  estado_vehiculo: string;
  oculto: boolean;
  created_at: string;
  tipo_combustible?: {
    id: number;
    nombre_combustible: string;
  };
}

const VehicleImageComponent = ({ src, alt }: { src: string; alt: string }) => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imgLoading, setImgLoading] = useState(true);

  useEffect(() => {
    if (!src) {
      setImgLoading(false);
      return;
    }

    if (src.startsWith("http")) {
      setImageUrl(src);
      setImgLoading(false);
      return;
    }

    const publicUrl = supabase.storage.from("vehiculo_imagen").getPublicUrl(src)
      .data.publicUrl;

    setImageUrl(publicUrl);
    setImgLoading(false);
  }, [src]);

  if (imgLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className="w-full h-full object-cover"
      onError={(e) => {
        e.currentTarget.src =
          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="%23999" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/%3E%3C/svg%3E';
      }}
    />
  );
};

export default function ComparePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<
    (VehiclePublication & { images: string[] })[]
  >([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [user, setUser] = useState<any>(null);
  const [selectedVehicles, setSelectedVehicles] = useState<
    ((VehiclePublication & { images: string[] }) | null)[]
  >([null, null, null]);
  const [showSelector, setShowSelector] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "favorites">("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        await loadFavorites(session.user.id);
      }

      await loadVehicles();
    } catch (error: any) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from("vehiculo")
        .select("*")
        .eq("oculto", false)
        .order("created_at", { ascending: false });

      if (vehiclesError) throw vehiclesError;
      if (!vehiclesData || vehiclesData.length === 0) {
        setVehicles([]);
        return;
      }

      const combustibleIds = [
        ...new Set(vehiclesData.map((v) => v.tipo_combustible_id)),
      ];

      const { data: combustiblesData } = await supabase
        .from("tipo_combustible")
        .select("id, nombre_combustible")
        .in("id", combustibleIds);

      const combustiblesMap = (combustiblesData || []).reduce((acc, c) => {
        acc[c.id] = c.nombre_combustible;
        return acc;
      }, {} as Record<number, string>);

      const vehiclesWithImages = await Promise.all(
        vehiclesData.map(async (vehicle) => {
          const { data: imagesData } = await supabase
            .from("imagen_vehiculo")
            .select("url_imagen")
            .eq("vehiculo_id", vehicle.id);

          const images = (imagesData || []).map((img) => {
            const urlPath = img.url_imagen;
            if (urlPath.startsWith("http")) return urlPath;
            return supabase.storage
              .from("vehiculo_imagen")
              .getPublicUrl(urlPath).data.publicUrl;
          });

          return {
            ...vehicle,
            images,
            tipo_combustible: {
              id: vehicle.tipo_combustible_id,
              nombre_combustible:
                combustiblesMap[vehicle.tipo_combustible_id] || "Desconocido",
            },
          };
        })
      );

      setVehicles(vehiclesWithImages as any);
    } catch (error: any) {
      console.error("Error en loadVehicles:", error);
      setVehicles([]);
    }
  };

  const loadFavorites = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("favorito")
        .select("vehiculo_id")
        .eq("usuario_id", userId);

      if (error) throw error;
      setFavorites((data || []).map((fav) => fav.vehiculo_id));
    } catch (error: any) {
      console.error("Error loading favorites:", error);
    }
  };

  const selectVehicle = (
    vehicle: VehiclePublication & { images: string[] },
    index: number
  ) => {
    const newSelected = [...selectedVehicles];
    newSelected[index] = vehicle;
    setSelectedVehicles(newSelected);
    setShowSelector(null);
    setSearchTerm("");
  };

  const removeVehicle = (index: number) => {
    const newSelected = [...selectedVehicles];
    newSelected[index] = null;
    setSelectedVehicles(newSelected);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (viewMode === "favorites" && !favorites.includes(v.id)) return false;
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      v.marca.toLowerCase().includes(search) ||
      v.modelo.toLowerCase().includes(search) ||
      v.anio.toString().includes(search)
    );
  });

  const getComparisonValue = (
    attr: string,
    vehicle: (VehiclePublication & { images: string[] }) | null
  ) => {
    if (!vehicle) return "-";

    switch (attr) {
      case "precio":
        return formatPrice(vehicle.precio);
      case "anio":
        return vehicle.anio;
      case "kilometraje":
        return `${vehicle.kilometraje.toLocaleString()} km`;
      case "transmision":
        return vehicle.transmision;
      case "tipo_combustible":
        return vehicle.tipo_combustible?.nombre_combustible || "-";
      case "cilindrada":
        return vehicle.cilindrada || "-";
      case "estado_vehiculo":
        return vehicle.estado_vehiculo;
      default:
        return "-";
    }
  };

  const getHighlightClass = (attr: string, index: number) => {
    const values = selectedVehicles
      .map((v) => {
        if (!v) return null;
        switch (attr) {
          case "precio":
            return Number(v.precio);
          case "anio":
            return Number(v.anio);
          case "kilometraje":
            return Number(v.kilometraje);
          case "cilindrada":
            return v.cilindrada ? parseFloat(v.cilindrada) : null;
          default:
            return null;
        }
      })
      .filter((v) => v !== null);

    if (values.length < 2) return "";

    const currentValue = selectedVehicles[index];
    if (!currentValue) return "";

    let current: number;
    switch (attr) {
      case "precio":
        current = Number(currentValue.precio);
        break;
      case "anio":
        current = Number(currentValue.anio);
        break;
      case "kilometraje":
        current = Number(currentValue.kilometraje);
        break;
      case "cilindrada":
        current = currentValue.cilindrada
          ? parseFloat(currentValue.cilindrada)
          : 0;
        break;
      default:
        return "";
    }

    const min = Math.min(...(values as number[]));
    const max = Math.max(...(values as number[]));

    if (attr === "precio" || attr === "kilometraje") {
      return current === min ? "bg-green-50 border-green-200" : "";
    } else if (attr === "anio" || attr === "cilindrada") {
      return current === max ? "bg-green-50 border-green-200" : "";
    }

    return "";
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

          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Car className="w-7 h-7 text-gray-600" />
              Comparar Vehículos
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Selecciona hasta 3 vehículos para comparar sus características
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Vehicle Selection Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {selectedVehicles.map((vehicle, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {vehicle ? (
                <div>
                  <div className="relative h-48 bg-gray-100">
                    {vehicle.images && vehicle.images.length > 0 ? (
                      <VehicleImageComponent
                        src={vehicle.images[0]}
                        alt={`${vehicle.marca} ${vehicle.modelo}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    <button
                      onClick={() => removeVehicle(index)}
                      className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-red-600 p-2 rounded-full hover:bg-white transition-colors shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-5">
                    <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-1">
                      {vehicle.marca} {vehicle.modelo}
                    </h3>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {formatPrice(vehicle.precio)}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {vehicle.anio}
                      </div>
                      <span className="text-gray-300">•</span>
                      <div className="flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-gray-400" />
                        {vehicle.kilometraje.toLocaleString()} km
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowSelector(index)}
                  className="w-full h-full min-h-[300px] flex flex-col items-center justify-center p-8 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-600 font-medium text-sm">
                    Seleccionar Vehículo {index + 1}
                  </p>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        {selectedVehicles.some((v) => v !== null) && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-900 px-6 py-4">
              <h2 className="text-lg font-bold text-white">
                Comparación Detallada
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 w-1/4">
                      Característica
                    </th>
                    {selectedVehicles.map((_, index) => (
                      <th
                        key={index}
                        className="px-6 py-3 text-center text-xs font-semibold text-gray-700"
                      >
                        Vehículo {index + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Precio */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-700 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      Precio
                    </td>
                    {selectedVehicles.map((vehicle, index) => (
                      <td
                        key={index}
                        className={`px-6 py-4 text-center text-sm border-2 border-transparent ${getHighlightClass(
                          "precio",
                          index
                        )}`}
                      >
                        <span className="font-semibold text-gray-900">
                          {getComparisonValue("precio", vehicle)}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Estado */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-700 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-gray-400" />
                      Estado
                    </td>
                    {selectedVehicles.map((vehicle, index) => (
                      <td key={index} className="px-6 py-4 text-center">
                        {vehicle ? (
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${
                              vehicle.estado_vehiculo === "Nuevo (0km)"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : vehicle.estado_vehiculo === "Usado" ||
                                  vehicle.estado_vehiculo === "Semi-nuevo"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-gray-50 text-gray-700 border border-gray-200"
                            }`}
                          >
                            {vehicle.estado_vehiculo}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Año */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      Año
                    </td>
                    {selectedVehicles.map((vehicle, index) => (
                      <td
                        key={index}
                        className={`px-6 py-4 text-center text-sm border-2 border-transparent ${getHighlightClass(
                          "anio",
                          index
                        )}`}
                      >
                        <span className="text-gray-900">
                          {getComparisonValue("anio", vehicle)}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Kilometraje */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-gray-400" />
                      Kilometraje
                    </td>
                    {selectedVehicles.map((vehicle, index) => (
                      <td
                        key={index}
                        className={`px-6 py-4 text-center text-sm border-2 border-transparent ${getHighlightClass(
                          "kilometraje",
                          index
                        )}`}
                      >
                        <span className="text-gray-900">
                          {getComparisonValue("kilometraje", vehicle)}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Transmisión */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Cog className="w-4 h-4 text-gray-400" />
                      Transmisión
                    </td>
                    {selectedVehicles.map((vehicle, index) => (
                      <td key={index} className="px-6 py-4 text-center text-sm">
                        <span className="text-gray-900">
                          {getComparisonValue("transmision", vehicle)}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Combustible */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Fuel className="w-4 h-4 text-gray-400" />
                      Combustible
                    </td>
                    {selectedVehicles.map((vehicle, index) => (
                      <td key={index} className="px-6 py-4 text-center text-sm">
                        <span className="text-gray-900">
                          {vehicle?.tipo_combustible?.nombre_combustible || "-"}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Cilindrada */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-gray-400" />
                      Cilindrada
                    </td>
                    {selectedVehicles.map((vehicle, index) => (
                      <td
                        key={index}
                        className={`px-6 py-4 text-center text-sm border-2 border-transparent ${getHighlightClass(
                          "cilindrada",
                          index
                        )}`}
                      >
                        <span className="text-gray-900">
                          {vehicle?.cilindrada || "-"}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 px-6 py-4">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-3 h-3 bg-green-50 border-2 border-green-200 rounded"></div>
                <span>
                  Mejor valor (precio más bajo, año más nuevo, menor kilometraje,
                  cilindrada más grande)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Selector Modal */}
        {showSelector !== null && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
              <div className="bg-gray-900 px-6 py-4 flex justify-between items-center flex-shrink-0">
                <h3 className="text-xl font-bold text-white">
                  Seleccionar Vehículo {showSelector + 1}
                </h3>
                <button
                  onClick={() => {
                    setShowSelector(null);
                    setSearchTerm("");
                  }}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                {/* View Mode Toggle */}
                {user && favorites.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => setViewMode("all")}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                        viewMode === "all"
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <Car className="w-4 h-4" />
                      Todos ({vehicles.length})
                    </button>
                    <button
                      onClick={() => setViewMode("favorites")}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                        viewMode === "favorites"
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <Heart className="w-4 h-4" />
                      Favoritos ({favorites.length})
                    </button>
                  </div>
                )}

                {/* Search */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por marca, modelo o año..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                {/* Empty State for Favorites */}
                {viewMode === "favorites" && favorites.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Heart className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      No tienes favoritos
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Guarda vehículos en favoritos para compararlos fácilmente
                    </p>
                    <button
                      onClick={() => setViewMode("all")}
                      className="text-sm text-gray-900 font-medium hover:underline"
                    >
                      Ver todos los vehículos
                    </button>
                  </div>
                )}

                {/* Vehicle List */}
                {(viewMode !== "favorites" || favorites.length > 0) && (
                  <div className="space-y-3">
                    {filteredVehicles.length === 0 ? (
                      <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 text-sm">
                          No se encontraron vehículos
                        </p>
                      </div>
                    ) : (
                      filteredVehicles.map((vehicle) => {
                        const isSelected = selectedVehicles.some(
                          (v) => v?.id === vehicle.id
                        );
                        const isFavorite = favorites.includes(vehicle.id);
                        return (
                          <button
                            key={vehicle.id}
                            onClick={() =>
                              !isSelected &&
                              selectVehicle(vehicle, showSelector as number)
                            }
                            disabled={isSelected}
                            className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all relative ${
                              isSelected
                                ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                                : "border-gray-200 hover:border-gray-900 hover:bg-gray-50"
                            }`}
                          >
                            {isFavorite && (
                              <div className="absolute top-2 right-2 bg-red-50 rounded-full p-1">
                                <Heart className="w-3 h-3 text-red-500 fill-current" />
                              </div>
                            )}
                            <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                              {vehicle.images && vehicle.images.length > 0 ? (
                                <VehicleImageComponent
                                  src={vehicle.images[0]}
                                  alt={`${vehicle.marca} ${vehicle.modelo}`}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Car className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <h4 className="text-sm font-bold text-gray-900 truncate">
                                {vehicle.marca} {vehicle.modelo}
                              </h4>
                              <p className="text-base font-bold text-gray-900 mb-1">
                                {formatPrice(vehicle.precio)}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span>{vehicle.anio}</span>
                                <span className="text-gray-300">•</span>
                                <span>
                                  {vehicle.kilometraje.toLocaleString()} km
                                </span>
                                <span className="text-gray-300">•</span>
                                <span className="truncate">
                                  {vehicle.estado_vehiculo}
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
