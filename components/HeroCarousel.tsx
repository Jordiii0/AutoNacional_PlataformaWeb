"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Building,
  Search,
  MapPin,
  Home,
  DollarSign,
  Car,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Slide {
  image: string;
  title: string;
  subtitle: string;
}

interface Stats {
  totalUsers: number;
  totalVehicles: number;
  totalCompanies: number;
}

interface Region {
  id: number;
  nombre_region: string;
}

interface Ciudad {
  id: number;
  nombre_ciudad: string;
  region_id: number;
}

const HeroCarousel: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<"usuario" | "empresa" | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados del formulario de búsqueda
  const [searchForm, setSearchForm] = useState({
    region_id: "",
    ciudad_id: "",
    propertyType: "",
    priceRange: "",
  });

  // Estados para regiones y ciudades
  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<Ciudad[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  // Estado para estadísticas reales
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalVehicles: 0,
    totalCompanies: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const slides: Slide[] = [
    {
      image: "/images/banner.jpg",
      title: "Encuentra Tu Vehículo Perfecto Hoy",
      subtitle: "Vehículos disponibles para compra y arriendo en todo el país",
    },
    {
      image: "/images/banner2.jpg",
      title: "Ofertas Exclusivas del Mercado",
      subtitle: "Descubre las mejores ofertas en vehículos nuevos y usados",
    },
    {
      image: "/images/banner3.jpg",
      title: "Vende Tu Vehículo Fácilmente",
      subtitle:
        "Publica tu vehículo de forma rápida y llega a miles de compradores",
    },
  ];

  // Cargar regiones al montar el componente
  useEffect(() => {
    const loadRegions = async () => {
      try {
        setLoadingLocations(true);
        const { data, error } = await supabase
          .from("region")
          .select("id, nombre_region")
          .order("nombre_region", { ascending: true });

        if (error) throw error;
        setRegions(data || []);
      } catch (error) {
        console.error("Error loading regions:", error);
      } finally {
        setLoadingLocations(false);
      }
    };

    loadRegions();
  }, []);

  // Cargar ciudades cuando se selecciona una región
  useEffect(() => {
    const loadCities = async () => {
      if (!searchForm.region_id) {
        setCities([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("ciudad")
          .select("id, nombre_ciudad, region_id")
          .eq("region_id", parseInt(searchForm.region_id))
          .order("nombre_ciudad", { ascending: true });

        if (error) throw error;
        setCities(data || []);
      } catch (error) {
        console.error("Error loading cities:", error);
        setCities([]);
      }
    };

    loadCities();
  }, [searchForm.region_id]);

  // Cargar estadísticas reales
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoadingStats(true);

        const [
          { count: usuariosCount },
          { count: empresasCount },
          { count: vehiculosCount },
        ] = await Promise.all([
          supabase.from("usuario").select("*", { count: "exact", head: true }),
          supabase.from("empresa").select("*", { count: "exact", head: true }),
          supabase.from("vehiculo").select("*", { count: "exact", head: true }),
        ]);

        setStats({
          totalUsers: (usuariosCount || 0) + (empresasCount || 0),
          totalVehicles: vehiculosCount || 0,
          totalCompanies: empresasCount || 0,
        });
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, []);

  // Verificar sesión y tipo de usuario
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setIsLoggedIn(false);
          setUserType(null);
          setUserId(null);
          setLoading(false);
          return;
        }

        setIsLoggedIn(true);
        setUserId(session.user.id);

        const { data: empresaData } = await supabase
          .from("empresa")
          .select("id")
          .eq("usuario_id", session.user.id)
          .maybeSingle();

        if (empresaData) {
          setUserType("empresa");
        } else {
          setUserType("usuario");
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setIsLoggedIn(false);
        setUserType(null);
        setUserId(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setIsLoggedIn(false);
        setUserType(null);
        setUserId(null);
        return;
      }

      setIsLoggedIn(true);
      setUserId(session.user.id);

      const { data: empresaData } = await supabase
        .from("empresa")
        .select("id")
        .eq("usuario_id", session.user.id)
        .maybeSingle();

      setUserType(empresaData ? "empresa" : "usuario");
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length, isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
  };

  const getProfileLink = () => {
    if (!userId) return "/login";
    if (userType === "empresa") return `/business-profile/`;
    return `/profile/`;
  };

  const getProfileButtonText = () => {
    if (userType === "empresa") return "Mi Empresa";
    return "Mi Perfil";
  };

  const getProfileIcon = () => {
    if (userType === "empresa") return <Building className="w-4 h-4" />;
    return <User className="w-4 h-4" />;
  };

  // Búsqueda con ciudad_id
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (searchForm.ciudad_id) {
      params.append("ciudad_id", searchForm.ciudad_id);
    } else if (searchForm.region_id) {
      params.append("region_id", searchForm.region_id);
    }

    if (searchForm.propertyType) {
      params.append("type", searchForm.propertyType);
    }

    if (searchForm.priceRange) {
      params.append("price", searchForm.priceRange);
    }

    window.location.href = `/shop?${params.toString()}`;
  };

  // Formatear números con separadores de miles
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <section className="relative h-[600px] sm:h-[650px] md:h-[700px] lg:h-[800px] overflow-hidden bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/30 to-white/60 backdrop-blur-[2px]"></div>
          </div>

          {/* Content */}
          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center items-center z-20 pt-16 sm:pt-20">
            {/* Header Text */}
            <div className="text-center mb-6 sm:mb-8 max-w-4xl animate-fade-in px-4">
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-tight mb-3 sm:mb-4 drop-shadow-sm">
                {slide.title}
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 max-w-2xl mx-auto drop-shadow-sm">
                {slide.subtitle}
              </p>
            </div>

            {/* Search Card - Responsivo */}
            <div className="w-full max-w-5xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 animate-fade-in-delay">
              {/* Search Form */}
              <form
                onSubmit={handleSearch}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4"
              >
                {/* Region */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 sm:mb-2">
                    Región
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <select
                      value={searchForm.region_id}
                      onChange={(e) =>
                        setSearchForm({
                          ...searchForm,
                          region_id: e.target.value,
                          ciudad_id: "",
                        })
                      }
                      disabled={loadingLocations}
                      className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all appearance-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="">Todas</option>
                      {regions.map((region) => (
                        <option key={region.id} value={region.id}>
                          {region.nombre_region}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Ciudad */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 sm:mb-2">
                    Ciudad
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <select
                      value={searchForm.ciudad_id}
                      onChange={(e) =>
                        setSearchForm({
                          ...searchForm,
                          ciudad_id: e.target.value,
                        })
                      }
                      disabled={!searchForm.region_id || cities.length === 0}
                      className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all appearance-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="">
                        {!searchForm.region_id
                          ? "Selecciona región"
                          : cities.length === 0
                          ? "Cargando..."
                          : "Todas"}
                      </option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.nombre_ciudad}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Property Type */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 sm:mb-2">
                    Tipo
                  </label>
                  <div className="relative">
                    <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <select
                      value={searchForm.propertyType}
                      onChange={(e) =>
                        setSearchForm({
                          ...searchForm,
                          propertyType: e.target.value,
                        })
                      }
                      className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Todos</option>
                      <option value="Automóvil">Automóvil</option>
                      <option value="Camioneta">Camioneta</option>
                      <option value="Camión">Camión</option>
                      <option value="Motocicleta">Motocicleta</option>
                      <option value="Bus">Bus</option>
                      <option value="SUV">SUV</option>
                      <option value="Furgón">Furgón</option>
                      <option value="Van">Van</option>
                      <option value="Minibus">Minibus</option>
                      <option value="Tractor">Tractor</option>
                      <option value="Remolque">Remolque</option>
                      <option value="Casa Rodante">Casa Rodante</option>
                      <option value="Cuatrimoto">Cuatrimoto</option>
                      <option value="Scooter Eléctrico">
                        Scooter Eléctrico
                      </option>
                      <option value="Bicicleta Eléctrica">
                        Bicicleta Eléctrica
                      </option>
                    </select>
                  </div>
                </div>

                {/* Price Range */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 sm:mb-2">
                    Precio
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <select
                      value={searchForm.priceRange}
                      onChange={(e) =>
                        setSearchForm({
                          ...searchForm,
                          priceRange: e.target.value,
                        })
                      }
                      className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Todos</option>
                      <option value="0-5000000">$0 - $5M</option>
                      <option value="5000000-10000000">$5M - $10M</option>
                      <option value="10000000-15000000">$10M - $15M</option>
                      <option value="15000000-20000000">$15M - $20M</option>
                      <option value="20000000+">$20M+</option>
                    </select>
                  </div>
                </div>

                {/* Search Button */}
                <div className="flex items-end sm:col-span-2 lg:col-span-1">
                  <button
                    type="submit"
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 sm:py-3.5 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all hover:shadow-xl active:scale-95 sm:hover:scale-[1.02] flex items-center justify-center gap-2 group"
                  >
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-sm sm:text-base">Buscar</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Stats Cards - Responsivo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8 w-full max-w-5xl animate-fade-in-delay-2 px-4">
              {/* Total Users */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex -space-x-1.5 sm:-space-x-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white flex items-center justify-center">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 border-2 border-white flex items-center justify-center">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 border-2 border-white flex items-center justify-center">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    {loadingStats ? (
                      <div className="h-6 sm:h-8 w-12 sm:w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        {formatNumber(stats.totalUsers)}+
                      </h3>
                    )}
                    <p className="text-xs sm:text-sm text-gray-600">Usuarios</p>
                  </div>
                </div>
              </div>

              {/* Total Vehicles */}
              <div className="bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center">
                    <Car className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div>
                    {loadingStats ? (
                      <div className="h-6 sm:h-8 w-12 sm:w-16 bg-gray-700 animate-pulse rounded"></div>
                    ) : (
                      <h3 className="text-2xl sm:text-3xl font-bold text-white">
                        {formatNumber(stats.totalVehicles)}+
                      </h3>
                    )}
                    <p className="text-xs sm:text-sm text-gray-300">
                      Vehículos
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Companies */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                    <Building className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div>
                    {loadingStats ? (
                      <div className="h-6 sm:h-8 w-12 sm:w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        {formatNumber(stats.totalCompanies)}+
                      </h3>
                    )}
                    <p className="text-xs sm:text-sm text-gray-600">Empresas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows - Responsivo */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white hover:bg-gray-50 text-gray-900 rounded-full transition-all active:scale-95 sm:hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-900 flex items-center justify-center shadow-xl"
        aria-label="Anterior"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-2 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white hover:bg-gray-50 text-gray-900 rounded-full transition-all active:scale-95 sm:hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-900 flex items-center justify-center shadow-xl"
        aria-label="Siguiente"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Dots Indicator - Responsivo */}
      <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-1.5 sm:gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 sm:h-2.5 rounded-full transition-all focus:outline-none ${
              index === currentSlide
                ? "w-8 sm:w-10 bg-gray-900"
                : "w-2 sm:w-2.5 bg-gray-400 hover:bg-gray-600"
            }`}
            aria-label={`Ir a slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;
