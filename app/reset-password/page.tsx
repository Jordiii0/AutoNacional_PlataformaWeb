"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Loader2, Lock, CheckCircle, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // ✅ Verificar si hay sesión/token válido
  useEffect(() => {
    const checkToken = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setTokenValid(false);
        setMsg(
          "El enlace de reseteo ha expirado o es inválido. Solicita uno nuevo."
        );
      } else {
        setUserId(session.user.id);
      }
    };

    checkToken();
  }, []);

  // ✅ Validación de fortaleza de contraseña
  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres.";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "Debe contener al menos una mayúscula.";
    }
    if (!/[a-z]/.test(pwd)) {
      return "Debe contener al menos una minúscula.";
    }
    if (!/[0-9]/.test(pwd)) {
      return "Debe contener al menos un número.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setSuccess(false);

    // ✅ Validaciones mejoradas
    if (!password || !confirm) {
      setMsg("Debes completar ambos campos.");
      return;
    }

    if (password !== confirm) {
      setMsg("Las contraseñas no coinciden.");
      return;
    }

    // ✅ Validar fortaleza de contraseña
    const passwordError = validatePassword(password);
    if (passwordError) {
      setMsg(passwordError);
      return;
    }

    setLoading(true);

    try {
      // ✅ Obtener la sesión actual
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setMsg(
          "Tu sesión ha expirado. Por favor solicita un nuevo enlace de reseteo."
        );
        setLoading(false);
        setTimeout(() => router.replace("/forgot-password"), 2000);
        return;
      }

      // ✅ Actualizar la contraseña
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error("Error actualizando contraseña:", error);
        setMsg(error.message || "Error al restablecer tu contraseña.");
        setLoading(false);
        return;
      }

      // ✅ Éxito
      setSuccess(true);
      setMsg("¡Contraseña restablecida correctamente!");
      setPassword("");
      setConfirm("");

      // ✅ Redirigir al perfil del usuario (sin cerrar sesión)
      setTimeout(() => {
        // Verificar el rol del usuario para redirigir al perfil correcto
        const checkUserRole = async () => {
          try {
            const { data: userData } = await supabase
              .from("usuario")
              .select("rol")
              .eq("id", session.user.id)
              .single();

            if (userData?.rol === "administrador") {
              router.replace("/admin-dashboard");
            } else if (userData?.rol === "empresa") {
              router.replace("/business-profile");
            } else {
              router.replace("/profile");
            }
          } catch (error) {
            console.error("Error verificando rol:", error);
            router.replace("/profile"); // Redirigir a perfil por defecto
          }
        };

        checkUserRole();
      }, 2000);
    } catch (error: any) {
      console.error("Error:", error);
      setMsg(
        error.message ||
          "Ocurrió un error inesperado. Por favor intenta nuevamente más tarde."
      );
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Enlace expirado
          </h2>
          <p className="text-gray-600 mb-6">
            El enlace de reseteo ha expirado o es inválido. Solicita uno nuevo.
          </p>
          <button
            onClick={() => router.replace("/forgot-password")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold transition-colors"
          >
            Volver a solicitar enlace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="mb-8 text-center">
          <Lock className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Restablecer contraseña
          </h2>
          <p className="text-gray-500 text-sm">
            Ingresa una nueva contraseña para tu cuenta.
          </p>
        </div>

        {msg && (
          <div
            className={`mb-4 p-3 rounded-lg flex gap-2 text-sm ${
              success
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {success ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <span>{msg}</span>
          </div>
        )}

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nueva Contraseña *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors disabled:bg-gray-100"
                minLength={8}
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 8 caracteres, mayúscula, minúscula y número.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirmar Contraseña *
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors disabled:bg-gray-100"
                minLength={8}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 rounded-lg font-bold flex gap-2 items-center justify-center transition-colors disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Restablecer Contraseña
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center mt-5">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-green-600 font-semibold">
              ¡Contraseña restablecida correctamente!
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Redirigiendo a tu perfil...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
