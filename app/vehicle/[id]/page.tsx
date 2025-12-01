"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Loader2,
  Car,
  Tag,
  MapPin,
  Calendar,
  Gauge,
  User,
  Phone,
  Fuel,
  Ruler,
  Cog,
  Heart,
  Share2,
  X,
  Building,
  Flag,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// --- INTERFACES ---

interface SellerProfile {
  id: string;
  nombre: string;
  apellido: string;
  correo_electronico?: string;
  telefono?: string;
  ciudad?: string;
  region_nombre?: string;
  tipo: "usuario" | "empresa";
}

interface Company {
  id: string;
  nombre_comercial: string;
  telefono: string | null;
  correo_electronico: string | null;
}

interface Vehicle {
  id: number;
  precio: number;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number;
  transmision: string;
  descripcion: string;
  cilindrada: number;
  created_at: string;
  usuario_id: string | null;
  empresa_id: string | null;
  tipo_combustible: string;
  tipo_vehiculo: string;
  ciudad_nombre: string;
  region_nombre: string;
  images: string[];
}

// --- CONSTANTES ---

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(price);

// --- COMPONENTE PRINCIPAL ---

export default function VehicleDetailPage() {
  const vehicleId = parseInt(useParams().id as string);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const regionsCache = useRef(new Map<number, string>());

  useEffect(() => {
    if (vehicleId) {
      fetchVehicle();
      checkFavorite();
    }
  }, [vehicleId]);

  const fetchVehicle = async () => {
    try {
      setLoading(true);

      const [regions, cities, fuels, types] = await Promise.all([
        supabase.from("region").select("id, nombre_region"),
        supabase.from("ciudad").select("id, nombre_ciudad, region_id"),
        supabase.from("tipo_combustible").select("id, nombre_combustible"),
        supabase.from("tipo_vehiculo").select("id, nombre_tipo"),
      ]);

      const regionMap = new Map(
        (regions.data || []).map((r: any) => [r.id, r.nombre_region])
      );
      regionsCache.current = regionMap;

      const cityMap = new Map((cities.data || []).map((c: any) => [c.id, c]));

      const { data: vehicleData, error: vehicleError } = await supabase
        .from("vehiculo")
        .select("*")
        .eq("id", vehicleId)
        .single();

      if (vehicleError || !vehicleData) {
        console.error("Error loading vehicle:", vehicleError);
        setVehicle(null);
        setLoading(false);
        return;
      }

      let sellerData: SellerProfile | null = null;

      if (vehicleData.usuario_id && vehicleData.usuario_id !== null) {
        try {
          const { data: userData, error: userError } = await supabase
            .from("usuario")
            .select("id, nombre, apellido, telefono, ciudad_id, region_id")
            .eq("id", vehicleData.usuario_id)
            .single();

          if (userData) {
            const city = cityMap.get(userData.ciudad_id);
            sellerData = {
              id: userData.id,
              nombre: userData.nombre || "",
              apellido: userData.apellido || "",
              telefono: userData.telefono,
              ciudad: city?.nombre_ciudad || "Desconocida",
              region_nombre: regionMap.get(userData.region_id) || "Desconocida",
              tipo: "usuario",
            };
          }
        } catch (error) {
          console.error("Error al cargar usuario:", error);
        }
      } else if (vehicleData.empresa_id && vehicleData.empresa_id !== null) {
        try {
          const { data: companyData, error: companyError } = await supabase
            .from("empresa")
            .select(
              "id, usuario_id, nombre_comercial, correo_electronico, telefono, ciudad_id, region_id"
            )
            .eq("id", vehicleData.empresa_id)
            .single();

          if (companyData) {
            const city = cityMap.get(companyData.ciudad_id);
            setCompany(companyData);
            sellerData = {
              id: companyData.id,
              nombre: companyData.nombre_comercial || "",
              apellido: "",
              correo_electronico: companyData.correo_electronico || "",
              telefono: companyData.telefono,
              ciudad: city?.nombre_ciudad || "Desconocida",
              region_nombre:
                regionMap.get(companyData.region_id) || "Desconocida",
              tipo: "empresa",
            };
          }
        } catch (error) {
          console.error("Error al cargar empresa:", error);
        }
      }

      if (sellerData) {
        setSeller(sellerData);
      }

      const { data: images } = await supabase
        .from("imagen_vehiculo")
        .select("url_imagen")
        .eq("vehiculo_id", vehicleId);

      const getCatalogName = (id: number | null, catalog: any[], key: string) =>
        id
          ? catalog.find((item: any) => item.id === id)?.[key] || "Desconocido"
          : "N/A";

      setVehicle({
        ...vehicleData,
        tipo_combustible: getCatalogName(
          vehicleData.tipo_combustible_id,
          fuels.data || [],
          "nombre_combustible"
        ),
        tipo_vehiculo: getCatalogName(
          vehicleData.tipo_vehiculo_id,
          types.data || [],
          "nombre_tipo"
        ),
        ciudad_nombre: getCatalogName(
          vehicleData.ciudad_id,
          cities.data || [],
          "nombre_ciudad"
        ),
        region_nombre: regionMap.get(vehicleData.region_id) || "Desconocida",
        images: images?.map((img: any) => img.url_imagen) || [],
      });
    } catch (error) {
      console.error("Error loading vehicle:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("favorito")
        .select("id")
        .eq("usuario_id", user.id)
        .eq("vehiculo_id", vehicleId)
        .maybeSingle();

      setIsFavorite(!!data);
    } catch (error) {}
  };

  const toggleFavorite = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert("Debes iniciar sesión");
      return;
    }

    try {
      if (isFavorite) {
        await supabase
          .from("favorito")
          .delete()
          .eq("usuario_id", user.id)
          .eq("vehiculo_id", vehicleId);
      } else {
        await supabase
          .from("favorito")
          .insert({ usuario_id: user.id, vehiculo_id: vehicleId });
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const shareVehicle = async () => {
    const text = `${vehicle?.marca} ${vehicle?.modelo} - ${formatPrice(
      vehicle?.precio || 0
    )}`;
    if (navigator.share) {
      await navigator.share({
        title: "Vehículo",
        text,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("Enlace copiado al portapapeles");
    }
  };

  const nextImage = () => {
    if (vehicle && vehicle.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === vehicle.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (vehicle && vehicle.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? vehicle.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) return <LoadingScreen />;
  if (!vehicle) return <NotFoundScreen />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {vehicle.marca} {vehicle.modelo} {vehicle.anio}
          </h1>
          <p className="text-3xl font-bold text-gray-900 mb-3">
            {formatPrice(vehicle.precio)}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>
                {vehicle.ciudad_nombre}, {vehicle.region_nombre}
              </span>
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>
                Publicado el{" "}
                {new Date(vehicle.created_at).toLocaleDateString("es-CL", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="relative h-96 bg-gray-100">
                {vehicle.images.length > 0 ? (
                  <>
                    <img
                      src={vehicle.images[currentImageIndex]}
                      alt={`${vehicle.marca} ${vehicle.modelo}`}
                      className="w-full h-full object-cover"
                    />
                    {vehicle.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-900" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-900" />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {vehicle.images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                index === currentImageIndex
                                  ? "bg-white w-6"
                                  : "bg-white/50"
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="w-16 h-16 text-gray-300" />
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Descripción
              </h2>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {vehicle.descripcion || "Sin descripción disponible"}
              </p>
            </div>

            {/* Specifications */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Especificaciones
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Spec icon={Calendar} label="Año" value={vehicle.anio} />
                <Spec
                  icon={Gauge}
                  label="Kilometraje"
                  value={`${vehicle.kilometraje.toLocaleString()} km`}
                />
                <Spec
                  icon={Cog}
                  label="Transmisión"
                  value={vehicle.transmision}
                />
                <Spec
                  icon={Fuel}
                  label="Combustible"
                  value={vehicle.tipo_combustible}
                />
                <Spec
                  icon={Ruler}
                  label="Cilindrada"
                  value={`${vehicle.cilindrada} cc`}
                />
                <Spec icon={Tag} label="Tipo" value={vehicle.tipo_vehiculo} />
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Seller Card */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                {company ? (
                  <Building className="w-5 h-5 text-gray-600" />
                ) : (
                  <User className="w-5 h-5 text-gray-600" />
                )}
                <h3 className="text-sm font-bold text-gray-900">
                  {company ? "Empresa" : "Vendedor Particular"}
                </h3>
              </div>

              {seller ? (
                <div className="space-y-4">
                  <p className="text-lg font-bold text-gray-900">
                    {seller.tipo === "empresa"
                      ? seller.nombre
                      : `${seller.nombre} ${seller.apellido}`}
                  </p>

                  {seller.ciudad && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600 mb-0.5">
                          Ubicación
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {seller.ciudad}, {seller.region_nombre}
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setShowContactModal(true)}
                    className="w-full bg-gray-900 text-white text-sm font-medium py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Ver Contacto
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Información no disponible
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={toggleFavorite}
                  className={`flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    isFavorite
                      ? "bg-red-50 text-red-600 border border-red-200"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${isFavorite ? "fill-red-600" : ""}`}
                  />
                  {isFavorite ? "Guardado" : "Guardar"}
                </button>
                <button
                  onClick={shareVehicle}
                  className="flex items-center justify-center gap-2 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </button>
              </div>
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 text-sm font-medium transition-colors"
              >
                <Flag className="w-4 h-4" />
                Reportar publicación
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showContactModal && (
        <ContactModal
          seller={seller}
          company={company}
          onClose={() => setShowContactModal(false)}
        />
      )}
      {showReportModal && (
        <ReportModal
          vehicleId={vehicleId}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}

// --- COMPONENTES AUXILIARES ---

const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <Loader2 className="w-12 h-12 text-gray-900 animate-spin" />
  </div>
);

const NotFoundScreen = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <Car className="w-8 h-8 text-gray-400" />
    </div>
    <h1 className="text-2xl font-bold text-gray-900 mb-2">
      Vehículo no encontrado
    </h1>
    <p className="text-gray-600 text-sm mb-6">
      El vehículo que buscas no está disponible
    </p>
    <button
      onClick={() => window.history.back()}
      className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
    >
      Volver atrás
    </button>
  </div>
);

const Spec = ({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | number;
}) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-gray-400" />
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
    <span className="text-sm font-semibold text-gray-900">{value}</span>
  </div>
);

const ContactModal = ({ seller, company, onClose }: any) => {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Información de Contacto</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-lg font-bold text-gray-900 mb-1">
              {company ? seller.nombre : `${seller.nombre} ${seller.apellido}`}
            </p>
            <p className="text-xs text-gray-500">
              {company ? "Empresa" : "Vendedor particular"}
            </p>
          </div>

          {seller.telefono && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Teléfono</p>
              <p className="font-semibold text-gray-900">{seller.telefono}</p>
            </div>
          )}
          {seller.correo_electronico && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Correo electrónico</p>
              <p className="font-semibold text-gray-900 text-sm break-all">
                {seller.correo_electronico}
              </p>
            </div>
          )}

          <button
            onClick={() => {
              if (seller.tipo === "empresa") {
                router.push(`/business-profile/${seller.id}`);
              } else {
                router.push(`/profile/${seller.id}`);
              }
            }}
            className="w-full bg-gray-100 text-gray-900 text-sm font-medium py-3 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Ver perfil {seller.tipo === "empresa" ? "de la empresa" : "del vendedor"}
          </button>

          <button
            onClick={onClose}
            className="w-full bg-gray-900 text-white text-sm font-medium py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

const ReportModal = ({ vehicleId, onClose }: any) => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !description) return;

    setIsLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("reporte").insert({
        vehiculo_id: vehicleId,
        usuario_id: user.id,
        motivo: reason,
        descripcion: description,
        estado: "pendiente",
      });
      setIsLoading(false);
      alert("Reporte enviado exitosamente");
      onClose();
    } else {
      alert("Debes iniciar sesión para reportar");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Reportar Publicación</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Motivo del reporte
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
            >
              <option value="">Selecciona un motivo</option>
              <option value="spam">Spam</option>
              <option value="estafa">Posible estafa</option>
              <option value="danado">Vehículo dañado/accidentado</option>
              <option value="falso">Información falsa</option>
              <option value="ofensivo">Contenido ofensivo</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Descripción detallada
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explica el motivo de tu reporte..."
              rows={4}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !reason || !description}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </div>
              ) : (
                "Enviar Reporte"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
