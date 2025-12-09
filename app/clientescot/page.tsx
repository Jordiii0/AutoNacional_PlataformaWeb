"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Loader2,
  FileText,
  Mail,
  Phone,
  User,
  Calendar,
  Car,
  MessageSquare,
  Check,
  Clock,
  X,
  ChevronRight,
  Building,
  Filter,
  ArrowLeft,
} from "lucide-react";

interface Quote {
  id: number;
  vehiculo_id: number;
  nombre_solicitante: string;
  email_solicitante: string;
  telefono_solicitante: string;
  mensaje: string;
  estado: string;
  created_at: string;
  vehiculo: {
    marca: string;
    modelo: string;
    anio: number;
    precio: number;
    imagen_url?: string;
  };
}

type QuoteStatus =
  | "todos"
  | "pendiente"
  | "en_proceso"
  | "respondida"
  | "cerrada";

const STATUS_CONFIG = {
  todos: { label: "Todas", icon: FileText, color: "gray" },
  pendiente: { label: "Pendientes", icon: Clock, color: "yellow" },
  en_proceso: { label: "En Proceso", icon: MessageSquare, color: "blue" },
  respondida: { label: "Respondidas", icon: Check, color: "green" },
  cerrada: { label: "Cerradas", icon: X, color: "gray" },
};

export default function BusinessQuotesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<QuoteStatus>("todos");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    checkAuthAndLoadQuotes();
  }, []);

  useEffect(() => {
    filterQuotes();
  }, [activeStatus, quotes]);

  const checkAuthAndLoadQuotes = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("Debes iniciar sesión");
        router.push("/login");
        return;
      }

      const authUserId = session.user.id;

      const { data: empresaData, error: empresaError } = await supabase
        .from("empresa")
        .select("id, validada")
        .eq("usuario_id", authUserId)
        .maybeSingle();

      if (empresaError || !empresaData) {
        alert("No tienes una empresa registrada");
        router.push("/profile");
        return;
      }

      if (!empresaData.validada) {
        alert("Tu empresa aún no ha sido validada");
        router.push("/profile");
        return;
      }

      setEmpresaId(empresaData.id);
      await loadQuotes(empresaData.id);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const loadQuotes = async (empresaId: string) => {
    try {
      const { data: quotesData, error: quotesError } = await supabase
        .from("cotizacion")
        .select(
          `
          id,
          vehiculo_id,
          nombre_solicitante,
          email_solicitante,
          telefono_solicitante,
          mensaje,
          estado,
          created_at
        `
        )
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false });

      if (quotesError) throw quotesError;

      if (!quotesData || quotesData.length === 0) {
        setQuotes([]);
        return;
      }

      const vehicleIds = [...new Set(quotesData.map((q) => q.vehiculo_id))];
      const { data: vehiclesData } = await supabase
        .from("vehiculo")
        .select("id, marca, modelo, anio, precio")
        .in("id", vehicleIds);

      const { data: imagesData } = await supabase
        .from("imagen_vehiculo")
        .select("vehiculo_id, url_imagen")
        .in("vehiculo_id", vehicleIds)
        .eq("es_principal", true);

      const vehiclesMap = new Map(
        vehiclesData?.map((v) => [
          v.id,
          {
            ...v,
            imagen_url: imagesData?.find((img) => img.vehiculo_id === v.id)
              ?.url_imagen,
          },
        ])
      );

      const quotesWithVehicles = quotesData.map((quote) => ({
        ...quote,
        vehiculo: vehiclesMap.get(quote.vehiculo_id) || {
          marca: "Desconocido",
          modelo: "",
          anio: 0,
          precio: 0,
        },
      }));

      setQuotes(quotesWithVehicles);
    } catch (error) {
      console.error("Error al cargar cotizaciones:", error);
    }
  };

  const filterQuotes = () => {
    if (activeStatus === "todos") {
      setFilteredQuotes(quotes);
    } else {
      setFilteredQuotes(quotes.filter((q) => q.estado === activeStatus));
    }
  };

  const updateQuoteStatus = async (quoteId: number, newStatus: string) => {
    if (!empresaId) return;

    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from("cotizacion")
        .update({ estado: newStatus })
        .eq("id", quoteId);

      if (error) throw error;

      setQuotes((prev) =>
        prev.map((q) => (q.id === quoteId ? { ...q, estado: newStatus } : q))
      );

      if (selectedQuote && selectedQuote.id === quoteId) {
        setSelectedQuote({ ...selectedQuote, estado: newStatus });
      }

      alert("Estado actualizado correctamente");
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      alert("Error al actualizar el estado");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendiente":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "en_proceso":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "respondida":
        return "bg-green-50 text-green-700 border-green-200";
      case "cerrada":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    return config ? config.label : status;
  };

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
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            {/* Mobile back button */}
            <button
              onClick={() => router.push("/profile")}
              className="sm:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">
                  Cotizaciones
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  {quotes.length} {quotes.length !== 1 ? "solicitudes" : "solicitud"}
                </p>
              </div>
            </div>

            {/* Desktop back button */}
            <button
              onClick={() => router.push("/business-profile")}
              className="hidden sm:block px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              Volver al perfil
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Status Tabs */}
        <div className="bg-white rounded-xl border border-gray-100 p-1.5 sm:p-2 mb-4 sm:mb-6 overflow-x-auto">
          <div className="flex gap-1.5 sm:gap-2 min-w-max">
            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              const count =
                key === "todos"
                  ? quotes.length
                  : quotes.filter((q) => q.estado === key).length;
              const isActive = activeStatus === key;

              return (
                <button
                  key={key}
                  onClick={() => setActiveStatus(key as QuoteStatus)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden xs:inline">{config.label}</span>
                  <span
                    className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quotes List */}
        {filteredQuotes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 sm:p-12 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">
              No hay solicitudes
            </h3>
            <p className="text-gray-600 text-sm">
              {activeStatus === "todos"
                ? "Aún no has recibido solicitudes de cotización"
                : `No hay solicitudes con estado "${getStatusLabel(
                    activeStatus
                  )}"`}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {filteredQuotes.map((quote) => (
              <div
                key={quote.id}
                className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedQuote(quote)}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Vehicle Image */}
                  <div className="w-20 h-16 sm:w-32 sm:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {quote.vehiculo.imagen_url ? (
                      <img
                        src={quote.vehiculo.imagen_url}
                        alt={`${quote.vehiculo.marca} ${quote.vehiculo.modelo}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Quote Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-1 truncate">
                          {quote.vehiculo.marca} {quote.vehiculo.modelo}{" "}
                          {quote.vehiculo.anio}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {formatPrice(quote.vehiculo.precio)}
                        </p>
                      </div>
                      <span
                        className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusColor(
                          quote.estado
                        )}`}
                      >
                        {getStatusLabel(quote.estado)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">
                          {quote.nombre_solicitante}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{quote.telefono_solicitante}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 col-span-1 sm:col-span-2">
                        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">
                          {quote.email_solicitante}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 col-span-1 sm:col-span-2">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <span>{formatDate(quote.created_at)}</span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                      {quote.mensaje}
                    </p>
                  </div>

                  <ChevronRight className="hidden sm:block w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Quote Detail Modal */}
      {selectedQuote && (
        <QuoteDetailModal
          quote={selectedQuote}
          onClose={() => setSelectedQuote(null)}
          onUpdateStatus={updateQuoteStatus}
          updatingStatus={updatingStatus}
        />
      )}
    </div>
  );
}

// Modal Component
const QuoteDetailModal = ({
  quote,
  onClose,
  onUpdateStatus,
  updatingStatus,
}: {
  quote: Quote;
  onClose: () => void;
  onUpdateStatus: (quoteId: number, status: string) => void;
  updatingStatus: boolean;
}) => {
  const router = useRouter();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl border border-gray-100 shadow-xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 sm:p-6 z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                Detalles de la Solicitud
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                Recibida el {formatDate(quote.created_at)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Vehicle Info */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3">
              Vehículo de Interés
            </h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              {quote.vehiculo.imagen_url ? (
                <img
                  src={quote.vehiculo.imagen_url}
                  alt={`${quote.vehiculo.marca} ${quote.vehiculo.modelo}`}
                  className="w-full sm:w-24 h-32 sm:h-20 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full sm:w-24 h-32 sm:h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Car className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm sm:text-base text-gray-900 truncate">
                  {quote.vehiculo.marca} {quote.vehiculo.modelo}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  Año {quote.vehiculo.anio}
                </p>
                <p className="text-sm sm:text-base font-semibold text-gray-900 mt-1">
                  {formatPrice(quote.vehiculo.precio)}
                </p>
              </div>
              <button
                onClick={() => router.push(`/vehicle/${quote.vehiculo_id}`)}
                className="w-full sm:w-auto sm:ml-auto px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Ver vehículo
              </button>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3">
              Información del Solicitante
            </h3>
            <div className="grid gap-2 sm:gap-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600">Nombre completo</p>
                  <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                    {quote.nombre_solicitante}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600">Correo electrónico</p>
                  <p className="text-sm sm:text-base font-semibold text-gray-900 break-all">
                    {quote.email_solicitante}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600">Teléfono</p>
                  <p className="text-sm sm:text-base font-semibold text-gray-900">
                    {quote.telefono_solicitante}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3">
              Mensaje del Cliente
            </h3>
            <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
              <p className="text-sm sm:text-base text-gray-700 whitespace-pre-line">
                {quote.mensaje}
              </p>
            </div>
          </div>

          {/* Status Management */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3">
              Estado de la Solicitud
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {["pendiente", "en_proceso", "respondida", "cerrada"].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => onUpdateStatus(quote.id, status)}
                    disabled={updatingStatus || quote.estado === status}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                      quote.estado === status
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                    }`}
                  >
                    {updatingStatus && quote.estado === status ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label
                    )}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-100">
            <a
              href={`mailto:${quote.email_solicitante}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Enviar Email
            </a>
            <a
              href={`tel:${quote.telefono_solicitante}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Llamar
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
