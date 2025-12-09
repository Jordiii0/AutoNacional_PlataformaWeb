import React from "react";
import { Star, Car } from "lucide-react";

interface TopCompaniesCardProps {
  data: { name: string; vehicleCount: number }[];
}

export default function TopCompaniesCard({ data }: TopCompaniesCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-green-200 shadow-xl p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Star className="w-5 h-5 text-yellow-500" />
        Top 5 Empresas
      </h2>
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-gray-500 text-center py-8 text-sm">
            No hay datos disponibles
          </p>
        ) : (
          data.map((company, index) => (
            <div
              key={company.name}
              className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {company.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {company.vehicleCount} vehículos publicados
                    </p>
                  </div>
                </div>
                <Car className="w-5 h-5 text-green-600" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
