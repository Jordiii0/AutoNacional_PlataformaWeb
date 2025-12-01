"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Car,
  Upload,
  X,
  DollarSign,
  Calendar,
  Gauge,
  Fuel,
  Wrench,
  FileText,
  Save,
  ArrowLeft,
  ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  MapPin,
} from "lucide-react";

interface VehicleFormData {
  marca: string;
  modelo: string;
  anio: string;
  kilometraje: string;
  transmision: string;
  precio: string;
  estado_vehiculo: string;
  descripcion: string;
  cilindrada: string;
  tipo_vehiculo_id: string;
  tipo_combustible_id: string;
  region_id: string;
  ciudad_id: string;
}

interface CatalogItem {
  id: number;
  nombre: string;
}

interface Region {
  id: number;
  nombre_region: string;
  codigo_iso: string;
}

const TRANSMISSIONS = ["Manual", "Automática", "Semi-automática", "CVT"];
const CONDITIONS = ["Nuevo", "Usado", "Semi-nuevo", "Para reparar"];

export default function EditPublicationPage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = params?.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [tiposVehiculo, setTiposVehiculo] = useState<CatalogItem[]>([]);
  const [tiposCombustible, setTiposCombustible] = useState<CatalogItem[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<CatalogItem[]>([]);

  const [vehicleData, setVehicleData] = useState<VehicleFormData>({
    marca: "",
    modelo: "",
    anio: "",
    kilometraje: "",
    transmision: "",
    precio: "",
    estado_vehiculo: "",
    descripcion: "",
    cilindrada: "",
    tipo_vehiculo_id: "",
    tipo_combustible_id: "",
    region_id: "",
    ciudad_id: "",
  });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        router.push("/login");
        return;
      }

      setUser(session.user);
      await loadCatalogs();
      await loadVehicle(session.user.id);
      setLoading(false);
    };

    checkAuthAndLoad();
  }, [vehicleId, router]);

  const loadCatalogs = async () => {
    try {
      const { data: tiposData } = await supabase
        .from("tipo_vehiculo")
        .select("id, nombre_tipo")
        .order("nombre_tipo");
      setTiposVehiculo(
        (tiposData || []).map((item) => ({
          id: item.id,
          nombre: item.nombre_tipo,
        }))
      );

      const { data: combustibleData } = await supabase
        .from("tipo_combustible")
        .select("id, nombre_combustible")
        .order("nombre_combustible");
      setTiposCombustible(
        (combustibleData || []).map((item) => ({
          id: item.id,
          nombre: item.nombre_combustible,
        }))
      );

      const { data: regionesData } = await supabase
        .from("region")
        .select("id, nombre_region, codigo_iso")
        .order("nombre_region");
      setRegions(regionesData || []);
    } catch (error: any) {
      console.error("Error cargando catálogos:", error);
      setError("Error al cargar los catálogos");
    }
  };

  const loadCities = async (regionId: string) => {
    if (!regionId) {
      setCities([]);
      setVehicleData((prev) => ({ ...prev, ciudad_id: "" }));
      return;
    }
    const { data: citiesData } = await supabase
      .from("ciudad")
      .select("id, nombre_ciudad")
      .eq("region_id", parseInt(regionId))
      .order("nombre_ciudad");
    setCities(
      (citiesData || []).map((item) => ({
        id: item.id,
        nombre: item.nombre_ciudad,
      }))
    );
  };

  const loadVehicle = async (userId: string) => {
    try {
      const { data: vehiculoData, error: vehiculoError } = await supabase
        .from("vehiculo")
        .select("*, region_id, ciudad_id, usuario_id, empresa_id")
        .eq("id", parseInt(vehicleId))
        .single();

      if (vehiculoError) throw vehiculoError;

      let isOwner = false;

      if (vehiculoData.usuario_id === userId) {
        isOwner = true;
      }

      if (!isOwner && vehiculoData.empresa_id) {
        const { data: empresaOwnerData } = await supabase
          .from("empresa")
          .select("id")
          .eq("id", vehiculoData.empresa_id)
          .eq("usuario_id", userId)
          .maybeSingle();

        if (empresaOwnerData) {
          isOwner = true;
        }
      }

      if (!isOwner) {
        console.error(
          "Permiso denegado: El usuario no es dueño de este vehículo o empresa."
        );
        setError("No tienes permiso para editar este vehículo");
        setTimeout(() => router.push("/mypost"), 2000);
        return;
      }

      setVehicleData({
        marca: vehiculoData.marca,
        modelo: vehiculoData.modelo,
        anio: vehiculoData.anio?.toString() || "",
        kilometraje: vehiculoData.kilometraje?.toString() || "",
        transmision: vehiculoData.transmision || "",
        precio: vehiculoData.precio?.toString() || "",
        estado_vehiculo: vehiculoData.estado_vehiculo || "",
        descripcion: vehiculoData.descripcion || "",
        cilindrada: vehiculoData.cilindrada?.toString() || "",
        tipo_vehiculo_id: vehiculoData.tipo_vehiculo_id?.toString() || "",
        tipo_combustible_id: vehiculoData.tipo_combustible_id?.toString() || "",
        region_id: vehiculoData.region_id?.toString() || "",
        ciudad_id: vehiculoData.ciudad_id?.toString() || "",
      });

      if (vehiculoData.region_id) {
        await loadCities(vehiculoData.region_id?.toString());
      }

      const { data: imagenesData } = await supabase
        .from("imagen_vehiculo")
        .select("url_imagen")
        .eq("vehiculo_id", parseInt(vehicleId));

      setExistingImages(imagenesData?.map((img) => img.url_imagen) || []);
    } catch (error: any) {
      console.error("Error loading vehicle:", error);
      setError("Error al cargar el vehículo o verificar la propiedad.");
    }
  };

  useEffect(() => {
    if (vehicleData.region_id) {
      loadCities(vehicleData.region_id);
    } else {
      setCities([]);
      setVehicleData((prev) => ({ ...prev, ciudad_id: "" }));
    }
  }, [vehicleData.region_id]);

  const handleNewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages =
      existingImages.length -
      imagesToDelete.length +
      newImages.length +
      files.length;

    if (totalImages > 6) {
      setError("Máximo 6 imágenes permitidas");
      return;
    }

    const newImgs = [...newImages, ...files];
    setNewImages(newImgs);

    const newPrevs = newImgs.map((file) => URL.createObjectURL(file));
    setNewImagePreviews(newPrevs);
    setError("");
  };

  const removeExistingImage = (url: string) => {
    setImagesToDelete([...imagesToDelete, url]);
  };

  const undoRemoveImage = (url: string) => {
    setImagesToDelete(imagesToDelete.filter((u) => u !== url));
  };

  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index));
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setVehicleData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setError("");

    if (
      !vehicleData.marca.trim() ||
      !vehicleData.modelo.trim() ||
      !vehicleData.precio ||
      !vehicleData.anio ||
      !vehicleData.kilometraje ||
      !vehicleData.transmision ||
      !vehicleData.tipo_combustible_id ||
      !vehicleData.cilindrada ||
      !vehicleData.descripcion.trim() ||
      !vehicleData.estado_vehiculo ||
      !vehicleData.tipo_vehiculo_id ||
      !vehicleData.ciudad_id ||
      !vehicleData.region_id
    ) {
      setError("Por favor completa todos los campos obligatorios");
      return;
    }

    const remainingImages = existingImages.length - imagesToDelete.length;
    if (remainingImages + newImages.length === 0) {
      setError("Debes tener al menos una imagen del vehículo");
      return;
    }

    setSaving(true);

    try {
      const { error: vehicleError } = await supabase
        .from("vehiculo")
        .update({
          marca: vehicleData.marca.trim(),
          modelo: vehicleData.modelo.trim(),
          anio: parseInt(vehicleData.anio),
          kilometraje: parseFloat(vehicleData.kilometraje),
          transmision: vehicleData.transmision,
          precio: parseFloat(vehicleData.precio),
          estado_vehiculo: vehicleData.estado_vehiculo,
          descripcion: vehicleData.descripcion.trim(),
          cilindrada: parseInt(vehicleData.cilindrada),
          tipo_vehiculo_id: parseInt(vehicleData.tipo_vehiculo_id),
          tipo_combustible_id: parseInt(vehicleData.tipo_combustible_id),
          region_id: parseInt(vehicleData.region_id),
          ciudad_id: parseInt(vehicleData.ciudad_id),
          updated_at: new Date().toISOString(),
        })
        .eq("id", parseInt(vehicleId));

      if (vehicleError) throw vehicleError;

      for (const url of imagesToDelete) {
        await supabase
          .from("imagen_vehiculo")
          .delete()
          .eq("vehiculo_id", parseInt(vehicleId))
          .eq("url_imagen", url);

        const urlParts = url.split("/");
        const fileName = urlParts[urlParts.length - 1];
        if (fileName) {
          await supabase.storage.from("vehiculo_imagen").remove([fileName]);
        }
      }

      for (let i = 0; i < newImages.length; i++) {
        const file = newImages[i];
        const fileExtension = file.name.split(".").pop();
        const fileName = `${user.id}_${vehicleId}_${Date.now()}_${i}.${fileExtension}`;

        const { error: uploadError } = await supabase.storage
          .from("vehiculo_imagen")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("vehiculo_imagen")
          .getPublicUrl(fileName);

        await supabase.from("imagen_vehiculo").insert({
          vehiculo_id: parseInt(vehicleId),
          url_imagen: publicData.publicUrl,
        });
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/mypost");
      }, 2000);
    } catch (error: any) {
      console.error("Error:", error);
      setError("Error al actualizar el vehículo: " + error.message);
    } finally {
      setSaving(false);
    }
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
            ¡Actualización Exitosa!
          </h2>
          <p className="text-gray-600">
            Tu vehículo ha sido actualizado correctamente
          </p>
        </div>
      </div>
    );
  }

  const currentImages = existingImages.filter(
    (url) => !imagesToDelete.includes(url)
  );
  const maxImages = 6;
  const canUploadMore = currentImages.length + newImages.length < maxImages;
  const totalImagesCount = currentImages.length + newImages.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Editar Publicación
              </h1>
              <p className="text-sm text-gray-500">
                Actualiza la información de tu vehículo
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-6 space-y-8">
            {/* Imágenes */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Imágenes del Vehículo *{" "}
                <span className="text-gray-500 font-normal">
                  ({totalImagesCount}/{maxImages})
                </span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {/* Imágenes Existentes */}
                {existingImages.map((url) => (
                  <div
                    key={url}
                    className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                      imagesToDelete.includes(url)
                        ? "opacity-40 border-2 border-red-400"
                        : "border border-gray-200"
                    }`}
                  >
                    <img
                      src={url}
                      alt="Vehicle"
                      className="w-full h-full object-cover"
                    />
                    {imagesToDelete.includes(url) ? (
                      <button
                        onClick={() => undoRemoveImage(url)}
                        className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center text-xs font-medium hover:bg-red-600"
                      >
                        Deshacer
                      </button>
                    ) : (
                      <button
                        onClick={() => removeExistingImage(url)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Nuevas Imágenes */}
                {newImagePreviews.map((preview, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-green-400"
                  >
                    <img
                      src={preview}
                      alt="New Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeNewImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                      Nueva
                    </span>
                  </div>
                ))}

                {/* Botón de Carga */}
                {canUploadMore && (
                  <label className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all">
                    <Upload className="w-6 h-6 text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500 text-center px-2">
                      Añadir
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handleNewImageUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Información Básica
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Marca *
                  </label>
                  <input
                    type="text"
                    name="marca"
                    value={vehicleData.marca}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    name="modelo"
                    value={vehicleData.modelo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Año *
                  </label>
                  <input
                    type="number"
                    name="anio"
                    value={vehicleData.anio}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Kilometraje *
                  </label>
                  <input
                    type="number"
                    name="kilometraje"
                    value={vehicleData.kilometraje}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Precio (CLP) *
                  </label>
                  <input
                    type="number"
                    name="precio"
                    value={vehicleData.precio}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Transmisión *
                  </label>
                  <select
                    name="transmision"
                    value={vehicleData.transmision}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Selecciona</option>
                    {TRANSMISSIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Cilindrada (cc) *
                  </label>
                  <input
                    type="number"
                    name="cilindrada"
                    value={vehicleData.cilindrada}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Estado *
                  </label>
                  <select
                    name="estado_vehiculo"
                    value={vehicleData.estado_vehiculo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Selecciona</option>
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Tipo de Vehículo *
                  </label>
                  <select
                    name="tipo_vehiculo_id"
                    value={vehicleData.tipo_vehiculo_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Selecciona</option>
                    {tiposVehiculo.map((tipo) => (
                      <option key={tipo.id} value={tipo.id.toString()}>
                        {tipo.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Tipo de Combustible *
                  </label>
                  <select
                    name="tipo_combustible_id"
                    value={vehicleData.tipo_combustible_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Selecciona</option>
                    {tiposCombustible.map((comb) => (
                      <option key={comb.id} value={comb.id.toString()}>
                        {comb.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Región *
                  </label>
                  <select
                    name="region_id"
                    value={vehicleData.region_id}
                    onChange={(e) =>
                      setVehicleData({
                        ...vehicleData,
                        region_id: e.target.value,
                        ciudad_id: "",
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Selecciona</option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.id.toString()}>
                        {region.nombre_region}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Ciudad *
                  </label>
                  <select
                    name="ciudad_id"
                    value={vehicleData.ciudad_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    disabled={!vehicleData.region_id || cities.length === 0}
                  >
                    <option value="">Selecciona</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id.toString()}>
                        {city.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Descripción *
              </label>
              <textarea
                name="descripcion"
                value={vehicleData.descripcion}
                onChange={handleChange}
                rows={5}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Describe las características y el estado de tu vehículo..."
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={saving}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
