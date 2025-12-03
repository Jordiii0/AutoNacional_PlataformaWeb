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
} from "lucide-react";

interface Region {
  id: number;
  nombre_region: string;
}

interface Ciudad {
  id: number;
  nombre_ciudad: string;
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
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    checkAuth();
    loadRegions();
  }, []);

  // Cargar ciudades cuando cambia la región seleccionada
  useEffect(() => {
    if (!registerForm.region) {
      setCiudades([]);
      setRegisterForm((prev) => ({ ...prev, ciudad: "" }));
      return;
    }

    const fetchCiudades = async () => {
      try {
        const { data, error } = await supabase
          .from("ciudad")
          .select("id, nombre_ciudad")
          .eq("region_id", parseInt(registerForm.region, 10))
          .order("nombre_ciudad");
        if (error) throw error;
        setCiudades(data || []);
      } catch (error) {
        console.error("Error cargando ciudades:", error);
      }
    };

    fetchCiudades();
  }, [registerForm.region]);

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
      if (registerForm.password.length < 6) {
        setErrorMessage("La contraseña debe tener al menos 6 caracteres");
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
        setErrorMessage("Por favor selecciona una ciudad");
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
                      placeholder="empresa@ejemplo.com"
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

              <div>
                <label
                  htmlFor="direccion"
                  className="block text-xs font-medium text-gray-700 mb-2"
                >
                  Dirección
                </label>
                <input
                  id="direccion"
                  type="text"
                  name="direccion"
                  value={registerForm.direccion}
                  onChange={handleInputChange}
                  placeholder="Calle Falsa 123"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                  disabled={loading}
                />
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
                    placeholder="Juan Pérez Gómez"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label
                    htmlFor="rut_representante"
                    className="block text-xs font-medium text-gray-700 mb-2"
                  >
                    RUT Representante *
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
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <select
                      id="region"
                      name="region"
                      value={registerForm.region}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition appearance-none"
                      disabled={loading}
                      required
                    >
                      <option value="">Selecciona región</option>
                      {regions.map((region) => (
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
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <select
                      id="ciudad"
                      name="ciudad"
                      value={registerForm.ciudad}
                      onChange={handleInputChange}
                      disabled={!registerForm.region || ciudades.length === 0 || loading}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition appearance-none"
                      required
                    >
                      <option value="">
                        {registerForm.region
                          ? ciudades.length > 0
                            ? "Selecciona ciudad"
                            : "Cargando ciudades..."
                          : "Selecciona una región primero"}
                      </option>
                      {ciudades.map((ciudad) => (
                        <option key={ciudad.id} value={ciudad.nombre_ciudad}>
                          {ciudad.nombre_ciudad}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Información Adicional */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Globe className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Información Adicional
                </h3>
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
                    placeholder="https://www.tuempresa.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="descripcion"
                  className="block text-xs font-medium text-gray-700 mb-2"
                >
                  Descripción de la Empresa
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  rows={3}
                  value={registerForm.descripcion}
                  onChange={handleInputChange}
                  placeholder="Breve descripción de tu empresa y servicios..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition resize-vertical"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Contraseñas */}
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-gray-700 mb-2"
                >
                  Contraseña *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={registerForm.password}
                    onChange={handleInputChange}
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
                <p className="text-xs text-gray-500 mt-1.5">Mínimo 6 caracteres</p>
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
              </div>
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
                  Registrar Empresa
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
