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
  User,
  Calendar,
  Shield,
  Settings,
  Award,
  Palette,
  Sun,
  Moon,
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

interface Ciudad {
  id: number;
  nombre_ciudad: string;
  region_id: number;
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

type Theme = "light" | "dark" | "blue" | "green" | "purple" | "orange";

interface ThemeConfig {
  name: string;
  icon: React.ReactNode;
  header: string;
  headerText: string;
  avatar: string;
  button: string;
  background: string;
  card: string;
  cardText: string;
  border: string;
  input: string;
  focus: string;
  stats: string[];
  gradients: string[];
}

const themes: Record<Theme, ThemeConfig> = {
  light: {
    name: "Claro",
    icon: <Sun className="w-5 h-5" />,
    header: "bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-600",
    headerText: "text-white",
    avatar: "bg-gradient-to-br from-pink-500 to-fuchsia-600",
    button: "bg-gradient-to-r from-pink-500 to-fuchsia-600",
    background: "bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50",
    card: "bg-white",
    cardText: "text-gray-900",
    border: "border-gray-100",
    input: "border-gray-200 focus:ring-pink-500",
    focus: "focus:ring-pink-500",
    stats: [
      "from-pink-50 to-rose-50 text-pink-600",
      "from-emerald-50 to-teal-50 text-emerald-600",
      "from-blue-50 to-cyan-50 text-blue-600",
      "from-amber-50 to-orange-50 text-amber-600",
    ],
    gradients: [
      "from-emerald-400 to-teal-500",
      "from-cyan-400 to-blue-500",
      "from-rose-400 to-pink-500",
      "from-orange-400 to-red-500",
    ],
  },
  dark: {
    name: "Oscuro",
    icon: <Moon className="w-5 h-5" />,
    header: "bg-gradient-to-r from-gray-900 via-slate-800 to-zinc-900",
    headerText: "text-white",
    avatar: "bg-gradient-to-br from-gray-700 to-slate-800",
    button: "bg-gradient-to-r from-gray-700 to-slate-800",
    background: "bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900",
    card: "bg-gray-800",
    cardText: "text-white",
    border: "border-gray-700",
    input: "border-gray-600 focus:ring-gray-500 bg-gray-700 text-white",
    focus: "focus:ring-gray-500",
    stats: [
      "from-gray-700 to-slate-700 text-gray-300",
      "from-emerald-900 to-teal-900 text-emerald-400",
      "from-blue-900 to-cyan-900 text-blue-400",
      "from-amber-900 to-orange-900 text-amber-400",
    ],
    gradients: [
      "from-emerald-600 to-teal-700",
      "from-cyan-600 to-blue-700",
      "from-rose-600 to-pink-700",
      "from-orange-600 to-red-700",
    ],
  },
  blue: {
    name: "Azul",
    icon: <div className="w-3 h-3 rounded-full bg-blue-500" />,
    header: "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700",
    headerText: "text-white",
    avatar: "bg-gradient-to-br from-blue-600 to-indigo-700",
    button: "bg-gradient-to-r from-blue-600 to-indigo-700",
    background: "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50",
    card: "bg-white",
    cardText: "text-gray-900",
    border: "border-gray-100",
    input: "border-gray-200 focus:ring-blue-500",
    focus: "focus:ring-blue-500",
    stats: [
      "from-blue-50 to-indigo-50 text-blue-600",
      "from-indigo-50 to-purple-50 text-indigo-600",
      "from-purple-50 to-violet-50 text-purple-600",
      "from-cyan-50 to-blue-50 text-cyan-600",
    ],
    gradients: [
      "from-blue-400 to-indigo-500",
      "from-indigo-400 to-purple-500",
      "from-purple-400 to-violet-500",
      "from-cyan-400 to-blue-500",
    ],
  },
  green: {
    name: "Verde",
    icon: <div className="w-3 h-3 rounded-full bg-green-500" />,
    header: "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600",
    headerText: "text-white",
    avatar: "bg-gradient-to-br from-emerald-500 to-teal-600",
    button: "bg-gradient-to-r from-emerald-500 to-teal-600",
    background: "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50",
    card: "bg-white",
    cardText: "text-gray-900",
    border: "border-gray-100",
    input: "border-gray-200 focus:ring-emerald-500",
    focus: "focus:ring-emerald-500",
    stats: [
      "from-emerald-50 to-teal-50 text-emerald-600",
      "from-teal-50 to-cyan-50 text-teal-600",
      "from-lime-50 to-green-50 text-lime-600",
      "from-cyan-50 to-blue-50 text-cyan-600",
    ],
    gradients: [
      "from-emerald-400 to-teal-500",
      "from-teal-400 to-cyan-500",
      "from-lime-400 to-green-500",
      "from-green-400 to-emerald-500",
    ],
  },
  purple: {
    name: "Púrpura",
    icon: <div className="w-3 h-3 rounded-full bg-purple-500" />,
    header: "bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-700",
    headerText: "text-white",
    avatar: "bg-gradient-to-br from-violet-600 to-fuchsia-700",
    button: "bg-gradient-to-r from-violet-600 to-fuchsia-700",
    background: "bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50",
    card: "bg-white",
    cardText: "text-gray-900",
    border: "border-gray-100",
    input: "border-gray-200 focus:ring-purple-500",
    focus: "focus:ring-purple-500",
    stats: [
      "from-violet-50 to-purple-50 text-violet-600",
      "from-purple-50 to-fuchsia-50 text-purple-600",
      "from-fuchsia-50 to-pink-50 text-fuchsia-600",
      "from-indigo-50 to-violet-50 text-indigo-600",
    ],
    gradients: [
      "from-violet-400 to-purple-500",
      "from-purple-400 to-fuchsia-500",
      "from-fuchsia-400 to-pink-500",
      "from-indigo-400 to-violet-500",
    ],
  },
  orange: {
    name: "Naranja",
    icon: <div className="w-3 h-3 rounded-full bg-orange-500" />,
    header: "bg-gradient-to-r from-orange-500 via-red-500 to-rose-600",
    headerText: "text-white",
    avatar: "bg-gradient-to-br from-orange-500 to-red-600",
    button: "bg-gradient-to-r from-orange-500 to-red-600",
    background: "bg-gradient-to-br from-orange-50 via-red-50 to-rose-50",
    card: "bg-white",
    cardText: "text-gray-900",
    border: "border-gray-100",
    input: "border-gray-200 focus:ring-orange-500",
    focus: "focus:ring-orange-500",
    stats: [
      "from-orange-50 to-red-50 text-orange-600",
      "from-red-50 to-rose-50 text-red-600",
      "from-amber-50 to-orange-50 text-amber-600",
      "from-rose-50 to-pink-50 text-rose-600",
    ],
    gradients: [
      "from-orange-400 to-red-500",
      "from-red-400 to-rose-500",
      "from-amber-400 to-orange-500",
      "from-rose-400 to-pink-500",
    ],
  },
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<Ciudad[]>([]);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    region_id: "",
    ciudad_id: "",
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

  // ✅ NUEVO: Estado para tema
  const [theme, setTheme] = useState<Theme>("light");
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  // ✅ Cargar tema desde localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("userTheme") as Theme;
    if (savedTheme && themes[savedTheme]) {
      setTheme(savedTheme);
    }
  }, []);

  // ✅ Guardar tema en localStorage
  const changeTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("userTheme", newTheme);
    setShowThemeSelector(false);
  }, []);

  const currentTheme = themes[theme];

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

        const [
          { data: usuarioData, error: usuarioError },
          { data: regionesData },
          { data: notificacionesData },
          { data: reviewsData },
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
          supabase
            .from("calificacion_usuario")
            .select("id, estrellas, comentario, created_at, comprador_id")
            .eq("vendedor_id", session.user.id)
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

        const promises = [
          usuarioData.region_id
            ? supabase
                .from("region")
                .select("nombre_region")
                .eq("id", usuarioData.region_id)
                .single()
            : Promise.resolve({ data: null }),
          usuarioData.ciudad_id
            ? supabase
                .from("ciudad")
                .select("nombre_ciudad")
                .eq("id", usuarioData.ciudad_id)
                .single()
            : Promise.resolve({ data: null }),
          usuarioData.region_id
            ? supabase
                .from("ciudad")
                .select("id, nombre_ciudad, region_id")
                .eq("region_id", usuarioData.region_id)
                .order("nombre_ciudad", { ascending: true })
            : Promise.resolve({ data: [] }),
        ];

        const [{ data: regionData }, { data: ciudadData }, { data: ciudadesData }] =
          await Promise.all(promises);

        setUser(session.user as UserProfile);
        setRegions(regionesData || []);
        setNotifications(notificacionesData || []);
        setCities(ciudadesData || []);

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
        }

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
          ciudad_id: usuarioData.ciudad_id?.toString() || "",
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
  }, [router]);

  const loadCities = useCallback(async (regionId: number) => {
    try {
      const { data, error } = await supabase
        .from("ciudad")
        .select("id, nombre_ciudad, region_id")
        .eq("region_id", regionId)
        .order("nombre_ciudad", { ascending: true });

      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      console.error("Error cargando ciudades:", error);
      setCities([]);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!user) return;

    setLoadingNotifications(true);
    try {
      const { data, error } = await supabase
        .from("notificacion")
        .select("*")
        .eq("usuario_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  }, [user]);

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

  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      await supabase.from("notificacion").delete().eq("id", notificationId);

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.leida).length,
    [notifications]
  );

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
          ciudad_id: formData.ciudad_id ? parseInt(formData.ciudad_id) : null,
        })
        .eq("id", user.id);

      if (error) throw error;

      setSuccessMessage("Perfil actualizado exitosamente");
      setIsEditing(false);

      const { data: usuarioActualizado } = await supabase
        .from("usuario")
        .select("*")
        .eq("id", user.id)
        .single();

      if (usuarioActualizado) {
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

  const menuItems = useMemo(
    () => [
      {
        icon: Plus,
        label: "Publicar",
        description: "Nuevo vehículo",
        route: "/publication",
        gradient: currentTheme.gradients[0],
      },
      {
        icon: List,
        label: "Mis Publicaciones",
        description: "Gestionar publicaciones",
        route: "/mypost",
        gradient: currentTheme.gradients[1],
      },
      {
        icon: Heart,
        label: "Favoritos",
        description: "Vehículos guardados",
        route: "/favorites",
        gradient: currentTheme.gradients[2],
      },
      {
        icon: Flag,
        label: "Reportes",
        description: "Reportes que has hecho",
        route: "/my-reports",
        gradient: currentTheme.gradients[3],
      },
    ],
    [currentTheme]
  );

  if (loading) {
    return (
      <div className={`min-h-screen ${currentTheme.background} flex items-center justify-center`}>
        <Loader2 className={`w-12 h-12 ${theme === "dark" ? "text-gray-400" : "text-pink-600"} animate-spin`} />
      </div>
    );
  }

  if (!user || !userData) {
    return null;
  }

  const fullName = `${userData.nombre} ${userData.apellido}`;
  const initials = `${userData.nombre.charAt(0)}${userData.apellido.charAt(0)}`.toUpperCase();

  return (
    <div className={`min-h-screen ${currentTheme.background}`}>
      {/* Header Personal */}
      <header className={`${currentTheme.header} shadow-2xl sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className={`text-xl font-bold ${currentTheme.headerText}`}>{fullName}</h1>
                <p className="text-xs text-white/80">Mi Perfil Personal</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* ✅ Selector de Tema */}
              <div className="relative">
                <button
                  onClick={() => setShowThemeSelector(!showThemeSelector)}
                  className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full transition-all"
                  title="Cambiar tema"
                >
                  <Palette className="w-5 h-5" />
                </button>

                {showThemeSelector && (
                  <div className={`absolute right-0 mt-2 ${currentTheme.card} ${currentTheme.border} border rounded-xl shadow-2xl p-3 w-48 animate-in zoom-in-95 duration-200`}>
                    <p className={`text-xs font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-2 px-2`}>
                      Selecciona un tema
                    </p>
                    <div className="space-y-1">
                      {(Object.keys(themes) as Theme[]).map((themeName) => (
                        <button
                          key={themeName}
                          onClick={() => changeTheme(themeName)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            theme === themeName
                              ? theme === "dark"
                                ? "bg-gray-700"
                                : "bg-gray-100"
                              : theme === "dark"
                              ? "hover:bg-gray-700"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <span>{themes[themeName].icon}</span>
                          <span className={`text-sm font-medium ${currentTheme.cardText}`}>
                            {themes[themeName].name}
                          </span>
                          {theme === themeName && (
                            <CheckCircle className="w-4 h-4 ml-auto text-green-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full transition-all"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full transition-all text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-end animate-in fade-in duration-200">
          <div className={`${currentTheme.card} w-full max-w-md h-screen shadow-2xl flex flex-col animate-in slide-in-from-right duration-300`}>
            <div className={`${currentTheme.header} ${currentTheme.headerText} p-6 flex justify-between items-center`}>
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6" />
                <h2 className="text-xl font-bold">Notificaciones</h2>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingNotifications ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className={`w-8 h-8 ${theme === "dark" ? "text-gray-400" : "text-pink-600"} animate-spin`} />
                </div>
              ) : notifications.length === 0 ? (
                <div className={`p-8 text-center ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No hay notificaciones</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"} transition-colors ${
                        !notif.leida
                          ? theme === "dark"
                            ? "bg-gray-700 border-l-4 border-blue-500"
                            : "bg-pink-50 border-l-4 border-pink-500"
                          : ""
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <div className="flex-1">
                          <h3 className={`font-semibold ${currentTheme.cardText}`}>
                            {notif.titulo}
                          </h3>
                          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"} mt-1`}>
                            {notif.mensaje}
                          </p>
                          <p className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-500"} mt-2`}>
                            {formatNotificationDate(notif.created_at)}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className={`p-1.5 ${theme === "dark" ? "text-gray-500 hover:text-red-400 hover:bg-red-900/20" : "text-gray-400 hover:text-red-600 hover:bg-red-50"} rounded transition-colors`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {!notif.leida && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className={`text-xs ${currentTheme.button} text-white px-3 py-1.5 rounded-full hover:opacity-90 font-medium transition-colors`}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`${currentTheme.card} rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200`}>
            <h3 className={`text-lg font-bold ${currentTheme.cardText} mb-2`}>
              ¿Cerrar sesión?
            </h3>
            <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-6 text-sm`}>
              ¿Estás seguro de que deseas cerrar sesión?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={loggingOut}
                className={`flex-1 px-4 py-2.5 text-sm font-medium ${theme === "dark" ? "text-gray-300 bg-gray-700 hover:bg-gray-600" : "text-gray-700 bg-gray-100 hover:bg-gray-200"} rounded-xl disabled:opacity-50 transition-colors`}
              >
                Cancelar
              </button>
              <button
                onClick={confirmLogout}
                disabled={loggingOut}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-red-600 rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`${currentTheme.card} rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200`}>
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 flex justify-between items-center rounded-t-2xl">
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
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {reviews.length === 0 ? (
                <div className={`text-center py-12 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                  <Star className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="font-medium text-lg">
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
                      className={`${theme === "dark" ? "bg-gray-700" : "bg-gradient-to-br from-amber-50 to-orange-50"} rounded-xl p-4 border ${theme === "dark" ? "border-gray-600" : "border-amber-200"} hover:shadow-md transition-shadow`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className={`font-semibold ${currentTheme.cardText}`}>
                            {review.comprador.nombre}{" "}
                            {review.comprador.apellido}
                          </p>
                          <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
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
                        <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"} mt-2 leading-relaxed`}>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className={`mb-6 ${theme === "dark" ? "bg-emerald-900/20 border-emerald-700" : "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-500"} border-l-4 text-emerald-${theme === "dark" ? "400" : "800"} px-5 py-4 rounded-xl flex items-center gap-3 text-sm shadow-sm animate-in slide-in-from-top duration-300`}>
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className={`mb-6 ${theme === "dark" ? "bg-red-900/20 border-red-700" : "bg-gradient-to-r from-red-50 to-rose-50 border-red-500"} border-l-4 text-red-${theme === "dark" ? "400" : "800"} px-5 py-4 rounded-xl flex items-center gap-3 text-sm shadow-sm animate-in slide-in-from-top duration-300`}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Profile Header Card */}
        <div className={`${currentTheme.card} rounded-3xl shadow-2xl ${currentTheme.border} border overflow-hidden mb-6`}>
          <div className={`${currentTheme.header} h-28`}></div>
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-14">
              <div className="flex items-end gap-4">
                <div className={`w-24 h-24 ${currentTheme.avatar} rounded-2xl shadow-2xl flex items-center justify-center border-4 ${theme === "dark" ? "border-gray-800" : "border-white"}`}>
                  <span className="text-3xl font-bold text-white">
                    {initials}
                  </span>
                </div>
                <div className="mb-5">
                  <h2 className={`text-2xl sm:text-3xl font-bold ${currentTheme.cardText}`}>
                    {fullName}
                  </h2>
                  <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"} mt-1 flex items-center gap-2`}>
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center justify-center gap-2 px-6 py-3 ${currentTheme.button} text-white text-sm font-semibold rounded-xl hover:shadow-xl hover:scale-105 transition-all`}
              >
                <Edit2 className="w-4 h-4" />
                {isEditing ? "Cancelar Edición" : "Editar Perfil"}
              </button>
            </div>

            {/* User Stats */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className={`p-3 bg-gradient-to-br ${currentTheme.stats[0]} rounded-xl text-center`}>
                <Calendar className="w-5 h-5 mx-auto mb-1" />
                <p className="text-xs opacity-80">Miembro desde</p>
                <p className="text-sm font-bold">
                  {new Date(userData.created_at).toLocaleDateString("es-ES", {
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className={`p-3 bg-gradient-to-br ${currentTheme.stats[1]} rounded-xl text-center`}>
                <Shield className="w-5 h-5 mx-auto mb-1" />
                <p className="text-xs opacity-80">Estado</p>
                <p className="text-sm font-bold">
                  {userData.habilitado ? "Activa" : "Inactiva"}
                </p>
              </div>

              {userData.ciudad_nombre && (
                <div className={`p-3 bg-gradient-to-br ${currentTheme.stats[2]} rounded-xl text-center`}>
                  <MapPin className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-xs opacity-80">Ubicación</p>
                  <p className="text-sm font-bold truncate">
                    {userData.ciudad_nombre}
                  </p>
                  {userData.region_nombre && (
                    <p className="text-xs opacity-70 truncate">
                      {userData.region_nombre}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={() => setShowReviewsModal(true)}
                className={`p-3 bg-gradient-to-br ${currentTheme.stats[3]} rounded-xl text-center hover:shadow-md transition-shadow`}
              >
                <Star className="w-5 h-5 mx-auto mb-1" />
                <p className="text-xs opacity-80">Calificaciones</p>
                <p className="text-sm font-bold">
                  {reviews.length > 0 ? averageRating.toFixed(1) : "0.0"} ⭐
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {menuItems.map((item) => (
            <button
              key={item.route}
              onClick={() => router.push(item.route)}
              className={`group relative overflow-hidden ${currentTheme.card} rounded-2xl shadow-lg ${currentTheme.border} border p-6 transition-all hover:shadow-2xl hover:scale-105 hover:-translate-y-1`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}
              ></div>
              <div className="relative">
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className={`font-bold ${currentTheme.cardText} text-sm mb-1`}>
                  {item.label}
                </h3>
                <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>{item.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Edit Form & Settings */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className={`${currentTheme.card} rounded-2xl shadow-xl ${currentTheme.border} border p-6`}>
              <div className={`flex items-center gap-3 mb-6 pb-4 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-100"}`}>
                <div className={`w-10 h-10 ${currentTheme.button} rounded-xl flex items-center justify-center`}>
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-lg font-bold ${currentTheme.cardText}`}>
                  Información Personal
                </h3>
              </div>

              <div className="space-y-5">
                {/* Name & Lastname */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-700"} mb-2`}>
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) =>
                        setFormData({ ...formData, nombre: e.target.value })
                      }
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 text-sm border-2 ${currentTheme.input} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent disabled:${theme === "dark" ? "bg-gray-700 text-gray-500" : "bg-gray-50 text-gray-600"} transition-all`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-700"} mb-2`}>
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={formData.apellido}
                      onChange={(e) =>
                        setFormData({ ...formData, apellido: e.target.value })
                      }
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 text-sm border-2 ${currentTheme.input} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent disabled:${theme === "dark" ? "bg-gray-700 text-gray-500" : "bg-gray-50 text-gray-600"} transition-all`}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className={`block text-xs font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-700"} mb-2`}>
                    <Phone className="w-4 h-4 inline mr-1.5 mb-0.5" />
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) =>
                      setFormData({ ...formData, telefono: e.target.value })
                    }
                    disabled={!isEditing}
                    placeholder="+56 9 1234 5678"
                    className={`w-full px-4 py-3 text-sm border-2 ${currentTheme.input} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent disabled:${theme === "dark" ? "bg-gray-700 text-gray-500" : "bg-gray-50 text-gray-600"} transition-all`}
                  />
                </div>

                {/* Region & City */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-700"} mb-2`}>
                      <MapPin className="w-4 h-4 inline mr-1.5 mb-0.5" />
                      Región
                    </label>
                    <select
                      value={formData.region_id}
                      onChange={(e) => {
                        const regionId = e.target.value;
                        setFormData({
                          ...formData,
                          region_id: regionId,
                          ciudad_id: "",
                        });
                        if (regionId) {
                          loadCities(parseInt(regionId));
                        } else {
                          setCities([]);
                        }
                      }}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 text-sm border-2 ${currentTheme.input} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent disabled:${theme === "dark" ? "bg-gray-700 text-gray-500" : "bg-gray-50 text-gray-600"} transition-all`}
                    >
                      <option value="">Selecciona región</option>
                      {regions.map((region) => (
                        <option key={region.id} value={region.id}>
                          {region.nombre_region}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-700"} mb-2`}>
                      <MapPin className="w-4 h-4 inline mr-1.5 mb-0.5" />
                      Ciudad
                    </label>
                    <select
                      value={formData.ciudad_id}
                      onChange={(e) =>
                        setFormData({ ...formData, ciudad_id: e.target.value })
                      }
                      disabled={!isEditing || !formData.region_id || cities.length === 0}
                      className={`w-full px-4 py-3 text-sm border-2 ${currentTheme.input} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent disabled:${theme === "dark" ? "bg-gray-700 text-gray-500" : "bg-gray-50 text-gray-600"} transition-all`}
                    >
                      <option value="">
                        {!formData.region_id
                          ? "Primero selecciona región"
                          : cities.length === 0
                          ? "Cargando ciudades..."
                          : "Selecciona ciudad"}
                      </option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.nombre_ciudad}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* RUT & Email (Read-only) */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-700"} mb-2`}>
                      RUT (No editable)
                    </label>
                    <input
                      type="text"
                      value={userData.rut || ""}
                      disabled
                      className={`w-full px-4 py-3 text-sm border-2 ${currentTheme.input} rounded-xl ${theme === "dark" ? "bg-gray-700 text-gray-500" : "bg-gray-50 text-gray-600"}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-700"} mb-2`}>
                      Correo (No editable)
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className={`w-full px-4 py-3 text-sm border-2 ${currentTheme.input} rounded-xl ${theme === "dark" ? "bg-gray-700 text-gray-500" : "bg-gray-50 text-gray-600"}`}
                    />
                  </div>
                </div>

                {/* Save Button */}
                {isEditing && (
                  <div className={`flex gap-3 pt-6 border-t-2 ${theme === "dark" ? "border-gray-700" : "border-gray-100"}`}>
                    <button
                      onClick={() => setIsEditing(false)}
                      disabled={saving}
                      className={`flex-1 px-6 py-3 ${theme === "dark" ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} text-sm font-semibold rounded-xl disabled:opacity-50 transition-all`}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={`flex-1 px-6 py-3 ${currentTheme.button} text-white text-sm font-semibold rounded-xl hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-all`}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Guardar Cambios
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Settings */}
            <div className={`${currentTheme.card} rounded-2xl shadow-xl ${currentTheme.border} border p-6`}>
              <div className="flex items-center gap-2 mb-4">
                <Settings className={`w-5 h-5 ${theme === "dark" ? "text-gray-400" : "text-pink-600"}`} />
                <h3 className={`font-bold ${currentTheme.cardText}`}>Configuración</h3>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => router.push("/reset-password")}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium ${currentTheme.cardText} ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gradient-to-r hover:from-pink-50 hover:to-fuchsia-50"} rounded-xl transition-all group`}
                >
                  <span className="flex items-center gap-2">
                    <Shield className={`w-5 h-5 ${theme === "dark" ? "text-gray-400" : "text-pink-600"}`} />
                    Cambiar Contraseña
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Account Status */}
            <div className={`${currentTheme.button} rounded-2xl shadow-xl p-6 text-white`}>
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-6 h-6" />
                <h3 className="font-bold text-lg">Estado de Cuenta</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                  <span className="text-sm">Verificación</span>
                  <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-bold">
                    {userData.habilitado ? "✓ Verificada" : "Pendiente"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                  <span className="text-sm">Tipo de Cuenta</span>
                  <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-bold">
                    Personal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
