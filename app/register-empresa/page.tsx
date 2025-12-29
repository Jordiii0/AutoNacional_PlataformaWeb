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
  Building2,
  Phone,
  MapPin,
  Car,
  ArrowLeft,
  ArrowRight,
  User,
  Shield,
  Globe,
  FileText,
  Check,
  X,
} from "lucide-react";

interface Region {
  id: number;
  nombre_region: string;
}

// ✅ NUEVO: Interface para validación de contraseña
interface PasswordStrength {
  score: number;
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

export default function RegisterEmpresaPage() {
  const router = useRouter();
  const [registerForm, setRegisterForm] = useState({
    nombre_comercial: "",
    rut_empresa: "",
    correo_electronico: "",
    telefono: "",
    direccion: "",
    representante_legal: "",
    rut_representante: "",
    telefono_representante: "",
    region: "",
    ciudad: "",
    sitio_web: "",
    descripcion: "",
    password: "",
    confirmPassword: "",
  });

  const [regions, setRegions] = useState<Region[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // ✅ NUEVO: Estados para validación de contraseña
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
    checkAuth();
    loadRegions();
  }, []);

  // ✅ NUEVO: Actualizar fuerza de contraseña en tiempo real
  useEffect(() => {
    const strength = calculatePasswordStrength(registerForm.password);
    setPasswordStrength(strength);
  }, [registerForm.password]);

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.push("/business-profile");
      }
    } catch (error) {
      console.error("Error checking auth:", error);
    }
  };

  const loadRegions = async () => {
    try {
      const { data, error } = await supabase
        .from("region")
        .select("id, nombre_region")
        .order("nombre_region", { ascending: true });
      if (error) throw error;
      setRegions(data || []);
    } catch (error) {
      console.error("Error loading regions:", error);
    }
  };

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

  // ✅ NUEVO: Validación de contraseña segura
  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: "La contraseña debe tener al menos 8 caracteres." };
    }

    const strength = calculatePasswordStrength(password);
    const metRequirements = Object.values(strength.requirements).filter(Boolean).length;

    if (metRequirements < 4) {
      return {
        valid: false,
        message: "La contraseña debe incluir al menos: mayúsculas, minúsculas, números y caracteres especiales.",
      };
    }

    const commonPasswords = [
      "password", "123456", "12345678", "qwerty", "abc123",
      "password123", "contraseña", "admin", "letmein", "empresa"
    ];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      return { valid: false, message: "Contraseña demasiado común. Elige una más única." };
    }

    return { valid: true, message: "" };
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrorMessage("");
  };

  const validateRUT = (rut: string): boolean => {
    const cleanRUT = rut.replace(/\./g, "").replace(/-/g, "");
    return cleanRUT.length >= 8 && cleanRUT.length <= 12;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (
        !registerForm.nombre_comercial.trim() ||
        !registerForm.rut_empresa.trim() ||
        !registerForm.correo_electronico.trim()
      ) {
        setErrorMessage(
          "Por favor completa nombre de empresa, RUT empresa y email"
        );
        setLoading(false);
        return;
      }
      if (!registerForm.representante_legal.trim()) {
        setErrorMessage("Por favor completa el nombre del representante legal");
        setLoading(false);
        return;
      }
      if (!registerForm.rut_representante.trim()) {
        setErrorMessage("Por favor completa el RUT del representante legal");
        setLoading(false);
        return;
      }
      if (!validateRUT(registerForm.rut_empresa)) {
        setErrorMessage("RUT de empresa inválido.");
        setLoading(false);
        return;
      }
      if (!validateRUT(registerForm.rut_representante)) {
        setErrorMessage("RUT del representante inválido.");
        setLoading(false);
        return;
      }
      if (!registerForm.correo_electronico.includes("@")) {
        setErrorMessage("Por favor ingresa un email válido");
        setLoading(false);
        return;
      }

      // ✅ NUEVO: Validación de contraseña segura
      const passwordValidation = validatePassword(registerForm.password);
      if (!passwordValidation.valid) {
        setErrorMessage(passwordValidation.message);
        setLoading(false);
        return;
      }

      if (registerForm.password !== registerForm.confirmPassword) {
        setErrorMessage("Las contraseñas no coinciden");
        setLoading(false);
        return;
      }
      if (!registerForm.region) {
        setErrorMessage("Por favor selecciona una región");
        setLoading(false);
        return;
      }
      if (!registerForm.ciudad.trim()) {
        setErrorMessage("Por favor ingresa la ciudad");
        setLoading(false);
        return;
      }

      const nombreCiudad = registerForm.ciudad.trim();
      const regionId = parseInt(registerForm.region, 10);
      let ciudadId: number | null = null;

      const { data: ciudadExistente, error: errorBusqueda } = await supabase
        .from("ciudad")
        .select("id")
        .eq("nombre_ciudad", nombreCiudad)
        .eq("region_id", regionId)
        .maybeSingle();

      if (errorBusqueda)
        throw new Error("Error buscando ciudad: " + errorBusqueda.message);

      if (ciudadExistente) {
        ciudadId = ciudadExistente.id;
      } else {
        const { data: ciudadNueva, error: errorInsertCiudad } = await supabase
          .from("ciudad")
          .insert({ nombre_ciudad: nombreCiudad, region_id: regionId })
          .select()
          .single();
        if (errorInsertCiudad)
          throw new Error("Error creando ciudad: " + errorInsertCiudad.message);
        ciudadId = ciudadNueva.id;
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email: registerForm.correo_electronico,
        password: registerForm.password,
      });

      const authData = data;
      if (authError) {
        if (authError.message.includes("already registered")) {
          setErrorMessage("Este email ya está registrado");
        } else {
          setErrorMessage(authError.message);
        }
        setLoading(false);
        return;
      }

      if (!authData?.user) {
        setErrorMessage("Error al crear la cuenta");
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from("empresa").insert({
        usuario_id: authData.user.id,
        nombre_comercial: registerForm.nombre_comercial.trim(),
        rut_empresa: registerForm.rut_empresa.trim(),
        correo_electronico: registerForm.correo_electronico.trim(),
        telefono: registerForm.telefono.trim() || null,
        direccion: registerForm.direccion.trim() || null,
        representante_legal: registerForm.representante_legal.trim(),
        rut_representante: registerForm.rut_representante.trim(),
        telefono_representante: registerForm.telefono_representante.trim() || null,
        region_id: regionId,
        ciudad_id: ciudadId,
        sitio_web: registerForm.sitio_web.trim() || null,
        descripcion: registerForm.descripcion.trim() || null,
        validada: false,
        habilitado: true,
      });

      if (insertError) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        setErrorMessage(
          "Error al guardar tu información. Por favor intenta de nuevo."
        );
        setLoading(false);
        return;
      }

      setSuccessMessage(
        "¡Empresa registrada exitosamente! Tu perfil será validado por un administrador. Redirigiendo..."
      );
      setTimeout(() => {
        router.push("/business-profile");
      }, 3000);
    } catch (error: any) {
      setErrorMessage(
        error.message || "Ocurrió un error. Por favor intenta de nuevo."
      );
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
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Registrar Empresa
                </h1>
                <p className="text-sm text-gray-500">Cuenta Empresarial</p>
              </div>
            </div>
          </div>

          {/* Mensajes */}
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

          {/* Formulario */}
          <form onSubmit={handleRegister} className="space-y-6">
            {/* Información de la Empresa */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Building2 className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Información de la Empresa
                </h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="nombre_comercial"
                    className="block text-xs font-medium text-gray-700 mb-2"
                  >
                    Nombre Comercial *
                  </label>
                  <input
                    id="nombre_comercial"
                    type="text"
                    name="nombre_comercial"
                    value={registerForm.nombre_comercial}
                    onChange={handleInputChange}
                    placeholder="Mi Empresa S.A."
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label
                    htmlFor="rut_empresa"
                    className="block text-xs font-medium text-gray-700 mb-2"
                  >
                    RUT Empresa *
                  </label>
                  <input
                    id="rut_empresa"
                    type="text"
                    name="rut_empresa"
                    value={registerForm.rut_empresa}
                    onChange={handleInputChange}
                    placeholder="12.345.678-9"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="correo_electronico"
                    className="block text-xs font-medium text-gray-700 mb-2"
                  >
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="correo_electronico"
                      type="email"
                      name="correo_electronico"
                      value={registerForm.correo_electronico}
                      onChange={handleInputChange}
                      placeholder="contacto@empresa.com"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="telefono"
                    className="block text-xs font-medium text-gray-700 mb-2"
                  >
                    Teléfono Empresa
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="telefono"
                      type="tel"
                      name="telefono"
                      value={registerForm.telefono}
                      onChange={handleInputChange}
                      placeholder="+56912345678"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="direccion"
                    className="block text-xs font-medium text-gray-700 mb-2"
                  >
                    Dirección
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="direccion"
                      type="text"
                      name="direccion"
                      value={registerForm.direccion}
                      onChange={handleInputChange}
                      placeholder="Av. Libertador 123"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="sitio_web"
                    className="block text-xs font-medium text-gray-700 mb-2"
                  >
                    Sitio Web
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="sitio_web"
                      type="url"
                      name="sitio_web"
                      value={registerForm.sitio_web}
                      onChange={handleInputChange}
                      placeholder="https://miempresa.com"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="descripcion"
                  className="block text-xs font-medium text-gray-700 mb-2"
                >
                  Descripción de la Empresa
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    value={registerForm.descripcion}
                    onChange={handleInputChange}
                    placeholder="Describe tu empresa, servicios y experiencia..."
                    rows={3}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition resize-none"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Representante Legal */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <User className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Representante Legal
                </h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="representante_legal"
                    className="block text-xs font-medium text-gray-700 mb-2"
                  >
                    Nombre Completo *
                  </label>
                  <input
                    id="representante_legal"
                    type="text"
                    name="representante_legal"
                    value={registerForm.representante_legal}
                    onChange={handleInputChange}
                    placeholder="Juan Pérez García"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label
                    htmlFor="rut_representante"
                    className="block text-xs font-medium text-gray-700 mb-2"
                  >
                    RUT *
                  </label>
                  <input
                    id="rut_representante"
                    type="text"
                    name="rut_representante"
                    value={registerForm.rut_representante}
                    onChange={handleInputChange}
                    placeholder="12.345.678-9"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="telefono_representante"
                  className="block text-xs font-medium text-gray-700 mb-2"
                >
                  Teléfono Representante
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="telefono_representante"
                    type="tel"
                    name="telefono_representante"
                    value={registerForm.telefono_representante}
                    onChange={handleInputChange}
                    placeholder="+56987654321"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <MapPin className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">Ubicación</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="region"
                    className="block text-xs font-medium text-gray-700 mb-2"
                  >
                    Región *
                  </label>
                  <select
                    id="region"
                    name="region"
                    value={registerForm.region}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition appearance-none"
                    disabled={loading}
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
                  <label
                    htmlFor="ciudad"
                    className="block text-xs font-medium text-gray-700 mb-2"
                  >
                    Ciudad *
                  </label>
                  <input
                    id="ciudad"
                    type="text"
                    name="ciudad"
                    value={registerForm.ciudad}
                    onChange={handleInputChange}
                    placeholder="Santiago"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* ✅ NUEVO: Seguridad con validación mejorada */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Shield className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">Seguridad</h3>
              </div>

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
                    value={registerForm.password}
                    onChange={handleInputChange}
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

                {/* ✅ NUEVO: Barra de fuerza */}
                {registerForm.password && (
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
                    value={registerForm.confirmPassword}
                    onChange={handleInputChange}
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
                {registerForm.confirmPassword && (
                  <p className={`text-xs mt-1.5 flex items-center gap-1 ${
                    registerForm.password === registerForm.confirmPassword
                      ? "text-green-600"
                      : "text-red-600"
                  }`}>
                    {registerForm.password === registerForm.confirmPassword ? (
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
            </div>

            {/* Nota de validación */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-amber-900 mb-1">
                    Validación requerida
                  </p>
                  <p className="text-xs text-amber-700">
                    Tu empresa será validada por un administrador antes de poder
                    publicar vehículos.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white font-medium py-2.5 text-sm rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  Registrar Empresa
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center space-y-2">
            <p className="text-xs text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-gray-900 font-medium hover:underline"
              >
                Iniciar sesión
              </button>
            </p>
            <p className="text-xs text-gray-600">
              ¿Eres un usuario particular?{" "}
              <button
                onClick={() => router.push("/register")}
                className="text-gray-900 font-medium hover:underline"
              >
                Registro de usuario
              </button>
            </p>
          </div>

          {/* Legal */}
          <p className="text-center text-gray-400 text-xs mt-6">
            Al registrarte aceptas nuestros términos y condiciones
          </p>
        </div>
      </div>
    </div>
  );
}
