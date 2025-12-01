"use client";

import React, { useState } from "react";
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setStatus("error");
      setMessage("Por favor ingresa un email válido");
      return;
    }

    setStatus("loading");

    try {
      // Aquí va tu lógica de suscripción (ejemplo con Supabase o API)
      await supabase.from("newsletter").insert({
        email,
        created_at: new Date().toISOString(),
      });

      // Simulación de llamada API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setStatus("success");
      setMessage("¡Gracias por suscribirte! Revisa tu correo.");
      setEmail("");

      // Reset después de 5 segundos
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 5000);
    } catch (error) {
      setStatus("error");
      setMessage("Hubo un error. Intenta nuevamente.");
    }
  };

  return (
    <section className="mt-12 py-16 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Icono */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-lg">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Título */}
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
            Mantente Actualizado
          </h2>
          <p className="text-gray-600 text-center text-lg mb-8 max-w-2xl mx-auto">
            Suscríbete a nuestro boletín y recibe las últimas ofertas, noticias
            y consejos sobre vehículos directamente en tu correo.
          </p>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  disabled={status === "loading" || status === "success"}
                  className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                    status === "error"
                      ? "border-red-300 bg-red-50"
                      : status === "success"
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300 bg-white"
                  }`}
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading" || status === "success"}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="hidden sm:inline">Enviando...</span>
                  </>
                ) : status === "success" ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span className="hidden sm:inline">¡Listo!</span>
                  </>
                ) : (
                  <span>Suscribirse</span>
                )}
              </button>
            </div>

            {/* Mensajes de estado */}
            {message && (
              <div
                className={`mt-4 flex items-center gap-2 p-4 rounded-xl ${
                  status === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {status === "success" ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <p className="text-sm font-medium">{message}</p>
              </div>
            )}
          </form>

          {/* Beneficios */}
          <div className="mt-8 grid md:grid-cols-3 gap-6 text-center">
            <div className="p-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🚗</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">
                Ofertas Exclusivas
              </h3>
              <p className="text-sm text-gray-600">
                Descuentos especiales para suscriptores
              </p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📰</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">
                Noticias del Sector
              </h3>
              <p className="text-sm text-gray-600">
                Mantente informado del mercado
              </p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">
                Consejos Útiles
              </h3>
              <p className="text-sm text-gray-600">
                Guías de compra y mantenimiento
              </p>
            </div>
          </div>

          {/* Nota de privacidad */}
          <p className="text-xs text-gray-500 text-center mt-6">
            No compartimos tu información. Puedes cancelar tu suscripción en
            cualquier momento.
          </p>
        </div>
      </div>
    </section>
  );
}
