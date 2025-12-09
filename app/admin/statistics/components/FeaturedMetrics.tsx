import React from "react";
import { Activity, DollarSign, Star, Building2 } from "lucide-react";

interface FeaturedMetricsProps {
  averagePrice: number;
  mostPopularBrand: string;
  mostActiveCompany: string;
}

export default function FeaturedMetrics({
  averagePrice,
  mostPopularBrand,
  mostActiveCompany,
}: FeaturedMetricsProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-orange-200 shadow-xl p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-orange-600" />
        Métricas Destacadas
      </h2>
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-6 h-6 text-orange-600" />
            <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
              Promedio
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatPrice(averagePrice)}
          </p>
          <p className="text-sm text-gray-600">Precio promedio de vehículos</p>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-6 h-6 text-purple-600" />
            <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
              #1
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900 truncate">
            {mostPopularBrand}
          </p>
          <p className="text-sm text-gray-600">Marca más popular</p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              Top
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900 truncate">
            {mostActiveCompany}
          </p>
          <p className="text-sm text-gray-600">Empresa más activa</p>
        </div>
      </div>
    </div>
  );
}
