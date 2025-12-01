"use client";

import React, { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Clock,
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    asunto: "",
    mensaje: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validaciones
    if (
      !formData.nombre ||
      !formData.email ||
      !formData.asunto ||
      !formData.mensaje
    ) {
      setError("Por favor completa todos los campos obligatorios.");
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Por favor ingresa un correo electrónico válido.");
      setLoading(false);
      return;
    }

    try {
      // Aquí puedes enviar los datos a tu backend o usar un servicio como SendGrid, Resend, etc.
      // Por ahora, simulamos el envío
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Error al enviar el mensaje");
      }

      setSubmitted(true);
      setFormData({
        nombre: "",
        email: "",
        telefono: "",
        asunto: "",
        mensaje: "",
      });

      // Limpiar el mensaje de éxito después de 5 segundos
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err: any) {
      setError(
        err.message ||
          "Ocurrió un error al enviar tu mensaje. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block mb-4">
            <span className="px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
              Ponte en Contacto
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
            ¿Tienes{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Preguntas?
            </span>
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Nos encantaría escucharte. Nuestro equipo está disponible para
            ayudarte con cualquier pregunta o comentario sobre carNETwork.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Email */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-8 border border-blue-200 hover:shadow-xl transition-all duration-300">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-200 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <Mail className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Correo Electrónico
              </h3>
              <p className="text-gray-700 mb-4">
                Responderemos en las próximas 24 horas
              </p>
              <a
                href="mailto:contacto@carnetwork.com"
                className="text-blue-600 font-semibold hover:text-blue-700"
              >
                contacto@carnetwork.com
              </a>
            </div>

            {/* Teléfono */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-8 border border-green-200 hover:shadow-xl transition-all duration-300">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-green-200 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <Phone className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Teléfono</h3>
              <p className="text-gray-700 mb-4">Lun - Vie de 9:00 a 18:00</p>
              <a
                href="tel:+56912345678"
                className="text-green-600 font-semibold hover:text-green-700"
              >
                +56 9 1234 5678
              </a>
            </div>

            {/* Ubicación */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 p-8 border border-pink-200 hover:shadow-xl transition-all duration-300">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-pink-200 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <MapPin className="w-12 h-12 text-pink-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Ubicación
              </h3>
              <p className="text-gray-700 mb-4">Santiago, Chile</p>
              <a
                href="#"
                className="text-pink-600 font-semibold hover:text-pink-700"
              >
                Ver en el mapa
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Envíanos tu Mensaje
                </h2>

                {submitted && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-green-900">
                        ¡Mensaje enviado exitosamente!
                      </h3>
                      <p className="text-sm text-green-800">
                        Nos pondremos en contacto pronto.
                      </p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-900">Error</h3>
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      placeholder="Juan Pérez"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      disabled={loading}
                    />
                  </div>

                  {/* Email y Teléfono */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Correo Electrónico *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="tu@email.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Teléfono (Opcional)
                      </label>
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="+56 9 1234 5678"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Asunto */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Asunto *
                    </label>
                    <select
                      name="asunto"
                      value={formData.asunto}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors appearance-none bg-white"
                      disabled={loading}
                    >
                      <option value="">Selecciona un asunto</option>
                      <option value="general">Consulta General</option>
                      <option value="soporte">Soporte Técnico</option>
                      <option value="negocios">
                        Oportunidades de Negocios
                      </option>
                      <option value="publicidad">Publicidad y Marketing</option>
                      <option value="feedback">Feedback y Sugerencias</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  {/* Mensaje */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mensaje *
                    </label>
                    <textarea
                      name="mensaje"
                      value={formData.mensaje}
                      onChange={handleChange}
                      placeholder="Cuéntanos cómo podemos ayudarte..."
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none"
                      disabled={loading}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Enviar Mensaje
                      </>
                    )}
                  </button>
                </form>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Protegemos tu privacidad. Lee nuestra{" "}
                  <a href="#" className="text-indigo-600 hover:underline">
                    política de privacidad
                  </a>
                  .
                </p>
              </div>
            </div>

            {/* Sidebar Info */}
            <div className="lg:col-span-1">
              {/* Hours */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-6 h-6 text-indigo-600" />
                  <h3 className="text-lg font-bold text-gray-900">Horarios</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Lunes - Viernes</span>
                    <span className="font-semibold">9:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sábado</span>
                    <span className="font-semibold">10:00 - 14:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Domingo</span>
                    <span className="font-semibold">Cerrado</span>
                  </div>
                </div>
              </div>

              {/* FAQ */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-bold text-gray-900">
                    Preguntas Frecuentes
                  </h3>
                </div>
                <div className="space-y-3 text-sm">
                  <a
                    href="#"
                    className="block text-purple-600 hover:text-purple-700 font-medium"
                  >
                    → Cómo publicar un vehículo
                  </a>
                  <a
                    href="#"
                    className="block text-purple-600 hover:text-purple-700 font-medium"
                  >
                    → Política de precios
                  </a>
                  <a
                    href="#"
                    className="block text-purple-600 hover:text-purple-700 font-medium"
                  >
                    → Requisitos de seguridad
                  </a>
                  <a
                    href="#"
                    className="block text-purple-600 hover:text-purple-700 font-medium"
                  >
                    → Opciones de pago
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Encuéntranos en el Mapa
          </h2>

          <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200 h-96">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2298.600802910866!2d-71.62401550587334!3d-35.43716802789566!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9665c6d4505bc4fb%3A0x45ecdd51bb8bc151!2sInacap%20Talca!5e0!3m2!1ses!2scl!4v1764457302862!5m2!1ses!2scl"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

          {/* Información de contacto */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-block p-3 bg-indigo-100 rounded-lg mb-4">
                <MapPin className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Ubicación
              </h3>
              <p className="text-gray-600">Talca, Región del Maule, Chile</p>
            </div>

            <div className="text-center">
              <div className="inline-block p-3 bg-green-100 rounded-lg mb-4">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Teléfono</h3>
              <p className="text-gray-600">+56 9 1234 5678</p>
            </div>

            <div className="text-center">
              <div className="inline-block p-3 bg-blue-100 rounded-lg mb-4">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600">contacto@carnetwork.com</p>
            </div>
          </div>

          {/* Botón para abrir en Google Maps */}
          <div className="mt-8 text-center">
            <a
              href="https://www.google.com/maps/place/Inacap+Talca/@-35.43716802789566,-71.62401550587334,15z"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md"
            >
              <MapPin className="w-5 h-5" />
              Ver en Google Maps
            </a>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            ¿Aún tienes dudas?
          </h2>
          <p className="text-indigo-100 text-lg mb-8">
            Nuestro equipo de soporte está listo para ayudarte en cualquier
            momento
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-indigo-600 rounded-lg font-bold text-lg hover:bg-indigo-50 transition-colors shadow-lg">
              Chat en Vivo
            </button>
            <button className="px-8 py-4 border-2 border-white text-white rounded-lg font-bold text-lg hover:bg-white/10 transition-colors">
              Ver Documentación
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
