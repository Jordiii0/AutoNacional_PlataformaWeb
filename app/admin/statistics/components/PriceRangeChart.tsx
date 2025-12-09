import React from "react";
import { DollarSign } from "lucide-react";

interface PriceRangeChartProps {
  data: { range: string; count: number }[];
}

export default function PriceRangeChart({ data }: PriceRangeChartProps) {
  const maxCount = Math.max(...data.map((r) => r.count)) || 1;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-blue-200 shadow-xl p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-blue-600" />
        Distribución por Precio
      </h2>
      <div className="space-y-3">
        {data.map((item) => {
          const percentage = (item.count / maxCount) * 100;

          return (
            <div key={item.range}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">
                  {item.range}
                </span>
                <span className="text-sm text-gray-600">
                  {item.count} vehículos
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 h-2 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
