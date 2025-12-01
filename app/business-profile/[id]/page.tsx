"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Building,
  Star,
  MapPin,
  Calendar,
  Car,
  MessageCircle,
  Loader2,
  Phone,
  Mail,
  Globe,
  Users,
  Award,
} from "lucide-react";

interface CompanyProfile {
  id: string;
  nombre_comercial: string;
  razon_social: string;
  rut_empresa: string;
  telefono?: string;
  correo_electronico?: string;
  sitio_web?: string;
  descripcion?: string;
  ciudad_nombre?: string;
  region_nombre?: string;
  created_at: string;
  usuario_id: string; // ✅ Agregado para las calificaciones
}

interface Review {
  id: number;
  estrellas: number;
  comentario: string;
  created_at: string;
  comprador: {
    nombre: string;
    apellido: string;
  };
}

interface Vehicle {
  id: number;
  marca: string;
  modelo: string;
  anio: number;
  precio: number;
  images: string[];
}

export default function CompanyProfilePage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    loadCompanyData();
    checkCurrentUser();
  }, [companyId]);

  const checkCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user?.id || null);
  };

const loadCompanyData = async () => {
  try {
    setLoading(true);

    console.log("🔍 Company ID recibido:", companyId);
    console.log("🔍 Tipo de Company ID:", typeof companyId);
    console.log("🔍 Longitud del ID:", companyId?.length);

    // Intentar buscar
    const { data: companyData, error: companyError } = await supabase
      .from("empresa")
      .select("*")
      .eq("id", companyId)
      .single();

    console.log("📊 Company Data encontrado:", companyData);
    console.log("❌ Company Error:", companyError);

    // Si no encuentra, intentar listar todas las empresas para debug
    if (!companyData) {
      console.log("⚠️ No se encontró empresa, listando todas...");
      const { data: allCompanies } = await supabase
        .from("empresa")
        .select("id, nombre_comercial")
        .limit(5);
      console.log("📋 Primeras 5 empresas:", allCompanies);
    }

    if (companyError || !companyData) {
      console.error("Error loading company:", companyError);
      setLoading(false);
      return;
    }

      // Cargar ciudad y región
      const [cityData, regionData] = await Promise.all([
        supabase
          .from("ciudad")
          .select("nombre_ciudad")
          .eq("id", companyData.ciudad_id)
          .single(),
        supabase
          .from("region")
          .select("nombre_region")
          .eq("id", companyData.region_id)
          .single(),
      ]);

      setCompany({
        ...companyData,
        ciudad_nombre: cityData.data?.nombre_ciudad,
        region_nombre: regionData.data?.nombre_region,
      });

      // ✅ Calificaciones por usuario_id
      const { data: reviewsData } = await supabase
        .from("calificacion_usuario")
        .select(
          `
        id,
        estrellas,
        comentario,
        created_at,
        comprador_id
      `
        )
        .eq("vendedor_id", companyData.usuario_id) // ✅ Usar usuario_id
        .order("created_at", { ascending: false });

      if (reviewsData && reviewsData.length > 0) {
        const reviewsWithBuyers = await Promise.all(
          reviewsData.map(async (review) => {
            const { data: buyerData } = await supabase
              .from("usuario")
              .select("nombre, apellido")
              .eq("id", review.comprador_id)
              .single();

            return {
              ...review,
              comprador: buyerData || {
                nombre: "Usuario",
                apellido: "Anónimo",
              },
            };
          })
        );

        setReviews(reviewsWithBuyers);

        const avg =
          reviewsData.reduce((sum, r) => sum + r.estrellas, 0) /
          reviewsData.length;
        setAverageRating(avg);
      }

      // ✅ Vehículos por empresa_id (que es el ID de la empresa)
      const { data: vehiclesData } = await supabase
        .from("vehiculo")
        .select("id, marca, modelo, anio, precio")
        .eq("empresa_id", companyId) // ✅ Usar el ID UUID de empresa
        .eq("oculto", false)
        .order("created_at", { ascending: false })
        .limit(8);

      if (vehiclesData) {
        const vehiclesWithImages = await Promise.all(
          vehiclesData.map(async (vehicle) => {
            const { data: images } = await supabase
              .from("imagen_vehiculo")
              .select("url_imagen")
              .eq("vehiculo_id", vehicle.id)
              .limit(1);

            return {
              ...vehicle,
              images: images?.map((img) => img.url_imagen) || [],
            };
          })
        );

        setVehicles(vehiclesWithImages);
      }
    } catch (error) {
      console.error("Error loading company data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Empresa no encontrada
          </h1>
        </div>
      </div>
    );
  }

  // ✅ Comparar con usuario_id para saber si puede calificar
  const canReview = currentUser && currentUser !== company.usuario_id;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header de la Empresa */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-6 text-white">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Logo/Ícono */}
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-indigo-600">
              <Building className="w-12 h-12" />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">
                  {company.nombre_comercial}
                </h1>
                <Award className="w-6 h-6 text-yellow-300" />
              </div>
              <p className="text-indigo-100 mb-3">{company.razon_social}</p>

              <div className="flex flex-wrap gap-4 text-sm">
                {company.ciudad_nombre && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {company.ciudad_nombre}, {company.region_nombre}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Desde{" "}
                    {new Date(company.created_at).toLocaleDateString("es-CL", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= averageRating
                          ? "fill-yellow-300 text-yellow-300"
                          : "text-white/30"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-semibold">
                  {averageRating > 0
                    ? averageRating.toFixed(1)
                    : "Sin calificaciones"}
                </span>
                <span className="text-white/80">
                  ({reviews.length} reseñas)
                </span>
              </div>
            </div>

            {/* Botón de calificar */}
            {canReview && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="px-6 py-3 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors font-semibold flex items-center gap-2 whitespace-nowrap"
              >
                <Star className="w-5 h-5" />
                Calificar empresa
              </button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Descripción */}
            {company.descripcion && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Acerca de Nosotros
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {company.descripcion}
                </p>
              </div>
            )}

            {/* Vehículos publicados */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Car className="w-6 h-6 text-indigo-600" />
                  Vehículos Disponibles ({vehicles.length})
                </h2>
                {vehicles.length > 8 && (
                  <button
                    onClick={() => router.push(`/shop?empresa=${companyId}`)}
                    className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                  >
                    Ver todos →
                  </button>
                )}
              </div>

              {vehicles.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Esta empresa no tiene vehículos publicados actualmente
                </p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      onClick={() => router.push(`/vehicle/${vehicle.id}`)}
                      className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <div className="h-48 bg-gray-200 relative overflow-hidden">
                        {vehicle.images[0] ? (
                          <img
                            src={vehicle.images[0]}
                            alt={`${vehicle.marca} ${vehicle.modelo}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 mb-1">
                          {vehicle.marca} {vehicle.modelo}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {vehicle.anio}
                        </p>
                        <p className="text-xl font-bold text-indigo-600">
                          {formatPrice(vehicle.precio)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reseñas */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-indigo-600" />
                Reseñas de Clientes ({reviews.length})
              </h2>

              {reviews.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Esta empresa aún no tiene reseñas
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-gray-200 pb-4 last:border-0"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {review.comprador.nombre}{" "}
                            {review.comprador.apellido}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(review.created_at).toLocaleDateString(
                              "es-CL",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.estrellas
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comentario && (
                        <p className="text-gray-700 text-sm">
                          {review.comentario}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Información de Contacto */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600" />
                Información de Contacto
              </h3>

              <div className="space-y-4">
                {company.telefono && (
                  <a
                    href={`tel:${company.telefono}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Teléfono</p>
                      <p className="font-semibold text-gray-900">
                        {company.telefono}
                      </p>
                    </div>
                  </a>
                )}

                {company.correo_electronico && (
                  <a
                    href={`mailto:${company.correo_electronico}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Email</p>
                      <p className="font-semibold text-gray-900 text-sm break-all">
                        {company.correo_electronico}
                      </p>
                    </div>
                  </a>
                )}

                {company.sitio_web && (
                  <a
                    href={company.sitio_web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <Globe className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Sitio Web</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        Visitar sitio →
                      </p>
                    </div>
                  </a>
                )}
              </div>
            </div>

            {/* Estadísticas */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Estadísticas
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Vehículos activos
                  </span>
                  <span className="font-bold text-gray-900">
                    {vehicles.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Calificaciones
                  </span>
                  <span className="font-bold text-gray-900">
                    {reviews.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Promedio
                  </span>
                  <span className="font-bold text-yellow-500">
                    {averageRating > 0
                      ? `⭐ ${averageRating.toFixed(1)}`
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Datos legales */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <h3 className="text-sm font-bold text-gray-800 mb-3">
                Datos Legales
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600">RUT</p>
                  <p className="font-semibold text-gray-900">
                    {company.rut_empresa}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Razón Social</p>
                  <p className="font-semibold text-gray-900">
                    {company.razon_social}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de calificación */}
      {showReviewModal && (
        <ReviewModal
          vendedorId={company.usuario_id} // ✅ Pasar usuario_id para calificación
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            setShowReviewModal(false);
            loadCompanyData();
          }}
        />
      )}
    </div>
  );
}

// Componente del Modal de Reseña
function ReviewModal({
  vendedorId,
  onClose,
  onSuccess,
}: {
  vendedorId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Por favor selecciona una calificación");
      return;
    }

    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Debes iniciar sesión");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("calificacion_usuario").insert({
      vendedor_id: vendedorId,
      comprador_id: user.id,
      estrellas: rating,
      comentario: comment || null,
    });

    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        alert("Ya has calificado a esta empresa");
      } else {
        alert("Error al enviar la calificación");
      }
      return;
    }

    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Calificar Empresa
        </h2>

        <div className="mb-6">
          <p className="text-gray-700 mb-3 text-center">
            ¿Cómo fue tu experiencia con esta empresa?
          </p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-10 h-10 ${
                    star <= (hoveredStar || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comentario (opcional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Cuéntanos sobre tu experiencia con esta empresa..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Enviando..." : "Enviar calificación"}
          </button>
        </div>
      </div>
    </div>
  );
}
