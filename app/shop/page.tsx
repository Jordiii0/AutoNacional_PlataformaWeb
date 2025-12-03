"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Car,
  Search,
  SlidersHorizontal,
  X,
  Loader2,
  Gauge,
  ArrowUpDown,
  ChevronDown,
  Eye,
  Fuel,
  Cog,
  MapPin,
} from "lucide-react";

// Interfaces
interface City {
  id: number;
  nombre_ciudad: string;
  region_id: number;
}

interface CatalogItem {
  id: number;
  nombre: string;
}

interface Region {
  id: number;
  nombre_region: string;
}

interface Vehicle {
  id: number;
  precio: number;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number;
  transmision: string;
  estado_vehiculo: string;
  descripcion: string;
  cilindrada: number;
  oculto: boolean;
  created_at?: string;
  region_id: number;
  ciudad_id: number;
  tipo_vehiculo_id: number;
  tipo_combustible_id: number;
  tipo_combustible: string;
  tipo_vehiculo: string;
  region_nombre: string;
  ciudad_nombre: string;
}

interface VehicleWithImages extends Vehicle {
  images: string[];
}

const SORT_OPTIONS = [
  { value: "default", label: "Más recientes" },
  { value: "price_desc", label: "Precio: Mayor a Menor" },
  { value: "price_asc", label: "Precio: Menor a Mayor" },
  { value: "year_desc", label: "Año: Más nuevo" },
  { value: "year_asc", label: "Año: Más antiguo" },
  { value: "mileage_asc", label: "Menor kilometraje" },
];

export default function ShopPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleWithImages[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const [tiposCombustible, setTiposCombustible] = useState<CatalogItem[]>([]);
  const [tiposVehiculo, setTiposVehiculo] = useState<CatalogItem[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);

  const [filters, setFilters] = useState({
    search: "",
    brand: "",
    model: "",
    yearMin: "",
    yearMax: "",
    priceMin: "",
    priceMax: "",
    conditions: searchParams?.getAll("conditions") || [],
    vehicleType: "",
    region: "",
  });

  const [sortBy, setSortBy] = useState("default");
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  // ✅ useEffect optimizado: solo corre una vez
  useEffect(() => {
    loadData();
  }, []); // ✅ Array vacío: solo al montar

  // ✅ OPTIMIZACIÓN 1: Usar Maps para lookups O(1) en lugar de O(n)
  const filteredVehicles = useMemo(() => {
    let filtered = [...vehicles];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.marca.toLowerCase().includes(searchLower) ||
          v.modelo.toLowerCase().includes(searchLower)
      );
    }

    if (filters.brand) {
      const brandLower = filters.brand.toLowerCase();
      filtered = filtered.filter((v) =>
        v.marca.toLowerCase().includes(brandLower)
      );
    }

    if (filters.model) {
      const modelLower = filters.model.toLowerCase();
      filtered = filtered.filter((v) =>
        v.modelo.toLowerCase().includes(modelLower)
      );
    }

    if (filters.yearMin) {
      const yearMin = parseInt(filters.yearMin);
      filtered = filtered.filter((v) => v.anio >= yearMin);
    }
    if (filters.yearMax) {
      const yearMax = parseInt(filters.yearMax);
      filtered = filtered.filter((v) => v.anio <= yearMax);
    }

    if (filters.priceMin) {
      const priceMin = parseInt(filters.priceMin);
      filtered = filtered.filter((v) => v.precio >= priceMin);
    }
    if (filters.priceMax) {
      const priceMax = parseInt(filters.priceMax);
      filtered = filtered.filter((v) => v.precio <= priceMax);
    }

    if (filters.vehicleType) {
      filtered = filtered.filter(
        (v) => v.tipo_vehiculo === filters.vehicleType
      );
    }

    if (filters.region) {
      const regionId = parseInt(filters.region);
      filtered = filtered.filter((v) => v.region_id === regionId);
    }

    if (filters.conditions.length > 0) {
      const conditionsSet = new Set(filters.conditions);
      filtered = filtered.filter((v) => conditionsSet.has(v.estado_vehiculo));
    }

    // ✅ Ordenamiento optimizado
    switch (sortBy) {
      case "price_desc":
        filtered.sort((a, b) => b.precio - a.precio);
        break;
      case "price_asc":
        filtered.sort((a, b) => a.precio - b.precio);
        break;
      case "year_desc":
        filtered.sort((a, b) => b.anio - a.anio);
        break;
      case "year_asc":
        filtered.sort((a, b) => a.anio - b.anio);
        break;
      case "mileage_asc":
        filtered.sort((a, b) => a.kilometraje - b.kilometraje);
        break;
      default:
        filtered.sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
        );
    }

    return filtered;
  }, [vehicles, filters, sortBy]);

  // ✅ OPTIMIZACIÓN 2: Función de carga completamente optimizada
  const loadData = async () => {
    try {
      setLoading(true);

      // ✅ 1. Cargar TODOS los catálogos en paralelo
      const [combustibleRes, tipoRes, regionesRes, ciudadesRes, vehiculosRes] =
        await Promise.all([
          supabase
            .from("tipo_combustible")
            .select("id, nombre_combustible")
            .order("nombre_combustible"),
          supabase
            .from("tipo_vehiculo")
            .select("id, nombre_tipo")
            .order("nombre_tipo"),
          supabase
            .from("region")
            .select("id, nombre_region")
            .order("nombre_region"),
          supabase
            .from("ciudad")
            .select("id, nombre_ciudad, region_id")
            .order("nombre_ciudad"),
          supabase
            .from("vehiculo")
            .select("*")
            .eq("oculto", false)
            .order("created_at", { ascending: false })
            .limit(200), // ✅ Limitar a 200 vehículos iniciales
        ]);

      // ✅ 2. Crear Maps para lookups O(1) en lugar de .find() O(n)
      const combustibleMap = new Map(
        combustibleRes.data?.map((c) => [c.id, c.nombre_combustible]) || []
      );
      const tipoMap = new Map(
        tipoRes.data?.map((t) => [t.id, t.nombre_tipo]) || []
      );
      const regionMap = new Map(
        regionesRes.data?.map((r) => [r.id, r.nombre_region]) || []
      );
      const ciudadMap = new Map(
        ciudadesRes.data?.map((c) => [c.id, c.nombre_ciudad]) || []
      );

      // ✅ 3. Guardar catálogos para los filtros
      setTiposCombustible(
        combustibleRes.data?.map((c) => ({
          id: c.id,
          nombre: c.nombre_combustible,
        })) || []
      );
      setTiposVehiculo(
        tipoRes.data?.map((t) => ({ id: t.id, nombre: t.nombre_tipo })) || []
      );
      setRegions(regionesRes.data || []);

      const vehiculosData = vehiculosRes.data;

      if (!vehiculosData || vehiculosData.length === 0) {
        setVehicles([]);
        return;
      }

      // ✅ 4. Cargar TODAS las imágenes en UNA sola query (evita N+1)
      const vehicleIds = vehiculosData.map((v) => v.id);
      const { data: allImages } = await supabase
        .from("imagen_vehiculo")
        .select("vehiculo_id, url_imagen")
        .in("vehiculo_id", vehicleIds)
        .limit(1000); // ✅ Limitar imágenes por seguridad

      // ✅ 5. Agrupar imágenes por vehículo usando Map (O(n))
      const imagesByVehicle = new Map<number, string[]>();
      allImages?.forEach((img) => {
        if (!imagesByVehicle.has(img.vehiculo_id)) {
          imagesByVehicle.set(img.vehiculo_id, []);
        }
        imagesByVehicle.get(img.vehiculo_id)!.push(img.url_imagen);
      });

      // ✅ 6. Mapear vehículos usando Maps (O(n) en lugar de O(n²))
      const vehiculosConImagenes: VehicleWithImages[] = vehiculosData.map(
        (vehiculo) => ({
          ...vehiculo,
          images: imagesByVehicle.get(vehiculo.id) || [],
          tipo_combustible:
            combustibleMap.get(vehiculo.tipo_combustible_id) ||
            "No especificado",
          tipo_vehiculo:
            tipoMap.get(vehiculo.tipo_vehiculo_id) || "No especificado",
          ciudad_nombre:
            ciudadMap.get(vehiculo.ciudad_id) || "Ciudad Desconocida",
          region_nombre:
            regionMap.get(vehiculo.region_id) || "Región Desconocida",
        })
      );

      setVehicles(vehiculosConImagenes);
    } catch (error: any) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ OPTIMIZACIÓN 3: useCallback para evitar re-creación de funciones
  const clearFilters = useCallback(() => {
    setFilters({
      search: "",
      brand: "",
      model: "",
      yearMin: "",
      yearMax: "",
      priceMin: "",
      priceMax: "",
      conditions: [],
      vehicleType: "",
      region: "",
    });
    setSortBy("default");
  }, []);

  // ✅ OPTIMIZACIÓN 4: Memoizar formatPrice
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search ||
      filters.brand ||
      filters.model ||
      filters.yearMin ||
      filters.yearMax ||
      filters.priceMin ||
      filters.priceMax ||
      filters.conditions.length > 0 ||
      filters.vehicleType ||
      filters.region ||
      sortBy !== "default"
    );
  }, [filters, sortBy]);

  // ✅ OPTIMIZACIÓN 5: Manejador de errores de imagen memoizado
  const handleImageError = useCallback((vehicleId: number) => {
    setImageErrors((prev) => {
      const newSet = new Set(prev);
      newSet.add(vehicleId);
      return newSet;
    });
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
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Tienda de Vehículos
              </h1>
              <p className="text-sm text-gray-500">
                {vehicles.length} vehículos disponibles
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                placeholder="Buscar por marca o modelo..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div className="lg:w-56">
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent appearance-none bg-white"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                showFilters
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filtros</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={filters.brand}
                    onChange={(e) =>
                      setFilters({ ...filters, brand: e.target.value })
                    }
                    placeholder="Toyota, Ford..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={filters.model}
                    onChange={(e) =>
                      setFilters({ ...filters, model: e.target.value })
                    }
                    placeholder="Corolla, Fiesta..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Tipo de Vehículo
                  </label>
                  <select
                    value={filters.vehicleType}
                    onChange={(e) =>
                      setFilters({ ...filters, vehicleType: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    {tiposVehiculo.map((type) => (
                      <option key={type.id} value={type.nombre}>
                        {type.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Región
                  </label>
                  <select
                    value={filters.region}
                    onChange={(e) =>
                      setFilters({ ...filters, region: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Todas</option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.nombre_region}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Año
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={filters.yearMin}
                      onChange={(e) =>
                        setFilters({ ...filters, yearMin: e.target.value })
                      }
                      placeholder="Desde"
                      className="w-1/2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                    <input
                      type="number"
                      value={filters.yearMax}
                      onChange={(e) =>
                        setFilters({ ...filters, yearMax: e.target.value })
                      }
                      placeholder="Hasta"
                      className="w-1/2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Precio (CLP)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={filters.priceMin}
                      onChange={(e) =>
                        setFilters({ ...filters, priceMin: e.target.value })
                      }
                      placeholder="Mín"
                      className="w-1/2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                    <input
                      type="number"
                      value={filters.priceMax}
                      onChange={(e) =>
                        setFilters({ ...filters, priceMax: e.target.value })
                      }
                      placeholder="Máx"
                      className="w-1/2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-4">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Limpiar Filtros
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Mostrando{" "}
          <span className="font-semibold">{filteredVehicles.length}</span> de{" "}
          <span className="font-semibold">{vehicles.length}</span> vehículos
        </div>

        {/* Vehicles Grid */}
        {filteredVehicles.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No se encontraron vehículos
            </h3>
            <p className="text-gray-500 mb-4 text-sm">
              Intenta ajustar tus filtros de búsqueda
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
                Limpiar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white rounded-lg md:rounded-xl border border-gray-100 overflow-hidden hover:border-gray-300 transition-all cursor-pointer group"
                onClick={() => router.push(`/vehicle/${vehicle.id}`)}
              >
                <div className="relative aspect-[4/3] bg-gray-100">
                  {!imageErrors.has(vehicle.id) && vehicle.images.length > 0 ? (
                    <img
                      src={vehicle.images[0]}
                      alt={`${vehicle.marca} ${vehicle.modelo}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={() => handleImageError(vehicle.id)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-12 h-12 text-gray-300" />
                    </div>
                  )}

                  <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2">
                    <span className="px-1.5 py-0.5 md:px-2 md:py-1 bg-white/90 backdrop-blur-sm rounded text-xs font-semibold text-gray-900">
                      {vehicle.anio}
                    </span>
                  </div>
                </div>

                <div className="p-3 md:p-4">
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 text-sm md:text-base">
                    {vehicle.marca} {vehicle.modelo}
                  </h3>
                  <p className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">
                    {formatPrice(vehicle.precio)}
                  </p>

                  <div className="space-y-1.5 md:space-y-2 text-xs text-gray-600 mb-3 md:mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5" />
                        <span>{vehicle.kilometraje.toLocaleString()} km</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Cog className="w-3.5 h-3.5" />
                        <span>{vehicle.transmision}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5" />
                      <span>{vehicle.tipo_combustible}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="line-clamp-1">
                        {vehicle.ciudad_nombre}, {vehicle.region_nombre}
                      </span>
                    </div>
                  </div>

                  <button className="w-full flex items-center justify-center gap-1.5 md:gap-2 bg-gray-900 text-white py-2 text-xs md:text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                    <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    Ver Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
