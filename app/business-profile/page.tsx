"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Loader2,
  AlertCircle,
  LogOut,
  Edit2,
  X,
  CheckCircle,
  Building2,
  Phone,
  MapPin,
  Mail,
  Plus,
  List,
  Heart,
  Flag,
  Bell,
  Trash2,
  ArrowRight,
  Star,
  Globe,
  FileText,
  User,
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  created_at: string;
}

interface EmpresaData {
  id: string;
  nombre_comercial: string;
  rut_empresa: string;
  correo_electronico: string;
  telefono?: string;
  direccion?: string; // ✅ Nuevo
  representante_legal: string;
  rut_representante: string;
  telefono_representante?: string; // ✅ Nuevo
  region_id: number;
  ciudad_id: number;
  validada: boolean;
  region_nombre?: string;
  ciudad_nombre?: string;
  sitio_web?: string; // ✅ Nuevo
  descripcion?: string; // ✅ Nuevo
  created_at?: string;
  updated_at?: string;
  habilitado?: boolean;
}

interface Region {
  id: number;
  nombre_region: string;
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

interface Ciudad {
  id: number;
  nombre_ciudad: string;
  region_id: number;
}

interface Notification {
  id: number;
  empresa_id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  referencia_id: number | null;
  leida: boolean;
  created_at: string;
}

export default function BusinessProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [empresa, setEmpresa] = useState<EmpresaData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [session, setSession] = useState<any>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EmpresaData | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<Ciudad[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    checkAuth();
    loadRegions();
  }, []);

  useEffect(() => {
    if (empresa) {
      loadNotifications();
    }
  }, [empresa]);

  const checkAuth = async () => {
    const {
      data: { session: authSession },
    } = await supabase.auth.getSession();

    if (!authSession) {
      router.replace("/login");
      return;
    }

    try {
      const { data: empresaData, error: empresaError } = await supabase
        .from("empresa")
        .select("*")
        .eq("usuario_id", authSession.user.id)
        .single();

      if (empresaError || !empresaData) {
        setErrorMessage("No se encontraron datos de empresa");
        setLoading(false);
        return;
      }

      const [{ data: regionData }, { data: ciudadData }] = await Promise.all([
        supabase
          .from("region")
          .select("nombre_region")
          .eq("id", empresaData.region_id)
          .single(),
        supabase
          .from("ciudad")
          .select("nombre_ciudad")
          .eq("id", empresaData.ciudad_id)
          .single(),
      ]);

      setEmpresa({
        ...empresaData,
        region_nombre: regionData?.nombre_region || "",
        ciudad_nombre: ciudadData?.nombre_ciudad || "",
      });

      setSession(authSession);
      setLoading(false);
    } catch (error) {
      console.error("Error en checkAuth:", error);
      setErrorMessage("Error al cargar el perfil");
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    if (!empresa) return;

    setLoadingReviews(true);
    try {
      const { data: empresaData, error: empresaError } = await supabase
        .from("empresa")
        .select("usuario_id")
        .eq("id", empresa.id)
        .single();

      if (empresaError) throw empresaError;

      const vendedorId = empresaData?.usuario_id;

      if (!vendedorId) {
        setReviews([]);
        setAverageRating(0);
        setLoadingReviews(false);
        return;
      }

      const { data: reviewsData, error } = await supabase
        .from("calificacion_usuario")
        .select("id, estrellas, comentario, created_at, comprador_id")
        .eq("vendedor_id", vendedorId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (reviewsData && reviewsData.length > 0) {
        const buyerIds = reviewsData.map((r) => r.comprador_id);
        const { data: buyersData } = await supabase
          .from("usuario")
          .select("id, nombre, apellido")
          .in("id", buyerIds);

        const buyersMap = new Map(
          buyersData?.map((b) => [
            b.id,
            { nombre: b.nombre, apellido: b.apellido },
          ]) || []
        );

        const reviewsWithBuyers = reviewsData.map((review) => ({
          ...review,
          comprador: buyersMap.get(review.comprador_id) || {
            nombre: "Usuario",
            apellido: "Anónimo",
          },
        }));

        setReviews(reviewsWithBuyers);

        const avg =
          reviewsData.reduce((sum, r) => sum + r.estrellas, 0) /
          reviewsData.length;
        setAverageRating(avg);
      } else {
        setReviews([]);
        setAverageRating(0);
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
      setReviews([]);
      setAverageRating(0);
    } finally {
      setLoadingReviews(false);
    }
  };

  const loadRegions = async () => {
    const { data } = await supabase
      .from("region")
      .select("id, nombre_region")
      .order("nombre_region", { ascending: true });
    setRegions(data || []);
  };

  const loadCities = async (regionId?: number) => {
    let query = supabase.from("ciudad").select("id, nombre_ciudad, region_id");
    if (regionId) query = query.eq("region_id", regionId);
    const { data } = await query;
    setCities(data || []);
  };

  const loadNotifications = useCallback(async () => {
    if (!empresa) return;

    setLoadingNotifications(true);
    try {
      const { data, error } = await supabase
        .from("notificacion")
        .select("*")
        .eq("empresa_id", empresa.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  }, [empresa]);

  const markAsRead = async (notificationId: number) => {
    try {
      await supabase
        .from("notificacion")
        .update({ leida: true })
        .eq("id", notificationId);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, leida: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await supabase.from("notificacion").delete().eq("id", notificationId);

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.leida).length;

  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString("es-ES");
  };

  const startEditing = async () => {
    if (empresa) {
      setEditForm({ ...empresa });
      await loadCities(empresa.region_id);
      setIsEditing(true);
      setEditSuccess(false);
    }
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (!editForm) return;
    if (name === "region_id") {
      setEditForm((prev) =>
        prev
          ? {
              ...prev,
              region_id: parseInt(value),
              ciudad_id: 0,
            }
          : prev
      );
      loadCities(parseInt(value));
    } else if (name === "ciudad_id") {
      setEditForm((prev) =>
        prev ? { ...prev, ciudad_id: parseInt(value) } : prev
      );
    } else {
      setEditForm({ ...editForm, [name]: value });
    }
  };

  const handleSaveChanges = async () => {
    if (!editForm || !session) return;
    setEditLoading(true);
    try {
      const { error } = await supabase
        .from("empresa")
        .update({
          nombre_comercial: editForm.nombre_comercial,
          correo_electronico: editForm.correo_electronico,
          telefono: editForm.telefono,
          direccion: editForm.direccion, // ✅ Nuevo
          representante_legal: editForm.representante_legal,
          rut_representante: editForm.rut_representante,
          telefono_representante: editForm.telefono_representante, // ✅ Nuevo
          region_id: editForm.region_id,
          ciudad_id: editForm.ciudad_id,
          sitio_web: editForm.sitio_web, // ✅ Nuevo
          descripcion: editForm.descripcion, // ✅ Nuevo
        })
        .eq("id", editForm.id);

      if (error) throw error;

      const ciudadNombre =
        cities.find((c) => c.id === editForm.ciudad_id)?.nombre_ciudad || "";
      const regionNombre =
        regions.find((r) => r.id === editForm.region_id)?.nombre_region || "";

      setEmpresa({
        ...editForm,
        ciudad_nombre: ciudadNombre,
        region_nombre: regionNombre,
      });
      setIsEditing(false);
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 3000);
    } catch (error: any) {
      alert("Error al actualizar: " + error.message);
    } finally {
      setEditLoading(false);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  const confirmLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      setTimeout(() => {
        router.replace("/login");
      }, 300);
    } catch (error) {
      console.error("Error durante logout:", error);
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gray-900 animate-spin" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 rounded-lg"
          >
            Ir al Inicio
          </button>
        </div>
      </div>
    );
  }

  if (!empresa || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sin Datos</h2>
          <p className="text-gray-600 mb-6">
            No se encontraron datos de empresa
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 rounded-lg"
          >
            Ir al Inicio
          </button>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      icon: Plus,
      label: "Publicar",
      description: "Nuevo vehículo",
      route: "/publication",
      color: "from-green-500 to-green-600",
      disabled: !empresa.validada,
    },
    {
      icon: List,
      label: "Mis Publicaciones",
      description: "Gestionar publicaciones",
      route: "/mypost",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Heart,
      label: "Favoritos",
      description: "Vehículos guardados",
      route: "/favorites",
      color: "from-pink-500 to-pink-600",
    },
    {
      icon: Flag,
      label: "Reportes",
      description: "Reportes que has hecho",
      route: "/my-reports",
      color: "from-red-500 to-red-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Mi Empresa</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end">
          <div className="bg-white w-full max-w-md h-screen shadow-2xl flex flex-col">
            <div className="bg-gray-900 text-white p-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6" />
                <h2 className="text-xl font-bold">Notificaciones</h2>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-1 hover:bg-white/20 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingNotifications ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="w-8 h-8 text-gray-900 animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No hay notificaciones</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 ${
                        !notif.leida
                          ? "bg-blue-50 border-l-4 border-blue-600"
                          : ""
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {notif.titulo}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {notif.mensaje}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatNotificationDate(notif.created_at)}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {!notif.leida && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          Marcar como leída
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-100 p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              ¿Cerrar sesión?
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              ¿Estás seguro de que deseas cerrar sesión?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={loggingOut}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmLogout}
                disabled={loggingOut}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cerrando...
                  </>
                ) : (
                  "Sí, salir"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Modal */}
      {showReviewsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-100 w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="bg-gray-900 text-white p-6 flex justify-between items-center rounded-t-xl">
              <div className="flex items-center gap-3">
                <Star className="w-6 h-6 fill-white" />
                <div>
                  <h2 className="text-xl font-bold">Mis Calificaciones</h2>
                  {reviews.length > 0 && (
                    <p className="text-sm opacity-90">
                      Promedio: {averageRating.toFixed(1)} ⭐ ({reviews.length}{" "}
                      reseñas)
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowReviewsModal(false)}
                className="p-1 hover:bg-white/20 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingReviews ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="w-8 h-8 text-gray-900 animate-spin" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Star className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="font-medium text-lg">
                    Aún no tienes calificaciones
                  </p>
                  <p className="text-sm mt-2">
                    Los usuarios podrán calificarte después de interactuar
                    contigo
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-2">
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
                        <p className="text-gray-700 text-sm mt-2">
                          {review.comentario}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {empresa.nombre_comercial}
              </h2>
              <div className="flex flex-col gap-1.5 text-sm">
                <p className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  {empresa.correo_electronico}
                </p>
                {empresa.telefono && (
                  <p className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    {empresa.telefono}
                  </p>
                )}
                {/* ✅ Mostrar dirección */}
                {empresa.direccion && (
                  <p className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {empresa.direccion}
                  </p>
                )}
                {/* ✅ Mostrar sitio web */}
                {empresa.sitio_web && (
                  <a
                    href={empresa.sitio_web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    <Globe className="w-4 h-4" />
                    {empresa.sitio_web}
                  </a>
                )}
              </div>
            </div>
            <button
              onClick={isEditing ? cancelEditing : startEditing}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              {isEditing ? "Cancelar" : "Editar"}
            </button>
          </div>

          {/* ✅ Mostrar descripción */}
          {empresa.descripcion && !isEditing && (
            <div className="mb-6 p-4 bg-white rounded-lg border border-gray-100">
              <div className="flex items-start gap-2 text-gray-600">
                <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{empresa.descripcion}</p>
              </div>
            </div>
          )}

          {/* Validation Status */}
          {empresa.validada ? (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-green-700 font-medium text-sm">
                ✅ Tu empresa ha sido validada exitosamente
              </p>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <p className="text-yellow-700 font-medium text-sm">
                ⚠️ Tu empresa aún no ha sido validada
              </p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {menuItems.map((item) => (
              <button
                key={item.route}
                onClick={() => router.push(item.route)}
                disabled={item.disabled}
                className={`group p-4 bg-white rounded-lg border border-gray-100 ${
                  item.disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:border-gray-300 hover:shadow-md"
                } transition-all text-left`}
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-gray-900 transition-colors">
                  <item.icon className="w-5 h-5 text-gray-700 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  {item.label}
                </h3>
                <p className="text-xs text-gray-500">{item.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        {editSuccess && (
          <div className="mb-6 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            Cambios guardados exitosamente
          </div>
        )}

        {/* Profile Forms */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Edit Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Información de la Empresa
              </h3>

              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Nombre Comercial
                    </label>
                    <input
                      type="text"
                      name="nombre_comercial"
                      value={
                        editForm?.nombre_comercial ?? empresa.nombre_comercial
                      }
                      onChange={handleEditChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      RUT Empresa (No editable)
                    </label>
                    <input
                      type="text"
                      value={empresa.rut_empresa}
                      disabled
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      <Mail className="w-3.5 h-3.5 inline mr-1" />
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      name="correo_electronico"
                      value={
                        editForm?.correo_electronico ??
                        empresa.correo_electronico
                      }
                      onChange={handleEditChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      <Phone className="w-3.5 h-3.5 inline mr-1" />
                      Teléfono Empresa
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={editForm?.telefono ?? empresa.telefono ?? ""}
                      onChange={handleEditChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>
                </div>

                {/* ✅ Nuevos campos: Dirección y Sitio Web */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      <MapPin className="w-3.5 h-3.5 inline mr-1" />
                      Dirección
                    </label>
                    <input
                      type="text"
                      name="direccion"
                      value={editForm?.direccion ?? empresa.direccion ?? ""}
                      onChange={handleEditChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      <Globe className="w-3.5 h-3.5 inline mr-1" />
                      Sitio Web
                    </label>
                    <input
                      type="url"
                      name="sitio_web"
                      value={editForm?.sitio_web ?? empresa.sitio_web ?? ""}
                      onChange={handleEditChange}
                      disabled={!isEditing}
                      placeholder="https://miempresa.com"
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>
                </div>

                {/* ✅ Nuevo campo: Descripción */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    <FileText className="w-3.5 h-3.5 inline mr-1" />
                    Descripción de la Empresa
                  </label>
                  <textarea
                    name="descripcion"
                    value={editForm?.descripcion ?? empresa.descripcion ?? ""}
                    onChange={handleEditChange}
                    disabled={!isEditing}
                    rows={3}
                    placeholder="Describe tu empresa, servicios y experiencia..."
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-4 h-4 text-gray-600" />
                    <h4 className="text-sm font-semibold text-gray-900">
                      Representante Legal
                    </h4>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        name="representante_legal"
                        value={
                          editForm?.representante_legal ??
                          empresa.representante_legal
                        }
                        onChange={handleEditChange}
                        disabled={!isEditing}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        RUT
                      </label>
                      <input
                        type="text"
                        name="rut_representante"
                        value={
                          editForm?.rut_representante ??
                          empresa.rut_representante
                        }
                        onChange={handleEditChange}
                        disabled={!isEditing}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                      />
                    </div>
                  </div>

                  {/* ✅ Nuevo campo: Teléfono Representante */}
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      <Phone className="w-3.5 h-3.5 inline mr-1" />
                      Teléfono Representante
                    </label>
                    <input
                      type="tel"
                      name="telefono_representante"
                      value={
                        editForm?.telefono_representante ??
                        empresa.telefono_representante ??
                        ""
                      }
                      onChange={handleEditChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={cancelEditing}
                      disabled={editLoading}
                      className="flex-1 px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      disabled={editLoading}
                      className="flex-1 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {editLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        "Guardar Cambios"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info Sidebar */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 h-fit">
            <h3 className="font-bold text-gray-900 mb-6 text-sm">
              Información de Cuenta
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Estado</p>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                      empresa.habilitado
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {empresa.habilitado ? "Habilitado" : "Deshabilitado"}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-600 mb-1">Validación</p>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                      empresa.validada
                        ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {empresa.validada ? "Validada" : "Pendiente"}
                  </span>
                </div>
              </div>

              {empresa.ciudad_nombre && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Ubicación</p>
                  <p className="font-medium text-gray-900 text-sm">
                    {empresa.ciudad_nombre}, {empresa.region_nombre}
                  </p>
                </div>
              )}

              {empresa.created_at && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-600 mb-1">Miembro desde</p>
                  <p className="font-medium text-gray-900 text-sm">
                    {new Date(empresa.created_at).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 space-y-2">
                <button
                  onClick={() => {
                    setShowReviewsModal(true);
                    loadReviews();
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Ver Calificaciones
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => router.push("/reset-password")}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span>Cambiar Contraseña</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
