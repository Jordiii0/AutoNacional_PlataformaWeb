"use client";
import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowRight,
  Car,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const userId = session.user.id;

        const { data: userData } = await supabase
          .from("usuario")
          .select("id, rol, habilitado")
          .eq("id", userId)
          .maybeSingle();

        if (userData) {
          if (userData.rol !== "administrador" && userData.habilitado === false) {
            setErrorMessage(
              "Tu cuenta ha sido deshabilitada. Contacta al administrador."
            );
            await supabase.auth.signOut();
            setCheckingSession(false);
            return;
          }
          if (userData.rol === "administrador" && pathname !== "/admin/profile") {
            router.replace("/admin/profile");
          } else if (userData.rol !== "administrador" && pathname !== "/profile") {
            router.replace("/profile");
          }
          return;
        }

        const { data: empresaData } = await supabase
          .from("empresa")
          .select("id, validada, habilitado")
          .eq("usuario_id", userId)
          .maybeSingle();

        if (empresaData && empresaData.habilitado === false) {
          setErrorMessage(
            "Tu cuenta de empresa ha sido deshabilitada. Contacta al administrador."
          );
          await supabase.auth.signOut();
          setCheckingSession(false);
          return;
        }
        if (empresaData && pathname !== "/business-profile") {
          router.replace("/business-profile");
          return;
        }

        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error("Error checking auth:", error);
    } finally {
      setCheckingSession(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrorMessage("");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMsg("");
    try {
      if (!forgotEmail.trim()) {
        setForgotMsg("Por favor ingresa tu email.");
        setForgotLoading(false);
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: "http://localhost:3000/reset-password",
      });
      if (error) {
        setForgotMsg(error.message || "No se pudo enviar el correo.");
      } else {
        setForgotMsg(
          "Si existe una cuenta con ese email se ha enviado un enlace de recuperación."
        );
      }
    } catch {
      setForgotMsg("Ocurrió un error. Intenta de nuevo.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (!loginForm.email.trim() || !loginForm.password.trim()) {
        setErrorMessage("Por favor completa todos los campos");
        setLoading(false);
        return;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (authError) {
        setErrorMessage(
          authError.message === "Invalid login credentials"
            ? "Email o contraseña incorrectos"
            : authError.message
        );
        setLoading(false);
        return;
      }

      if (!data.user) {
        setErrorMessage("Error al iniciar sesión");
        setLoading(false);
        return;
      }

      const userId = data.user.id;

      const { data: userData } = await supabase
        .from("usuario")
        .select("id, rol, habilitado")
        .eq("id", userId)
        .maybeSingle();

      if (userData) {
        if (userData.rol !== "administrador" && userData.habilitado === false) {
          setErrorMessage(
            "Tu cuenta ha sido deshabilitada. Contacta al administrador."
          );
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }
        setSuccessMessage("¡Bienvenido!");
        setTimeout(() => {
          if (userData.rol === "administrador") {
            router.replace("/admin/profile");
          } else {
            router.replace("/profile");
          }
        }, 1200);
        setLoading(false);
        return;
      }

      const { data: empresaData } = await supabase
        .from("empresa")
        .select("id, validada, habilitado")
        .eq("usuario_id", userId)
        .maybeSingle();

      if (empresaData && empresaData.habilitado === false) {
        setErrorMessage(
          "Tu cuenta de empresa ha sido deshabilitada. Contacta al administrador."
        );
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (empresaData) {
        setSuccessMessage("¡Bienvenido!");
        setTimeout(() => router.replace("/business-profile"), 1200);
        setLoading(false);
        return;
      }

      setErrorMessage("No se encontró tu perfil. Contacta al administrador.");
      await supabase.auth.signOut();
      setLoading(false);
    } catch (error: any) {
      console.error("Error en login:", error);
      setErrorMessage(error.message || "Ocurrió un error. Intenta de nuevo.");
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {/* Logo & Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-900 rounded-xl mb-4">
              <Car className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              AutoNacional
            </h1>
            <p className="text-sm text-gray-500">carNETwork Empresa</p>
          </div>

          {/* Messages */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
          )}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          )}

          {!showForgot ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={loginForm.email}
                    onChange={handleInputChange}
                    placeholder="tu@email.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-gray-700 mb-2"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={loginForm.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs text-gray-600 hover:text-gray-900 font-medium transition"
                  onClick={() => setShowForgot(true)}
                  disabled={loading}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white font-medium py-2.5 text-sm rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    Iniciar Sesión
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Forgot Password Form */
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-gray-900 mb-1">
                  Recuperar Contraseña
                </h2>
                <p className="text-xs text-gray-500">
                  Te enviaremos un enlace de recuperación
                </p>
              </div>

              <div>
                <label
                  htmlFor="forgotEmail"
                  className="block text-xs font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="forgotEmail"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                    disabled={forgotLoading}
                  />
                </div>
              </div>

              {forgotMsg && (
                <div
                  className={`p-3 border rounded-xl text-xs ${
                    forgotMsg.includes("enviado")
                      ? "bg-green-50 border-green-100 text-green-700"
                      : "bg-red-50 border-red-100 text-red-700"
                  }`}
                >
                  {forgotMsg}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg transition-colors"
                  onClick={() => {
                    setShowForgot(false);
                    setForgotMsg("");
                  }}
                  disabled={forgotLoading}
                >
                  Volver
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin inline" />
                  ) : (
                    "Enviar correo"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs text-gray-500">¿No tienes cuenta?</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Register Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push("/register")}
              className="w-full border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading || forgotLoading}
            >
              Registrarse como Usuario
            </button>
            <button
              onClick={() => router.push("/register-empresa")}
              className="w-full border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading || forgotLoading}
            >
              Registrarse como Empresa
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-400 text-xs mt-8">
            Al iniciar sesión aceptas nuestros términos y condiciones
          </p>
        </div>
      </div>
    </div>
  );
}
