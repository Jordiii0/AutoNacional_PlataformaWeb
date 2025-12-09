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
  Briefcase,
  Award,
  TrendingUp,
  Calendar,
  Palette,
  Sun,
  Moon,
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
  direccion?: string;
  representante_legal: string;
  rut_representante: string;
  telefono_representante?: string;
  region_id: number;
  ciudad_id: number;
  validada: boolean;
  region_nombre?: string;
  ciudad_nombre?: string;
  sitio_web?: string;
  descripcion?: string;
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
    header: "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700",
    headerText: "text-white",
    avatar: "bg-gradient-to-br from-blue-600 to-indigo-700",
    button: "bg-gradient-to-r from-blue-600 to-indigo-700",
    background: "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50",
    card: "bg-white",
    cardText: "text-gray-900",
    border: "border-gray-100",
    input: "border-gray-200 focus:ring-blue-500",
    focus: "focus:ring-blue-500",
    stats: [
      "from-blue-50 to-indigo-50 text-blue-600",
      "from-emerald-50 to-teal-50 text-emerald-600",
      "from-purple-50 to-violet-50 text-purple-600",
      "from-amber-50 to-orange-50 text-amber-600",
    ],
    gradients: [
      "from-emerald-500 to-teal-600",
      "from-blue-500 to-indigo-600",
      "from-rose-500 to-pink-600",
      "from-orange-500 to-red-600",
      "from-purple-500 to-violet-600",
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
      "from-blue-600 to-indigo-700",
      "from-rose-600 to-pink-700",
      "from-orange-600 to-red-700",
      "from-purple-600 to-violet-700",
    ],
  },
  blue: {
    name: "Azul",
    icon: <div className="w-3 h-3 rounded-full bg-blue-500" />,
    header: "bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-700",
    headerText: "text-white",
    avatar: "bg-gradient-to-br from-blue-600 to-cyan-700",
    button: "bg-gradient-to-r from-blue-600 to-cyan-700",
    background: "bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50",
    card: "bg-white",
    cardText: "text-gray-900",
    border: "border-gray-100",
    input: "border-gray-200 focus:ring-blue-500",
    focus: "focus:ring-blue-500",
    stats: [
      "from-blue-50 to-cyan-50 text-blue-600",
      "from-cyan-50 to-teal-50 text-cyan-600",
      "from-teal-50 to-emerald-50 text-teal-600",
      "from-indigo-50 to-blue-50 text-indigo-600",
    ],
    gradients: [
      "from-blue-400 to-cyan-500",
      "from-cyan-400 to-teal-500",
      "from-teal-400 to-emerald-500",
      "from-indigo-400 to-blue-500",
      "from-sky-400 to-cyan-500",
    ],
  },
  green: {
    name: "Verde",
    icon: <div className="w-3 h-3 rounded-full bg-green-500" />,
    header: "bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700",
    headerText: "text-white",
    avatar: "bg-gradient-to-br from-emerald-600 to-teal-700",
    button: "bg-gradient-to-r from-emerald-600 to-teal-700",
    background: "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50",
    card: "bg-white",
    cardText: "text-gray-900",
    border: "border-gray-100",
    input: "border-gray-200 focus:ring-emerald-500",
    focus: "focus:ring-emerald-500",
    stats: [
      "from-emerald-50 to-green-50 text-emerald-600",
      "from-green-50 to-teal-50 text-green-600",
      "from-teal-50 to-cyan-50 text-teal-600",
      "from-lime-50 to-emerald-50 text-lime-600",
    ],
    gradients: [
      "from-emerald-400 to-green-500",
      "from-green-400 to-teal-500",
      "from-teal-400 to-cyan-500",
      "from-lime-400 to-emerald-500",
      "from-emerald-400 to-teal-500",
    ],
  },
  purple: {
    name: "Púrpura",
    icon: <div className="w-3 h-3 rounded-full bg-purple-500" />,
    header: "bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-700",
    headerText: "text-white",
    avatar: "bg-gradient-to-br from-purple-600 to-indigo-700",
    button: "bg-gradient-to-r from-purple-600 to-indigo-700",
    background: "bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50",
    card: "bg-white",
    cardText: "text-gray-900",
    border: "border-gray-100",
    input: "border-gray-200 focus:ring-purple-500",
    focus: "focus:ring-purple-500",
    stats: [
      "from-purple-50 to-violet-50 text-purple-600",
      "from-violet-50 to-indigo-50 text-violet-600",
      "from-indigo-50 to-blue-50 text-indigo-600",
      "from-fuchsia-50 to-purple-50 text-fuchsia-600",
    ],
    gradients: [
      "from-purple-400 to-violet-500",
      "from-violet-400 to-indigo-500",
      "from-indigo-400 to-purple-500",
      "from-fuchsia-400 to-purple-500",
      "from-purple-400 to-pink-500",
    ],
  },
  orange: {
    name: "Naranja",
    icon: <div className="w-3 h-3 rounded-full bg-orange-500" />,
    header: "bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600",
    headerText: "text-white",
    avatar: "bg-gradient-to-br from-orange-600 to-amber-700",
    button: "bg-gradient-to-r from-orange-600 to-amber-700",
    background: "bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50",
    card: "bg-white",
    cardText: "text-gray-900",
    border: "border-gray-100",
    input: "border-gray-200 focus:ring-orange-500",
    focus: "focus:ring-orange-500",
    stats: [
      "from-orange-50 to-amber-50 text-orange-600",
      "from-amber-50 to-yellow-50 text-amber-600",
      "from-red-50 to-orange-50 text-red-600",
      "from-yellow-50 to-amber-50 text-yellow-600",
    ],
    gradients: [
      "from-orange-400 to-amber-500",
      "from-amber-400 to-yellow-500",
      "from-red-400 to-orange-500",
      "from-yellow-400 to-orange-500",
      "from-orange-400 to-red-500",
    ],
  },
};

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

  // ✅ NUEVO: Estado para tema
  const [theme, setTheme] = useState<Theme>("light");
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  // ✅ Cargar tema desde localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("businessTheme") as Theme;
    if (savedTheme && themes[savedTheme]) {
      setTheme(savedTheme);
    }
  }, []);

  // ✅ Guardar tema en localStorage
  const changeTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("businessTheme", newTheme);
    setShowThemeSelector(false);
  }, []);

  const currentTheme = themes[theme];

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

  useEffect(() => {
    if (empresa && empresa.region_id) {
      loadCities(empresa.region_id);
    }
  }, [empresa?.region_id]);

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
          direccion: editForm.direccion,
          representante_legal: editForm.representante_legal,
          rut_representante: editForm.rut_representante,
          telefono_representante: editForm.telefono_representante,
          region_id: editForm.region_id,
          ciudad_id: editForm.ciudad_id,
          sitio_web: editForm.sitio_web,
          descripcion: editForm.descripcion,
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
      <div className={`min-h-screen ${currentTheme.background} flex items-center justify-center`}>
        <Loader2 className={`w-12 h-12 ${theme === "dark" ? "text-gray-400" : "text-blue-600"} animate-spin`} />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className={`min-h-screen ${currentTheme.background} flex items-center justify-center p-4`}>
        <div className={`${currentTheme.card} rounded-2xl ${currentTheme.border} border shadow-xl p-8 max-w-md text-center`}>
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold ${currentTheme.cardText} mb-2`}>Error</h2>
          <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-6`}>{errorMessage}</p>
          <button
            onClick={() => router.push("/")}
            className={`w-full ${currentTheme.button} text-white font-medium py-3 rounded-lg transition-colors`}
          >
            Ir al Inicio
          </button>
        </div>
      </div>
    );
  }

  if (!empresa || !session) {
    return (
      <div className={`min-h-screen ${currentTheme.background} flex items-center justify-center p-4`}>
        <div className={`${currentTheme.card} rounded-2xl ${currentTheme.border} border shadow-xl p-8 max-w-md text-center`}>
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold ${currentTheme.cardText} mb-2`}>Sin Datos</h2>
          <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-6`}>
            No se encontraron datos de empresa
          </p>
          <button
            onClick={() => router.push("/")}
            className={`w-full ${currentTheme.button} text-white font-medium py-3 rounded-lg transition-colors`}
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
      gradient: currentTheme.gradients[0],
      disabled: !empresa.validada,
    },
    {
      icon: List,
      label: "Publicaciones",
      description: "Gestionar anuncios",
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
      description: "Mis reportes",
      route: "/my-reports",
      gradient: currentTheme.gradients[3],
    },
    {
      icon: Briefcase,
      label: "Clientes",
      description: "Cotizaciones",
      route: "/clientescot",
      gradient: currentTheme.gradients[4],
    },
  ];

  return (
    <div className={`min-h-screen ${currentTheme.background}`}>
      {/* Header Empresarial */}
      <header className={`${currentTheme.header} shadow-2xl sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className={`text-xl font-bold ${currentTheme.headerText}`}>
                  {empresa.nombre_comercial}
                </h1>
                <p className="text-xs text-white/80">Panel Empresarial</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* ✅ Selector de Tema */}
              <div className="relative">
                <button
                  onClick={() => setShowThemeSelector(!showThemeSelector)}
                  className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg transition-all"
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
                className="relative p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg transition-all"
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
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg transition-all text-sm font-medium"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-end">
          <div className={`${currentTheme.card} w-full max-w-md h-screen shadow-2xl flex flex-col animate-in slide-in-from-right duration-300`}>
            <div className={`${currentTheme.header} ${currentTheme.headerText} p-6 flex justify-between items-center`}>
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6" />
                <h2 className="text-xl font-bold">Notificaciones</h2>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingNotifications ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className={`w-8 h-8 ${theme === "dark" ? "text-gray-400" : "text-blue-600"} animate-spin`} />
                </div>
              ) : notifications.length === 0 ? (
                <div className={`p-8 text-center ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
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
                          ? theme === "dark"
                            ? "bg-blue-900/20 border-l-4 border-blue-600"
                            : "bg-blue-50 border-l-4 border-blue-600"
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
                          className={`text-xs ${currentTheme.button} text-white px-3 py-1.5 rounded-lg hover:opacity-90 font-medium transition-colors`}
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
          <div className={`${currentTheme.card} rounded-xl ${currentTheme.border} border p-6 w-full max-w-sm animate-in zoom-in-95 duration-200`}>
            <h3 className={`text-lg font-bold ${currentTheme.cardText} mb-2`}>
              ¿Cerrar sesión?
            </h3>
            <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-6 text-sm`}>
              ¿Estás seguro de que deseas cerrar sesión?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={loggingOut}
                className={`px-4 py-2 text-sm font-medium ${theme === "dark" ? "text-gray-300 bg-gray-700 hover:bg-gray-600" : "text-gray-700 bg-gray-100 hover:bg-gray-200"} rounded-lg disabled:opacity-50`}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`${currentTheme.card} rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200`}>
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 flex justify-between items-center rounded-t-2xl">
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
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingReviews ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="w-8 h-8 text-yellow-600 animate-spin" />
                </div>
              ) : reviews.length === 0 ? (
                <div className={`text-center py-12 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
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
                      className={`${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-gradient-to-br from-gray-50 to-blue-50 border-gray-200"} rounded-lg p-4 border hover:shadow-md transition-shadow`}
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
                        <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"} mt-2`}>
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
        {editSuccess && (
          <div className={`mb-6 ${theme === "dark" ? "bg-green-900/20 border-green-700" : "bg-gradient-to-r from-green-50 to-emerald-50 border-green-500"} border-l-4 text-green-${theme === "dark" ? "400" : "700"} px-5 py-4 rounded-xl flex items-center gap-3 text-sm shadow-sm animate-in slide-in-from-top duration-300`}>
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            Cambios guardados exitosamente
          </div>
        )}

        {/* Profile Header Card */}
        <div className={`${currentTheme.card} rounded-2xl shadow-xl ${currentTheme.border} border overflow-hidden mb-6`}>
          <div className={`${currentTheme.header} h-32`}></div>
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-16">
              <div className="flex items-end gap-4">
                <div className={`w-28 h-28 ${theme === "dark" ? "bg-gray-700" : "bg-white"} rounded-2xl shadow-xl flex items-center justify-center border-4 ${theme === "dark" ? "border-gray-800" : "border-white"}`}>
                  <Building2 className={`w-14 h-14 ${theme === "dark" ? "text-gray-400" : "text-blue-600"}`} />
                </div>
                <div className="mb-6">
                  <h2 className={`text-2xl sm:text-3xl font-bold ${currentTheme.cardText}`}>
                    {empresa.nombre_comercial}
                  </h2>
                  <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"} mt-1 flex items-center gap-2`}>
                    {empresa.validada ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-green-700 font-medium">
                          Empresa Verificada
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <span className="text-yellow-700 font-medium">
                          Verificación Pendiente
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={isEditing ? cancelEditing : startEditing}
                className={`flex items-center justify-center gap-2 px-6 py-3 ${currentTheme.button} text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all`}
              >
                <Edit2 className="w-4 h-4" />
                {isEditing ? "Cancelar" : "Editar Perfil"}
              </button>
            </div>

            {/* Company Info Grid */}
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`flex items-center gap-3 p-3 ${theme === "dark" ? "bg-gray-700" : "bg-gradient-to-br from-gray-50 to-blue-50"} rounded-xl`}>
                <Mail className={`w-5 h-5 ${theme === "dark" ? "text-gray-400" : "text-blue-600"}`} />
                <div className="min-w-0">
                  <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Email</p>
                  <p className={`text-sm font-medium ${currentTheme.cardText} truncate`}>
                    {empresa.correo_electronico}
                  </p>
                </div>
              </div>

              {empresa.telefono && (
                <div className={`flex items-center gap-3 p-3 ${theme === "dark" ? "bg-gray-700" : "bg-gradient-to-br from-gray-50 to-green-50"} rounded-xl`}>
                  <Phone className={`w-5 h-5 ${theme === "dark" ? "text-gray-400" : "text-green-600"}`} />
                  <div className="min-w-0">
                    <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Teléfono</p>
                    <p className={`text-sm font-medium ${currentTheme.cardText}`}>
                      {empresa.telefono}
                    </p>
                  </div>
                </div>
              )}

              <div className={`flex items-center gap-3 p-3 ${theme === "dark" ? "bg-gray-700" : "bg-gradient-to-br from-gray-50 to-purple-50"} rounded-xl`}>
                <MapPin className={`w-5 h-5 ${theme === "dark" ? "text-gray-400" : "text-purple-600"}`} />
                <div className="min-w-0">
                  <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Ubicación</p>
                  <p className={`text-sm font-medium ${currentTheme.cardText} truncate`}>
                    {empresa.ciudad_nombre}
                  </p>
                </div>
              </div>

              {empresa.sitio_web && (
                <div className={`flex items-center gap-3 p-3 ${theme === "dark" ? "bg-gray-700" : "bg-gradient-to-br from-gray-50 to-indigo-50"} rounded-xl`}>
                  <Globe className={`w-5 h-5 ${theme === "dark" ? "text-gray-400" : "text-indigo-600"}`} />
                  <div className="min-w-0">
                    <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Sitio Web</p>
                    <a
                      href={empresa.sitio_web}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-sm font-medium ${theme === "dark" ? "text-blue-400" : "text-indigo-600"} hover:underline truncate block`}
                    >
                      {empresa.sitio_web.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {empresa.descripcion && !isEditing && (
              <div className={`mt-6 p-4 ${theme === "dark" ? "bg-gray-700" : "bg-gradient-to-br from-blue-50 to-indigo-50"} rounded-xl border ${theme === "dark" ? "border-gray-600" : "border-blue-100"}`}>
                <div className={`flex items-start gap-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  <FileText className={`w-5 h-5 ${theme === "dark" ? "text-gray-400" : "text-blue-600"} mt-0.5 flex-shrink-0`} />
                  <p className="text-sm leading-relaxed">{empresa.descripcion}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {menuItems.map((item) => (
            <button
              key={item.route}
              onClick={() => !item.disabled && router.push(item.route)}
              disabled={item.disabled}
              className={`group relative overflow-hidden ${currentTheme.card} rounded-xl shadow-md ${currentTheme.border} border p-6 transition-all ${
                item.disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:shadow-xl hover:scale-105 hover:-translate-y-1"
              }`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}
              ></div>
              <div className="relative">
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}
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

        {/* Edit Form & Sidebar */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className={`${currentTheme.card} rounded-2xl shadow-xl ${currentTheme.border} border p-6`}>
              <div className={`flex items-center gap-3 mb-6 pb-4 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-100"}`}>
                <div className={`w-10 h-10 ${currentTheme.button} rounded-lg flex items-center justify-center`}>
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-lg font-bold ${currentTheme.cardText}`}>
                  Información Empresarial
                </h3>
              </div>

              <div className="space-y-5">
                {/* Company Name & RUT */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-700"} mb-2`}>
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
                      className={`w-full px-4 py-3 text-sm border-2 ${currentTheme.input} rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:${theme === "dark" ? "bg-gray-700 text-gray-500" : "bg-gray-50 text-gray-600"} transition-all`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-700"} mb-2`}>
                      RUT Empresa (No editable)
                    </label>
                    <input
                      type="text"
                      value={empresa.rut_empresa}
                      disabled
                      className={`w-full px-4 py-3 text-sm border-2 ${theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-500" : "border-gray-200 bg-gray-50 text-gray-600"} rounded-lg`}
                    />
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-700"} mb-2`}>
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
                      className={`w-full px-4 py-3 text-sm border-2 ${currentTheme.input} rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:${theme === "dark" ? "bg-gray-700 text-gray-500" : "bg-gray-50 text-gray-600"} transition-all`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-700"} mb-2`}>
                      <Phone className="w-3.5 h-3.5 inline mr-1" />
                      Teléfono Empresa
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={editForm?.telefono ?? empresa.telefono ?? ""}
                      onChange={handleEditChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 text-sm border-2 ${currentTheme.input} rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:${theme === "dark" ? "bg-gray-700 text-gray-500" : "bg-gray-50 text-gray-600"} transition-all`}
                    />
                  </div>
                </div>

                {/* Address & Website */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-700"} mb-2`}>
                      <MapPin className="w-3.5 h-3.5 inline mr-1" />
                      Dirección
                    </label>
                    <input
                      type="text"
                      name="direccion"
                      value={editForm?.direccion ?? empresa.direccion ?? ""}
                      onChange={handleEditChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 text-sm border-2 ${currentTheme.input} rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:${theme === "dark" ? "bg-gray-700 text-gray-500" : "bg-gray-50 text-gray-600"} transition-all`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-700"} mb-2`}>
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
                      className={`w-full px-4 py-3 text-sm border-2 ${currentTheme.input} rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:${theme === "dark" ? "bg-gray-700 text-gray-500" : "bg-gray-50 text-gray-600"} transition-all`}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className={`block text-xs font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-700"} mb-2`}>
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
                    className={`w-full px-4 py-3 text-sm border-2 ${currentTheme.input} rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:${theme === "dark" ? "bg-gray-700 text-gray-500" : "bg-gray-50 text-gray-600"} resize-none transition-all`}
                  />
                </div>

                {/* Region & City */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-700"} mb-2`}>
                      Región
                    </label>
                    <select
                      name="region_id"
                      value={editForm?.region_id ?? empresa.region_id}
                      onChange={handleEditChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 text-sm border-2 ${currentTheme.input} rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:${theme === "dark" ? "bg-gray-700 text-gray-500" : "bg-gray-50 text-gray-600"} transition-all`}
                    >
                      {!isEditing && empresa.region_nombre ? (
                        <option value={empresa.region_id}>{empresa.region_nombre}</option>
                      ) : (
                        <>
                          <option value="">Selecciona una región</option>
                          {regions.map((region) => (
                            <option key={region.id} value={region.id}>
                              {region.nombre_region}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-700"} mb-2`}>
                      Ciudad
                    </label>
                    <select
                      name="ciudad_id"
                      value={editForm?.ciudad_id ?? empresa.ciudad_id ?? ""}
                      onChange={handleEditChange}
                      disabled={!isEditing || cities.length === 0}
                      className={`w-full px-4 py-3 text-sm border-2 ${currentTheme.input} rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:${theme === "dark" ? "bg-gray-700 text-gray-500" : "bg-gray-50 text-gray-600"} transition-all`}
                    >
                      {!isEditing && empresa.ciudad_nombre ? (
                        <option value={empresa.ciudad_id}>{empresa.ciudad_nombre}</option>
                      ) : (
                        <>
                          <option value="">Selecciona una ciudad</option>
                          {cities.map((city) => (
                            <option key={city.id} value={city.id}>
                              {city.nombre_ciudad}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    {isEditing && cities.length === 0 && (
                      <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"} mt-1`}>
                        Cargando ciudades...
                      </p>
                    )}
                  </div>
                </div>

                {/* Legal Representative Section */}
                <div className={`pt-6 border-t-2 ${theme === "dark" ? "border-gray-700" : "border-gray-100"}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <User className={`w-5 h-5 ${theme === "dark" ? "text-gray-400" : "text-blue-600"}`} />
                    <h4 className={`text-sm font-bold ${currentTheme.cardText}`}>
                      Representante Legal
                    </h4>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-700"} mb-2`}>
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
                        className={`w-full px-4 py-3 text-sm border-2 ${currentTheme.input} rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:${theme === "dark" ? "bg-gray-700 text-gray-500" : "bg-gray-50 text-gray-600"} transition-all`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-700"} mb-2`}>
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
                        className={`w-full px-4 py-3 text-sm border-2 ${currentTheme.input} rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:${theme === "dark" ? "bg-gray-700 text-gray-500" : "bg-gray-50 text-gray-600"} transition-all`}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className={`block text-xs font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-700"} mb-2`}>
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
                      className={`w-full px-4 py-3 text-sm border-2 ${currentTheme.input} rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:${theme === "dark" ? "bg-gray-700 text-gray-500" : "bg-gray-50 text-gray-600"} transition-all`}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className={`flex gap-3 pt-6 border-t-2 ${theme === "dark" ? "border-gray-700" : "border-gray-100"}`}>
                    <button
                      onClick={cancelEditing}
                      disabled={editLoading}
                      className={`flex-1 px-6 py-3 ${theme === "dark" ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} text-sm font-semibold rounded-xl disabled:opacity-50 transition-all`}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      disabled={editLoading}
                      className={`flex-1 px-6 py-3 ${currentTheme.button} text-white text-sm font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all`}
                    >
                      {editLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
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
            {/* Stats Card */}
            <div className={`${currentTheme.button} rounded-2xl shadow-xl p-6 text-white`}>
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-6 h-6" />
                <h3 className="font-bold text-lg">Estado de Cuenta</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                  <span className="text-sm">Estado</span>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      empresa.habilitado
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {empresa.habilitado ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                  <span className="text-sm">Verificación</span>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      empresa.validada
                        ? "bg-white/20 text-white"
                        : "bg-yellow-500 text-gray-900"
                    }`}
                  >
                    {empresa.validada ? "✓ Validada" : "Pendiente"}
                  </span>
                </div>

                {empresa.created_at && (
                  <div className="pt-3 border-t border-white/20">
                    <div className="flex items-center gap-2 text-sm mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="opacity-90">Miembro desde</span>
                    </div>
                    <p className="font-semibold">
                      {new Date(empresa.created_at).toLocaleDateString(
                        "es-ES",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className={`${currentTheme.card} rounded-2xl shadow-xl ${currentTheme.border} border p-6`}>
              <h3 className={`font-bold ${currentTheme.cardText} mb-4 flex items-center gap-2`}>
                <TrendingUp className={`w-5 h-5 ${theme === "dark" ? "text-gray-400" : "text-blue-600"}`} />
                Acciones Rápidas
              </h3>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowReviewsModal(true);
                    loadReviews();
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium ${theme === "dark" ? "text-yellow-400 hover:bg-yellow-900/20" : "text-yellow-600 hover:bg-yellow-50"} rounded-xl transition-all group`}
                >
                  <span className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Ver Calificaciones
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => router.push("/reset-password")}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium ${currentTheme.cardText} ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl transition-all group`}
                >
                  <span className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Cambiar Contraseña
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
