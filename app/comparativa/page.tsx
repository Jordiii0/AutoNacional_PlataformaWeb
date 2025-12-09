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
  Sparkles,
  TrendingUp,
  Award,
  Info,
  RefreshCw,
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
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50">
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

  const clearAll = () => {
    setSelectedVehicles([null, null, null]);
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
      return current === min ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-sm" : "";
    } else if (attr === "anio" || attr === "cilindrada") {
      return current === max ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-sm" : "";
    }

    return "";
  };

  const selectedCount = selectedVehicles.filter((v) => v !== null).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gray-900 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando vehículos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header Mejorado */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Comparar Vehículos
                  </h1>
                  <p className="text-sm text-gray-600">
                    Selecciona hasta 3 vehículos para comparar
                  </p>
                </div>
              </div>
            </div>

            {selectedCount > 0 && (
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>{selectedCount}/3 seleccionados</span>
                </div>
                <button
                  onClick={clearAll}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors group"
                  title="Limpiar todo"
                >
                  <RefreshCw className="w-5 h-5 text-gray-600 group-hover:rotate-180 transition-transform duration-500" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Info Banner */}
        <div className="mb-6 sm:mb-8 p-4 sm:p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">
              ¿Cómo funciona?
            </h3>
            <p className="text-sm text-blue-700">
              Selecciona hasta 3 vehículos para ver una comparación detallada de sus características. Los mejores valores se destacarán automáticamente.
            </p>
          </div>
        </div>

        {/* Vehicle Selection Cards - Mejoradas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {selectedVehicles.map((vehicle, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:shadow-2xl hover:border-gray-300 transition-all duration-300"
            >
              {vehicle ? (
                <div className="relative">
                  {/* Image with Gradient Overlay */}
                  <div className="relative h-48 sm:h-56 bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
                    {vehicle.images && vehicle.images.length > 0 ? (
                      <VehicleImageComponent
                        src={vehicle.images[0]}
                        alt={`${vehicle.marca} ${vehicle.modelo}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => removeVehicle(index)}
                      className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-red-600 p-2 rounded-xl hover:bg-white transition-all shadow-lg hover:scale-110 active:scale-95"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Position Badge */}
                    <div className="absolute top-3 left-3 px-3 py-1.5 bg-gray-900/90 backdrop-blur-sm text-white text-xs font-bold rounded-xl">
                      #{index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                        {vehicle.marca} {vehicle.modelo}
                      </h3>
                      <p className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        {formatPrice(vehicle.precio)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{vehicle.anio}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Gauge className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">
                          {vehicle.kilometraje.toLocaleString()} km
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Cog className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{vehicle.transmision}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowSelector(index)}
                  className="w-full h-full min-h-[320px] sm:min-h-[360px] flex flex-col items-center justify-center p-8 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 transition-all group"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-xl">
                    <Plus className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <p className="text-gray-900 font-semibold text-base mb-1">
                    Seleccionar Vehículo {index + 1}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Click para elegir
                  </p>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Comparison Table - Mejorada */}
        {selectedVehicles.some((v) => v !== null) && (
          <div className="bg-white rounded-3xl border-2 border-gray-200 overflow-hidden shadow-xl">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">
                  Comparación Detallada
                </h2>
              </div>
              <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm font-medium">
                {selectedCount} vehículos
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-br from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 w-1/4">
                      Característica
                    </th>
                    {selectedVehicles.map((_, index) => (
                      <th
                        key={index}
                        className="px-6 py-4 text-center text-sm font-bold text-gray-900"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs">
                            {index + 1}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Precio */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5 text-sm font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-green-700" />
                        </div>
                        <span>Precio</span>
                      </div>
                    </td>
                    {selectedVehicles.map((vehicle, index) => (
                      <td
                        key={index}
                        className={`px-6 py-5 text-center text-sm border-2 border-transparent transition-all ${getHighlightClass(
                          "precio",
                          index
                        )}`}
                      >
                        <span className="font-bold text-gray-900">
                          {getComparisonValue("precio", vehicle)}
                        </span>
                        {getHighlightClass("precio", index) && (
                          <div className="mt-1 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Estado */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5 text-sm font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-blue-700" />
                        </div>
                        <span>Estado</span>
                      </div>
                    </td>
                    {selectedVehicles.map((vehicle, index) => (
                      <td key={index} className="px-6 py-5 text-center">
                        {vehicle ? (
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm ${
                              vehicle.estado_vehiculo === "Nuevo (0km)"
                                ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-2 border-green-200"
                                : vehicle.estado_vehiculo === "Usado" ||
                                  vehicle.estado_vehiculo === "Semi-nuevo"
                                ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-2 border-blue-200"
                                : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-2 border-gray-200"
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
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5 text-sm font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-purple-700" />
                        </div>
                        <span>Año</span>
                      </div>
                    </td>
                    {selectedVehicles.map((vehicle, index) => (
                      <td
                        key={index}
                        className={`px-6 py-5 text-center text-sm border-2 border-transparent transition-all ${getHighlightClass(
                          "anio",
                          index
                        )}`}
                      >
                        <span className="font-bold text-gray-900">
                          {getComparisonValue("anio", vehicle)}
                        </span>
                        {getHighlightClass("anio", index) && (
                          <div className="mt-1 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Kilometraje */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5 text-sm font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex items-center justify-center">
                          <Gauge className="w-4 h-4 text-orange-700" />
                        </div>
                        <span>Kilometraje</span>
                      </div>
                    </td>
                    {selectedVehicles.map((vehicle, index) => (
                      <td
                        key={index}
                        className={`px-6 py-5 text-center text-sm border-2 border-transparent transition-all ${getHighlightClass(
                          "kilometraje",
                          index
                        )}`}
                      >
                        <span className="font-bold text-gray-900">
                          {getComparisonValue("kilometraje", vehicle)}
                        </span>
                        {getHighlightClass("kilometraje", index) && (
                          <div className="mt-1 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Transmisión */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5 text-sm font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg flex items-center justify-center">
                          <Cog className="w-4 h-4 text-cyan-700" />
                        </div>
                        <span>Transmisión</span>
                      </div>
                    </td>
                    {selectedVehicles.map((vehicle, index) => (
                      <td key={index} className="px-6 py-5 text-center text-sm">
                        <span className="font-medium text-gray-900">
                          {getComparisonValue("transmision", vehicle)}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Combustible */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5 text-sm font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-100 to-rose-100 rounded-lg flex items-center justify-center">
                          <Fuel className="w-4 h-4 text-red-700" />
                        </div>
                        <span>Combustible</span>
                      </div>
                    </td>
                    {selectedVehicles.map((vehicle, index) => (
                      <td key={index} className="px-6 py-5 text-center text-sm">
                        <span className="font-medium text-gray-900">
                          {vehicle?.tipo_combustible?.nombre_combustible || "-"}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Cilindrada */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5 text-sm font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-lg flex items-center justify-center">
                          <Wrench className="w-4 h-4 text-teal-700" />
                        </div>
                        <span>Cilindrada</span>
                      </div>
                    </td>
                    {selectedVehicles.map((vehicle, index) => (
                      <td
                        key={index}
                        className={`px-6 py-5 text-center text-sm border-2 border-transparent transition-all ${getHighlightClass(
                          "cilindrada",
                          index
                        )}`}
                      >
                        <span className="font-bold text-gray-900">
                          {vehicle?.cilindrada || "-"}
                        </span>
                        {getHighlightClass("cilindrada", index) && (
                          <div className="mt-1 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-t-2 border-green-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">
                    Mejor valor destacado
                  </span>
                </div>
                <span className="text-green-600">•</span>
                <span className="text-sm text-green-700">
                  Precio más bajo, año más nuevo, menor kilometraje, cilindrada más grande
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Selector Modal - Mejorado */}
        {showSelector !== null && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border-2 border-gray-200 shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Car className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Seleccionar Vehículo {showSelector + 1}
                    </h3>
                    <p className="text-sm text-gray-300">
                      Elige el vehículo para comparar
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowSelector(null);
                    setSearchTerm("");
                  }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all hover:rotate-90 duration-300"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 flex-1 overflow-y-auto">
                {/* View Mode Toggle */}
                {user && favorites.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <button
                      onClick={() => setViewMode("all")}
                      className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                        viewMode === "all"
                          ? "bg-gray-900 text-white shadow-lg scale-105"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <Car className="w-4 h-4" />
                      Todos ({vehicles.length})
                    </button>
                    <button
                      onClick={() => setViewMode("favorites")}
                      className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                        viewMode === "favorites"
                          ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg scale-105"
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
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por marca, modelo o año..."
                    className="w-full pl-12 pr-4 py-3.5 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  />
                </div>

                {/* Empty State */}
                {viewMode === "favorites" && favorites.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      No tienes favoritos
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Guarda vehículos para compararlos fácilmente
                    </p>
                    <button
                      onClick={() => setViewMode("all")}
                      className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                    >
                      Ver todos los vehículos
                    </button>
                  </div>
                )}

                {/* Vehicle List */}
                {(viewMode !== "favorites" || favorites.length > 0) && (
                  <div className="space-y-3">
                    {filteredVehicles.length === 0 ? (
                      <div className="text-center py-16">
                        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">
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
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all relative ${
                              isSelected
                                ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                                : "border-gray-200 hover:border-gray-900 hover:bg-gray-50 hover:shadow-lg"
                            }`}
                          >
                            {isFavorite && (
                              <div className="absolute top-3 right-3 bg-red-50 rounded-full p-1.5">
                                <Heart className="w-4 h-4 text-red-500 fill-current" />
                              </div>
                            )}
                            <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 shadow-md">
                              {vehicle.images && vehicle.images.length > 0 ? (
                                <VehicleImageComponent
                                  src={vehicle.images[0]}
                                  alt={`${vehicle.marca} ${vehicle.modelo}`}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Car className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <h4 className="text-base font-bold text-gray-900 truncate mb-1">
                                {vehicle.marca} {vehicle.modelo}
                              </h4>
                              <p className="text-lg font-bold text-gray-900 mb-2">
                                {formatPrice(vehicle.precio)}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span className="font-medium">{vehicle.anio}</span>
                                <span className="text-gray-300">•</span>
                                <span className="font-medium">
                                  {vehicle.kilometraje.toLocaleString()} km
                                </span>
                                <span className="text-gray-300">•</span>
                                <span className="px-2 py-0.5 bg-gray-100 rounded-md font-medium truncate">
                                  {vehicle.estado_vehiculo}
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-gray-500" />
                              </div>
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
