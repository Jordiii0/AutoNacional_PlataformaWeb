"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  User,
  Phone,
  MapPin,
  Car,
  ArrowRight,
  ArrowLeft,
  Shield,
  X,
  Check,
} from "lucide-react";

interface Region {
  id: number;
  nombre_region: string;
}

// ✅ NUEVO: Tipos para validación de contraseña
interface PasswordStrength {
  score: number; // 0-5
  label: string;
  color: string;
  requirements: {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    correo: "",
    rut: "",
    region_id: "",
    ciudad: "",
    password: "",
    confirmPassword: "",
  });

  const [regiones, setRegiones] = useState<Region[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  
  // ✅ NUEVO: Estado para fuerza de contraseña
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: "",
    color: "",
    requirements: {
      minLength: false,
      hasUpperCase: false,
      hasLowerCase: false,
      hasNumber: false,
      hasSpecial: false,
    },
  });
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  useEffect(() => {
    const fetchRegiones = async () => {
      const { data, error } = await supabase
        .from("region")
        .select("id, nombre_region")
        .order("nombre_region", { ascending: true });
      if (!error) setRegiones(data || []);
    };
    fetchRegiones();
  }, []);

  // ✅ NUEVO: Función para calcular fuerza de contraseña
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    const requirements = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    const metRequirements = Object.values(requirements).filter(Boolean).length;
    let score = 0;
    let label = "";
    let color = "";

    if (password.length === 0) {
      return { score: 0, label: "", color: "", requirements };
    }

    // Scoring basado en NIST y mejores prácticas [web:90]
    if (metRequirements <= 2) {
      score = 1;
      label = "Muy débil";
      color = "bg-red-500";
    } else if (metRequirements === 3) {
      score = 2;
      label = "Débil";
      color = "bg-orange-500";
    } else if (metRequirements === 4) {
      score = 3;
      label = "Aceptable";
      color = "bg-yellow-500";
    } else if (metRequirements === 5 && password.length >= 8) {
      score = 4;
      label = "Fuerte";
      color = "bg-green-500";
    }

    if (metRequirements === 5 && password.length >= 12) {
      score = 5;
      label = "Muy fuerte";
      color = "bg-green-600";
    }

    return { score, label, color, requirements };
  };

  // ✅ NUEVO: Actualizar fuerza cuando cambia la contraseña
  useEffect(() => {
    const strength = calculatePasswordStrength(form.password);
    setPasswordStrength(strength);
  }, [form.password]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMsg("");
  };

  const validateRUT = (rut: string): boolean => {
    const cleanRUT = rut.replace(/\./g, "").replace(/-/g, "");
    return cleanRUT.length >= 8 && cleanRUT.length <= 12;
  };

  // ✅ NUEVO: Validación mejorada de contraseña segura
  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: "La contraseña debe tener al menos 8 caracteres." };
    }

    const strength = calculatePasswordStrength(password);
    
    // Requiere al menos 4 de 5 requisitos cumplidos
    const metRequirements = Object.values(strength.requirements).filter(Boolean).length;
    
    if (metRequirements < 4) {
      return {
        valid: false,
        message: "La contraseña debe incluir al menos: mayúsculas, minúsculas, números y caracteres especiales.",
      };
    }

    // Verificar contraseñas comunes (lista básica)
    const commonPasswords = [
      "password", "123456", "12345678", "qwerty", "abc123", 
      "password123", "contraseña", "admin", "letmein"
    ];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      return { valid: false, message: "Contraseña demasiado común. Elige una más única." };
    }

    return { valid: true, message: "" };
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    
    try {
      if (
        !form.nombre.trim() ||
        !form.apellido.trim() ||
        !form.rut.trim() ||
        !form.correo.trim()
      ) {
        setMsg("Por favor completa nombre, apellido, RUT y correo.");
        setLoading(false);
        return;
      }
      
      if (!validateRUT(form.rut)) {
        setMsg("RUT inválido.");
        setLoading(false);
        return;
      }
      
      if (!form.correo.includes("@")) {
        setMsg("Por favor ingresa un correo válido.");
        setLoading(false);
        return;
      }

      // ✅ NUEVO: Validación de contraseña segura
      const passwordValidation = validatePassword(form.password);
      if (!passwordValidation.valid) {
        setMsg(passwordValidation.message);
        setLoading(false);
        return;
      }

      if (form.password !== form.confirmPassword) {
        setMsg("Las contraseñas no coinciden.");
        setLoading(false);
        return;
      }
      
      if (!form.region_id) {
        setMsg("Por favor selecciona una región.");
        setLoading(false);
        return;
      }
      
      if (!form.ciudad.trim()) {
        setMsg("Por favor ingresa tu ciudad.");
        setLoading(false);
        return;
      }

      const { data: usuarioExistente, error: errorVerificacion } =
        await supabase
          .from("usuario")
          .select("id")
          .eq("correo", form.correo.trim())
          .maybeSingle();

      if (errorVerificacion) {
        throw new Error(
          "Error verificando correo: " + errorVerificacion.message
        );
      }

      if (usuarioExistente) {
        setMsg("Este correo ya está registrado. Por favor usa otro.");
        setLoading(false);
        return;
      }

      const ciudadNombre = form.ciudad.trim();
      const regionIdInt = parseInt(form.region_id);
      let ciudadId: number | null = null;

      const { data: ciudadExistente, error: errorBusqueda } = await supabase
        .from("ciudad")
        .select("id")
        .eq("nombre_ciudad", ciudadNombre)
        .eq("region_id", regionIdInt)
        .maybeSingle();

      if (errorBusqueda)
        throw new Error("Error buscando ciudad: " + errorBusqueda.message);

      if (ciudadExistente) {
        ciudadId = ciudadExistente.id;
      } else {
        const { data: ciudadNueva, error: errorInsertCiudad } = await supabase
          .from("ciudad")
          .insert({ nombre_ciudad: ciudadNombre, region_id: regionIdInt })
          .select()
          .single();
        if (errorInsertCiudad)
          throw new Error("Error creando ciudad: " + errorInsertCiudad.message);
        ciudadId = ciudadNueva.id;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.correo.trim(),
        password: form.password,
      });

      if (authError) {
        throw new Error("Error en registro de Auth: " + authError.message);
      }

      const userId = authData?.user?.id;
      if (!userId) {
        throw new Error("No se obtuvo ID del usuario creado en Auth.");
      }

      const { error: insertError } = await supabase.from("usuario").insert({
        id: userId,
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        telefono: form.telefono.trim() || null,
        correo: form.correo.trim(),
        rut: form.rut.trim(),
        region_id: regionIdInt,
        ciudad_id: ciudadId,
        habilitado: true,
        rol: "usuario",
      });

      if (insertError) {
        try {
          await supabase.auth.admin.deleteUser(userId);
        } catch (cleanupError) {
          console.error("Error en limpieza:", cleanupError);
        }
        throw new Error(insertError.message || JSON.stringify(insertError));
      }

      setMsg("¡Cuenta creada exitosamente! Redirigiendo...");
      setTimeout(() => router.push("/profile"), 2000);
    } catch (err: any) {
      console.error("Error en registro:", err);
      setMsg(err?.message || JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push("/login")}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al login
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Crear Cuenta
                </h1>
                <p className="text-sm text-gray-500">Registro de Usuario</p>
              </div>
            </div>
          </div>

          {/* Mensajes */}
          {msg && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-start gap-3 border text-sm
               ${
                 msg.includes("exitosamente")
                   ? "bg-green-50 border-green-100"
                   : "bg-red-50 border-red-100"
               }`}
            >
              {msg.includes("exitosamente") ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <p
                className={
                  msg.includes("exitosamente")
                    ? "text-green-700"
                    : "text-red-700"
                }
              >
                {msg}
              </p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Nombre y Apellido */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="nombre"
                  className="block text-xs font-medium text-gray-700 mb-2"
                >
                  Nombre *
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Juan"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                  disabled={loading}
                />
              </div>
              <div>
                <label
                  htmlFor="apellido"
                  className="block text-xs font-medium text-gray-700 mb-2"
                >
                  Apellido *
                </label>
                <input
                  id="apellido"
                  name="apellido"
                  type="text"
                  value={form.apellido}
                  onChange={handleChange}
                  placeholder="Pérez"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                  disabled={loading}
                />
              </div>
            </div>

            {/* RUT y Teléfono */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="rut"
                  className="block text-xs font-medium text-gray-700 mb-2"
                >
                  RUT *
                </label>
                <input
                  id="rut"
                  name="rut"
                  type="text"
                  value={form.rut}
                  onChange={handleChange}
                  placeholder="12.345.678-9"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                  disabled={loading}
                />
              </div>
              <div>
                <label
                  htmlFor="telefono"
                  className="block text-xs font-medium text-gray-700 mb-2"
                >
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    value={form.telefono}
                    onChange={handleChange}
                    placeholder="+56912345678"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="correo"
                className="block text-xs font-medium text-gray-700 mb-2"
              >
                Correo *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="correo"
                  name="correo"
                  type="email"
                  value={form.correo}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Región y Ciudad */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="region_id"
                  className="block text-xs font-medium text-gray-700 mb-2"
                >
                  Región *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select
                    id="region_id"
                    name="region_id"
                    value={form.region_id}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition appearance-none"
                    disabled={loading}
                    required
                  >
                    <option value="">Selecciona región</option>
                    {regiones.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.nombre_region}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label
                  htmlFor="ciudad"
                  className="block text-xs font-medium text-gray-700 mb-2"
                >
                  Ciudad *
                </label>
                <input
                  id="ciudad"
                  name="ciudad"
                  type="text"
                  value={form.ciudad}
                  onChange={handleChange}
                  placeholder="Santiago"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* ✅ NUEVO: Contraseña con validación mejorada */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-gray-700"
                >
                  Contraseña *
                </label>
                <button
                  type="button"
                  onClick={() => setShowPasswordRequirements(!showPasswordRequirements)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <Shield className="w-3 h-3" />
                  Requisitos
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => setShowPasswordRequirements(true)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-12 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* ✅ NUEVO: Barra de fuerza de contraseña */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          level <= passwordStrength.score
                            ? passwordStrength.color
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  {passwordStrength.label && (
                    <p className="text-xs font-medium text-gray-600">
                      Fuerza: <span className={`${passwordStrength.color.replace('bg-', 'text-')}`}>
                        {passwordStrength.label}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* ✅ NUEVO: Lista de requisitos */}
              {showPasswordRequirements && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                  <p className="text-xs font-semibold text-gray-700 mb-2">
                    La contraseña debe incluir:
                  </p>
                  {[
                    { key: 'minLength', label: 'Al menos 8 caracteres' },
                    { key: 'hasUpperCase', label: 'Una letra mayúscula (A-Z)' },
                    { key: 'hasLowerCase', label: 'Una letra minúscula (a-z)' },
                    { key: 'hasNumber', label: 'Un número (0-9)' },
                    { key: 'hasSpecial', label: 'Un carácter especial (!@#$%...)' },
                  ].map(({ key, label }) => {
                    const met = passwordStrength.requirements[key as keyof typeof passwordStrength.requirements];
                    return (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        {met ? (
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        <span className={met ? "text-green-700" : "text-gray-600"}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-medium text-gray-700 mb-2"
              >
                Confirmar Contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-12 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {/* ✅ NUEVO: Indicador de coincidencia */}
              {form.confirmPassword && (
                <p className={`text-xs mt-1.5 flex items-center gap-1 ${
                  form.password === form.confirmPassword
                    ? "text-green-600"
                    : "text-red-600"
                }`}>
                  {form.password === form.confirmPassword ? (
                    <>
                      <Check className="w-3 h-3" />
                      Las contraseñas coinciden
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3" />
                      Las contraseñas no coinciden
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white font-medium py-2.5 text-sm rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  Crear Cuenta
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-gray-400 text-xs mt-6">
            Al registrarte aceptas nuestros términos y condiciones
          </p>
        </div>
      </div>
    </div>
  );
}
