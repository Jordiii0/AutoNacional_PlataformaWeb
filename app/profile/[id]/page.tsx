"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  User,
  Star,
  MapPin,
  Calendar,
  Car,
  MessageCircle,
  Loader2,
  ArrowLeft,
  X,
} from "lucide-react";

interface UserProfile {
  id: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  ciudad_nombre?: string;
  region_nombre?: string;
  created_at: string;
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

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
    checkCurrentUser();
  }, [userId]);

  const checkCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user?.id || null);
  };

  const loadUserData = async () => {
    try {
      setLoading(true);

      const { data: userData } = await supabase
        .from("usuario")
        .select("id, nombre, apellido, telefono, ciudad_id, region_id, created_at")
        .eq("id", userId)
        .single();

      if (!userData) {
        setLoading(false);
        return;
      }

      const [cityData, regionData] = await Promise.all([
        supabase
          .from("ciudad")
          .select("nombre_ciudad")
          .eq("id", userData.ciudad_id)
          .single(),
        supabase
          .from("region")
          .select("nombre_region")
          .eq("id", userData.region_id)
          .single(),
      ]);

      setProfile({
        ...userData,
        ciudad_nombre: cityData.data?.nombre_ciudad,
        region_nombre: regionData.data?.nombre_region,
      });

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
        .eq("vendedor_id", userId)
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
              comprador: buyerData || { nombre: "Usuario", apellido: "Anónimo" },
            };
          })
        );

        setReviews(reviewsWithBuyers);

        const avg =
          reviewsData.reduce((sum, r) => sum + r.estrellas, 0) /
          reviewsData.length;
        setAverageRating(avg);
      }

      const { data: vehiclesData } = await supabase
        .from("vehiculo")
        .select("id, marca, modelo, anio, precio")
        .eq("usuario_id", userId)
        .eq("oculto", false)
        .order("created_at", { ascending: false })
        .limit(6);

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
      console.error("Error loading user data:", error);
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
        <Loader2 className="w-12 h-12 text-gray-900 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Usuario no encontrado
          </h1>
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Volver atrás
          </button>
        </div>
      </div>
    );
  }

  const canReview = currentUser && currentUser !== userId;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4">
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
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl border border-gray-100 p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {profile.nombre[0]}
              {profile.apellido[0]}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {profile.nombre} {profile.apellido}
              </h1>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                {profile.ciudad_nombre && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>
                      {profile.ciudad_nombre}, {profile.region_nombre}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>
                    Miembro desde{" "}
                    {new Date(profile.created_at).toLocaleDateString("es-CL", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= averageRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-base font-semibold text-gray-900">
                  {averageRating > 0
                    ? averageRating.toFixed(1)
                    : "Sin calificaciones"}
                </span>
                <span className="text-sm text-gray-500">
                  ({reviews.length} {reviews.length === 1 ? "reseña" : "reseñas"})
                </span>
              </div>
            </div>

            {/* Review Button */}
            {canReview && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 flex-shrink-0"
              >
                <Star className="w-4 h-4" />
                Calificar
              </button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicles */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-gray-600" />
                Vehículos publicados ({vehicles.length})
              </h2>

              {vehicles.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Car className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Este usuario no tiene vehículos publicados
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      onClick={() => router.push(`/vehicle/${vehicle.id}`)}
                      className="border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="h-40 bg-gray-100 overflow-hidden">
                        {vehicle.images[0] ? (
                          <img
                            src={vehicle.images[0]}
                            alt={`${vehicle.marca} ${vehicle.modelo}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="w-10 h-10 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 text-sm line-clamp-1">
                          {vehicle.marca} {vehicle.modelo}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2">
                          {vehicle.anio}
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatPrice(vehicle.precio)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-gray-600" />
                Reseñas ({reviews.length})
              </h2>

              {reviews.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Este usuario aún no tiene reseñas
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {review.comprador.nombre} {review.comprador.apellido}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(review.created_at).toLocaleDateString(
                              "es-CL",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5">
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
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {review.comentario}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">
                Estadísticas
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Vehículos publicados
                  </span>
                  <span className="font-bold text-gray-900">
                    {vehicles.length}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-600">Calificaciones</span>
                  <span className="font-bold text-gray-900">
                    {reviews.length}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-600">Promedio</span>
                  <span className="font-bold text-yellow-500">
                    {averageRating > 0 ? `⭐ ${averageRating.toFixed(1)}` : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewModal
          vendedorId={userId}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            setShowReviewModal(false);
            loadUserData();
          }}
        />
      )}
    </div>
  );
}

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
        alert("Ya has calificado a este usuario");
      } else {
        alert("Error al enviar la calificación");
      }
      return;
    }

    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Calificar vendedor</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4 text-center">
            ¿Cómo fue tu experiencia?
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
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Comentario (opcional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Cuéntanos sobre tu experiencia..."
            rows={4}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="flex-1 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </div>
            ) : (
              "Enviar calificación"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
