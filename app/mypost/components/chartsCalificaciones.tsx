"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabaseClient";
import { Loader2, AlertCircle } from 'lucide-react';

interface ChartsCalificacionesProps {
  usuarioId?: string;
  empresaId?: string;
  isBusiness: boolean;
}

type CalificacionStat = {
  name: string;
  value: number;
};

export default function ChartsCalificaciones({ usuarioId, empresaId, isBusiness }: ChartsCalificacionesProps) {
  const [data, setData] = useState<CalificacionStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [promedio, setPromedio] = useState(0);

  useEffect(() => {
    async function fetchCalificacionesStats() {
      setLoading(true);
      setError(null);

      try {
        let vendedorId = usuarioId;

        // ✅ Si es empresa, obtener el usuario_id de la empresa
        if (isBusiness && empresaId) {
          console.log("🏢 Buscando usuario_id de la empresa:", empresaId);
          
          const { data: empresaData, error: empresaError } = await supabase
            .from("empresa")
            .select("usuario_id")
            .eq("id", empresaId)
            .single();

          if (empresaError) {
            console.error("❌ Error al obtener empresa:", empresaError);
            throw empresaError;
          }

          vendedorId = empresaData?.usuario_id;
          console.log("✅ usuario_id de la empresa:", vendedorId);
        }
        
        console.log("🔍 Buscando calificaciones con vendedor_id:", vendedorId);
        
        if (!vendedorId) {
          console.warn("⚠️ No hay vendedorId disponible");
          setData([
            { name: "5 Estrellas", value: 0 },
            { name: "4 Estrellas", value: 0 },
            { name: "3 Estrellas", value: 0 },
            { name: "2 Estrellas", value: 0 },
            { name: "1 Estrella", value: 0 }
          ]);
          setTotal(0);
          setPromedio(0);
          setLoading(false);
          return;
        }

        // Obtener todas las calificaciones del vendedor
        const { data: calificaciones, error: cError } = await supabase
          .from("calificacion_usuario")
          .select("estrellas")
          .eq("vendedor_id", vendedorId);

        console.log("📊 Calificaciones encontradas:", calificaciones?.length || 0);

        if (cError) {
          console.error("❌ Error al obtener calificaciones:", cError);
          throw cError;
        }

        if (!calificaciones || calificaciones.length === 0) {
          setData([
            { name: "5 Estrellas", value: 0 },
            { name: "4 Estrellas", value: 0 },
            { name: "3 Estrellas", value: 0 },
            { name: "2 Estrellas", value: 0 },
            { name: "1 Estrella", value: 0 }
          ]);
          setTotal(0);
          setPromedio(0);
          setLoading(false);
          return;
        }

        // Agrupar por estrellas
        const starCounts = [0, 0, 0, 0, 0];
        let sumaEstrellas = 0;

        calificaciones.forEach(c => {
          if (c.estrellas >= 1 && c.estrellas <= 5) {
            starCounts[c.estrellas - 1]++;
            sumaEstrellas += c.estrellas;
          }
        });

        const totalVotes = calificaciones.length;
        const promedioCalc = totalVotes > 0 ? sumaEstrellas / totalVotes : 0;

        setTotal(totalVotes);
        setPromedio(promedioCalc);

        const statData: CalificacionStat[] = [
          { name: "5 Estrellas", value: starCounts[4] },
          { name: "4 Estrellas", value: starCounts[3] },
          { name: "3 Estrellas", value: starCounts[2] },
          { name: "2 Estrellas", value: starCounts[1] },
          { name: "1 Estrella", value: starCounts[0] }
        ];

        setData(statData);
      } catch (e: any) {
        console.error("❌ Error completo:", e);
        setError(e.message || "Error de conexión o RLS.");
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    if (isBusiness ? empresaId : usuarioId) {
      fetchCalificacionesStats();
    }
  }, [usuarioId, empresaId, isBusiness]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center bg-red-50 text-red-600 border rounded p-4">
        <AlertCircle className="w-8 h-8 mr-2 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center p-4 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
        <p className="font-semibold mb-2">Aún no has recibido calificaciones.</p>
        <p className="text-sm">Los usuarios podrán calificarte después de interactuar contigo.</p>
      </div>
    );
  }

  return (
    <div className="h-auto flex flex-col bg-white rounded-lg p-4 shadow">
      {/* Header con promedio */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-800">
          Distribución de Calificaciones
        </h4>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-500">
              {promedio.toFixed(1)} ⭐
            </div>
            <div className="text-xs text-gray-500">{total} calificaciones</div>
          </div>
        </div>
      </div>

      {/* Barras de distribución */}
      <div className="flex flex-col gap-2">
        {data.map((item, idx) => {
          const pct = total ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={item.name}>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-24 text-gray-700">{item.name}</span>
                <div className="flex-1 bg-gray-200 rounded h-3 overflow-hidden">
                  <div
                    className={
                      "h-3 rounded transition-all duration-300"
                      + (idx === 0
                        ? " bg-amber-500"
                        : idx === 1
                        ? " bg-yellow-400"
                        : idx === 2
                        ? " bg-blue-400"
                        : idx === 3
                        ? " bg-purple-400"
                        : " bg-gray-400")
                    }
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="ml-2 text-gray-700 font-semibold w-8 text-right">
                  {item.value}
                </span>
                <span className="ml-1 text-gray-500 text-xs w-10 text-right">
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
