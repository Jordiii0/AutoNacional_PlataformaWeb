"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Loader2,
  ArrowLeft,
  Car,
  User,
  Mail,
  Phone,
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle,
  Building,
} from "lucide-react";

interface Vehicle {
  id: number;
  marca: string;
  modelo: string;
  anio: number;
  precio: number;
  images: string[];
}

interface QuoteFormData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  mensaje: string;
}

export default function QuotePage() {
  const vehicleId = parseInt(useParams().id as string);
  const searchParams = useSearchParams();
  const empresaId = searchParams?.get("empresaId");
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState<QuoteFormData>({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    mensaje: "",
  });

  useEffect(() => {
    checkAuthAndLoadData();
  }, [vehicleId]);

  const checkAuthAndLoadData = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("Debes iniciar sesión para solicitar una cotización");
        router.push("/login");
        return;
      }

      const authUserId = session.user.id;
      setUserId(authUserId);

      const { data: userData } = await supabase
        .from("usuario")
        .select("nombre, apellido, correo_electronico, telefono")
        .eq("id", authUserId)
        .maybeSingle();

      if (userData) {
        setFormData({
          nombre: userData.nombre || "",
          apellido: userData.apellido || "",
          email: userData.correo_electronico || session.user.email || "",
          telefono: userData.telefono || "",
          mensaje: "",
        });
      }

      const { data: vehicleData, error: vehicleError } = await supabase
        .from("vehiculo")
        .select("id, marca, modelo, anio, precio")
        .eq("id", vehicleId)
        .single();

      if (vehicleError || !vehicleData) {
        setError("No se pudo cargar la información del vehículo");
        setLoading(false);
        return;
      }

      const { data: images } = await supabase
        .from("imagen_vehiculo")
        .select("url_imagen")
        .eq("vehiculo_id", vehicleId)
        .eq("es_principal", true)
        .limit(1);

      setVehicle({
        ...vehicleData,
        images: images?.map((img) => img.url_imagen) || [],
      });
    } catch (error: any) {
      console.error("Error:", error);
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !formData.nombre.trim() ||
      !formData.apellido.trim() ||
      !formData.email.trim() ||
      !formData.telefono.trim() ||
      !formData.mensaje.trim()
    ) {
      setError("Por favor completa todos los campos");
      return;
    }

    if (!userId || !empresaId) {
      setError("Datos de sesión inválidos");
      return;
    }

    setSubmitting(true);

    try {
      // Insertar cotización
      const { data: cotizacionData, error: insertError } = await supabase
        .from("cotizacion")
        .insert({
          vehiculo_id: vehicleId,
          empresa_id: empresaId,
          usuario_id: userId,
          nombre_solicitante: `${formData.nombre} ${formData.apellido}`,
          email_solicitante: formData.email,
          telefono_solicitante: formData.telefono,
          mensaje: formData.mensaje,
          estado: "pendiente",
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      // ✅ Crear notificación para la empresa
      const { error: notificationError } = await supabase
        .from("notificacion")
        .insert({
          empresa_id: empresaId,
          usuario_id: null,
          tipo: "cotizacion",
          titulo: "Nueva Solicitud de Cotización",
          mensaje: `${formData.nombre} ${formData.apellido} ha solicitado una cotización para el ${vehicle?.marca} ${vehicle?.modelo} ${vehicle?.anio}`,
          referencia_id: cotizacionData.id,
          leida: false,
        });

      if (notificationError) {
        console.error("Error al crear notificación:", notificationError);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/vehicle/${vehicleId}`);
      }, 3000);
    } catch (error: any) {
      console.error("Error al enviar cotización:", error);
      setError("Error al enviar la solicitud. Por favor intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gray-900 animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Solicitud Enviada!
          </h2>
          <p className="text-gray-600 mb-4">
            La empresa recibirá tu solicitud de cotización y te contactará pronto
          </p>
          <Loader2 className="w-6 h-6 text-gray-900 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error al cargar
          </h2>
          <p className="text-gray-600 mb-6">{error || "Vehículo no encontrado"}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
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
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Solicitar Cotización
              </h1>
              <p className="text-sm text-gray-500">
                Completa el formulario para recibir información
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Vehicle Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 p-4 sticky top-24">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Vehículo de interés
              </h3>
              
              {vehicle.images.length > 0 ? (
                <img
                  src={vehicle.images[0]}
                  alt={`${vehicle.marca} ${vehicle.modelo}`}
                  className="w-full aspect-video object-cover rounded-lg mb-3"
                />
              ) : (
                <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                  <Car className="w-12 h-12 text-gray-300" />
                </div>
              )}

              <h4 className="font-bold text-gray-900 mb-1">
                {vehicle.marca} {vehicle.modelo}
              </h4>
              <p className="text-sm text-gray-600 mb-2">Año {vehicle.anio}</p>
              <p className="text-xl font-bold text-gray-900">
                {formatPrice(vehicle.precio)}
              </p>
            </div>
          </div>

          {/* Quote Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                Información de contacto
              </h2>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Nombre *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) =>
                          setFormData({ ...formData, nombre: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        placeholder="Tu nombre"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Apellido *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.apellido}
                        onChange={(e) =>
                          setFormData({ ...formData, apellido: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        placeholder="Tu apellido"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Correo electrónico *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Teléfono *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) =>
                        setFormData({ ...formData, telefono: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="+56 9 1234 5678"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Mensaje *
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      value={formData.mensaje}
                      onChange={(e) =>
                        setFormData({ ...formData, mensaje: e.target.value })
                      }
                      rows={5}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                      placeholder="Describe qué información necesitas, forma de pago preferida, disponibilidad, etc..."
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      disabled={submitting}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Enviar Solicitud
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Nota:</strong> La empresa recibirá tu solicitud y te contactará 
                directamente para proporcionarte la cotización detallada del vehículo.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
