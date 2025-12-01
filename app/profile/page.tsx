"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  LogOut,
  Mail,
  Phone,
  MapPin,
  Save,
  Edit2,
  Plus,
  List,
  Heart,
  Flag,
  AlertCircle,
  Bell,
  X,
  CheckCircle,
  Trash2,
  Loader2,
  ArrowRight,
  Star,
  MessageSquare,
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  created_at: string;
}

interface UserData {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string | null;
  rut: string;
  region_id: number | null;
  ciudad_id: number | null;
  ciudad_nombre?: string | null;
  region_nombre?: string | null;
  created_at: string;
  habilitado: boolean;
  rol?: string;
}

interface Notification {
  id: number;
  usuario_id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  referencia_id: number | null;
  leida: boolean;
  created_at: string;
}

interface Region {
  id: number;
  nombre_region: string;
  codigo_iso: string;
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

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    region_id: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  // ✅ OPTIMIZACIÓN 1: Cargar datos en paralelo
  useEffect(() => {
    let isMounted = true;

    const verifyAndLoad = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session || !session.user?.id) {
          if (isMounted) {
            setLoading(false);
            router.replace("/login");
          }
          return;
        }

        // ✅ Cargar TODO en paralelo
        const [
          { data: usuarioData, error: usuarioError },
          { data: regionesData },
          { data: notificacionesData },
        ] = await Promise.all([
          supabase
            .from("usuario")
            .select("*")
            .eq("id", session.user.id)
            .single(),
          supabase
            .from("region")
            .select("id, nombre_region, codigo_iso")
            .order("nombre_region"),
          supabase
            .from("notificacion")
            .select("*")
            .eq("usuario_id", session.user.id)
            .order("created_at", { ascending: false }),
        ]);

        if (!isMounted) return;

        if (usuarioError || !usuarioData) {
          setErrorMessage(
            "Error al cargar el perfil. Por favor recarga la página."
          );
          setLoading(false);
          return;
        }

        if (usuarioData.rol && usuarioData.rol !== "usuario") {
          setErrorMessage(
            "Acceso denegado. Esta sección es solo para usuarios."
          );
          setLoading(false);
          setTimeout(() => router.replace("/login"), 2000);
          return;
        }

        // ✅ Cargar nombres de región y ciudad en paralelo
        const [{ data: regionData }, { data: ciudadData }] = await Promise.all([
          supabase
            .from("region")
            .select("nombre_region")
            .eq("id", usuarioData.region_id)
            .single(),
          supabase
            .from("ciudad")
            .select("nombre_ciudad")
            .eq("id", usuarioData.ciudad_id)
            .single(),
        ]);

        setUser(session.user as UserProfile);
        setRegions(regionesData || []);
        setNotifications(notificacionesData || []);

        const userData: UserData = {
          ...usuarioData,
          region_nombre: regionData?.nombre_region || "",
          ciudad_nombre: ciudadData?.nombre_ciudad || "",
        };

        setUserData(userData);
        setFormData({
          nombre: usuarioData.nombre || "",
          apellido: usuarioData.apellido || "",
          telefono: usuarioData.telefono || "",
          region_id: usuarioData.region_id?.toString() || "",
        });

        setLoading(false);
      } catch (error) {
        console.error("Error general:", error);
        if (isMounted) {
          setErrorMessage("Error inesperado. Por favor recarga la página.");
          setLoading(false);
        }
      }
    };

    verifyAndLoad();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && isMounted) {
        router.replace("/login");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // ✅ Solo al montar

  // ✅ OPTIMIZACIÓN 2: Cargar calificaciones optimizado
  const loadReviews = useCallback(async () => {
    if (!user) return;

    setLoadingReviews(true);
    try {
      const { data: reviewsData, error } = await supabase
        .from("calificacion_usuario")
        .select("id, estrellas, comentario, created_at, comprador_id")
        .eq("vendedor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (reviewsData && reviewsData.length > 0) {
        // ✅ Cargar todos los compradores en UNA query
        const buyerIds = reviewsData.map((r) => r.comprador_id);
        const { data: buyersData } = await supabase
          .from("usuario")
          .select("id, nombre, apellido")
          .in("id", buyerIds);

        // ✅ Crear Map para lookup O(1)
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

        // Calcular promedio
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
    } finally {
      setLoadingReviews(false);
    }
  }, [user]);

  // ✅ OPTIMIZACIÓN 3: Recargar notificaciones optimizado
  const loadNotifications = useCallback(async () => {
    if (!user) return;

    setLoadingNotifications(true);
    try {
      const { data, error } = await supabase
        .from("notificacion")
        .select("*")
        .eq("usuario_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50); // ✅ Limitar a 50 notificaciones

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  }, [user]);

  // ✅ OPTIMIZACIÓN 4: Marcar como leída optimizado
  const markAsRead = useCallback(async (notificationId: number) => {
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
  }, []);

  // ✅ OPTIMIZACIÓN 5: Eliminar notificación optimizado
  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      await supabase.from("notificacion").delete().eq("id", notificationId);

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }, []);

  // ✅ OPTIMIZACIÓN 6: Memoizar contador de no leídas
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.leida).length,
    [notifications]
  );

  // ✅ OPTIMIZACIÓN 7: Memoizar formato de fecha
  const formatNotificationDate = useCallback((dateString: string) => {
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
  }, []);

  const handleSave = useCallback(async () => {
    if (!user || !userData) return;
    if (!formData.nombre || !formData.apellido) {
      setErrorMessage("Por favor completa al menos el nombre y apellido");
      return;
    }

    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("usuario")
        .update({
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          telefono: formData.telefono?.trim() || null,
          region_id: formData.region_id ? parseInt(formData.region_id) : null,
        })
        .eq("id", user.id);

      if (error) throw error;

      setSuccessMessage("Perfil actualizado exitosamente");
      setIsEditing(false);

      // ✅ CORRECCIÓN: Primero obtenemos el usuario actualizado
      const { data: usuarioActualizado } = await supabase
        .from("usuario")
        .select("*")
        .eq("id", user.id)
        .single();

      if (usuarioActualizado) {
        // ✅ Luego cargamos región y ciudad en paralelo
        const [{ data: regionData }, { data: ciudadData }] = await Promise.all([
          usuarioActualizado.region_id
            ? supabase
                .from("region")
                .select("nombre_region")
                .eq("id", usuarioActualizado.region_id)
                .single()
            : Promise.resolve({ data: null }),
          usuarioActualizado.ciudad_id
            ? supabase
                .from("ciudad")
                .select("nombre_ciudad")
                .eq("id", usuarioActualizado.ciudad_id)
                .single()
            : Promise.resolve({ data: null }),
        ]);

        setUserData({
          ...usuarioActualizado,
          region_nombre: regionData?.nombre_region || "",
          ciudad_nombre: ciudadData?.nombre_ciudad || "",
        });
      }

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      console.error("Error updating user:", error);
      setErrorMessage(
        error.message ||
          "Error al guardar el perfil. Por favor intenta nuevamente."
      );
    } finally {
      setSaving(false);
    }
  }, [user, userData, formData]);

  const confirmLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.replace("/login");
    } catch (error) {
      console.error("Error durante logout:", error);
      setLoggingOut(false);
    }
  }, [router]);

  // ✅ OPTIMIZACIÓN 8: Memoizar menu items
  const menuItems = useMemo(
    () => [
      {
        icon: Plus,
        label: "Publicar",
        description: "Nuevo vehículo",
        route: "/publication",
        color: "from-green-500 to-green-600",
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
    ],
    []
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gray-900 animate-spin" />
      </div>
    );
  }

  if (!user || !userData) {
    return null;
  }

  const fullName = `${userData.nombre} ${userData.apellido}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Mi Perfil</h1>
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
                      calificaciones)
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
                  <MessageSquare className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p className="font-semibold text-lg">
                    Aún no tienes calificaciones
                  </p>
                  <p className="text-sm mt-2">
                    Los usuarios podrán calificarte después de ver tus vehículos
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
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
                        <p className="text-sm text-gray-700 mt-2">
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

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-100 p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              ¿Cerrar sesión?
            </h3>
            <p className="text-gray-600 mb-6">
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

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {fullName}
              </h2>
              <p className="flex items-center gap-2 text-gray-600 text-sm">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              {isEditing ? "Cancelar" : "Editar"}
            </button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {menuItems.map((item) => (
              <button
                key={item.route}
                onClick={() => router.push(item.route)}
                className="group p-4 bg-white rounded-lg border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all text-left"
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
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* Profile Form */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Edit Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Información Personal
              </h3>

              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) =>
                        setFormData({ ...formData, nombre: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={formData.apellido}
                      onChange={(e) =>
                        setFormData({ ...formData, apellido: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      <Phone className="w-3.5 h-3.5 inline mr-1" />
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) =>
                        setFormData({ ...formData, telefono: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      <MapPin className="w-3.5 h-3.5 inline mr-1" />
                      Región
                    </label>
                    <select
                      value={formData.region_id}
                      onChange={(e) =>
                        setFormData({ ...formData, region_id: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                    >
                      <option value="">Selecciona región</option>
                      {regions.map((region) => (
                        <option key={region.id} value={region.id}>
                          {region.nombre_region}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      RUT (No editable)
                    </label>
                    <input
                      type="text"
                      value={userData.rut || ""}
                      disabled
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Correo (No editable)
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Guardar Cambios
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 h-fit">
            <h3 className="font-bold text-gray-900 mb-6 text-sm">
              Información de Cuenta
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Miembro desde</p>
                <p className="font-medium text-gray-900 text-sm">
                  {new Date(userData.created_at).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-600 mb-1">Estado</p>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                      userData.habilitado
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {userData.habilitado ? "Activa" : "Deshabilitada"}
                  </span>
                </div>
              </div>

              {userData.ciudad_nombre && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Ubicación</p>
                  <p className="font-medium text-gray-900 text-sm">
                    {userData.ciudad_nombre}
                    {userData.region_nombre && `, ${userData.region_nombre}`}
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
