import React from "react";
import { PieChart } from "lucide-react";

interface BrandChartProps {
  data: { brand: string; count: number }[];
}

export default function BrandChart({ data }: BrandChartProps) {
  const maxCount = data[0]?.count || 1;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-purple-200 shadow-xl p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <PieChart className="w-5 h-5 text-purple-600" />
        Top 5 Marcas
      </h2>
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-gray-500 text-center py-8 text-sm">
            No hay datos disponibles
          </p>
        ) : (
          data.map((item, index) => {
            const percentage = (item.count / maxCount) * 100;

            return (
              <div key={item.brand}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900">
                    {index + 1}. {item.brand}
                  </span>
                  <span className="text-sm text-gray-600">
                    {item.count} vehículos
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
