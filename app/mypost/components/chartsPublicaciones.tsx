"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabaseClient";
import { Loader2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// --- Tipado de Interfaces ---
interface ChartsPublicacionesProps {
    usuarioId?: string;
    empresaId?: string;
    isBusiness: boolean;
}
interface PublicacionStat {
    month: string;
    count: number;
}
interface PublicacionRow {
    created_at: string;
}

// --- Función de Formato (Fuera del Componente) ---
function formatYM(dateString: string) {
    const date = new Date(dateString);
    const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    return `${meses[date.getMonth()]} '${date.getFullYear().toString().slice(2)}`;
}

// --- Componente Principal ---
export default function ChartsPublicaciones({ usuarioId, empresaId, isBusiness }: ChartsPublicacionesProps) {
    const [data, setData] = useState<PublicacionStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPublicacionesStats() {
            setLoading(true);
            setError(null);

            const isReady = isBusiness ? empresaId : usuarioId;
            if (!isReady) {
                setLoading(false);
                return;
            }

            // 1. Determinar el filtro de usuario/empresa
            let match = isBusiness && empresaId ? { empresa_id: empresaId } : { usuario_id: usuarioId };
            
            // 2. Consultar Supabase
            const { data: vehiculos, error: dbError } = await supabase
                .from("vehiculo")
                .select("created_at")
                .match(match)
                .order('created_at', { ascending: true }) as { data: PublicacionRow[] | null, error: any | null };

            if (dbError) {
                setError("Error al cargar datos: " + dbError.message);
                setLoading(false);
                return;
            }

            // 3. Agrupar por mes-año
            const countsMap: { [key: string]: number } = {};
            vehiculos?.forEach(v => {
                const key = formatYM(v.created_at);
                countsMap[key] = (countsMap[key] || 0) + 1;
            });

            // 4. Llenar los 6 últimos meses
            const arr: PublicacionStat[] = [];
            const now = new Date();
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = formatYM(d.toISOString());
                arr.push({ month: key, count: countsMap[key] || 0 });
            }

            setData(arr);
            setLoading(false);
        }

        if (isBusiness ? empresaId : usuarioId) {
            fetchPublicacionesStats();
        }
    }, [usuarioId, empresaId, isBusiness]);

    // --- Renderizado de Estados ---

    if (loading) {
        return (
            <div className="h-48 sm:h-56 md:h-64 flex flex-col sm:flex-row items-center justify-center p-4">
                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 animate-spin" />
                <p className="mt-2 sm:mt-0 sm:ml-3 text-xs sm:text-sm text-gray-500 text-center">
                    Cargando historial...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-48 sm:h-56 md:h-64 flex flex-col items-center justify-center p-3 sm:p-4 text-center text-red-600 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
                <p className="text-xs sm:text-sm font-medium px-2">{error}</p>
            </div>
        );
    }
    
    const totalPublicaciones = data.reduce((sum, item) => sum + item.count, 0);
    
    if (totalPublicaciones === 0) {
        return (
            <div className="h-48 sm:h-56 md:h-64 flex flex-col items-center justify-center p-3 sm:p-4 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm sm:text-base font-semibold">
                    No hay publicaciones registradas
                </p>
                <p className="text-xs sm:text-sm mt-1 px-2">
                    ¡Publica un vehículo para empezar a ver tu historial!
                </p>
            </div>
        );
    }

    // --- Renderizado del Gráfico ---

    return (
        <div className="h-48 sm:h-56 md:h-64 w-full p-3 sm:p-4 md:p-5 bg-white rounded-lg shadow-md border border-gray-200">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-2 sm:mb-3 md:mb-4">
                Publicaciones por Mes ({totalPublicaciones} total)
            </h3>
            <div className="flex items-center justify-center h-32 sm:h-36 md:h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                        data={data} 
                        margin={{ 
                            top: 5, 
                            right: 10, 
                            left: -10, 
                            bottom: 5 
                        }}
                    >
                        <XAxis 
                            dataKey="month" 
                            stroke="#6b7280" 
                            tickLine={false} 
                            axisLine={false}
                            style={{ fontSize: '10px' }}
                            angle={-45}
                            textAnchor="end"
                            height={40}
                        />
                        <YAxis 
                            allowDecimals={false} 
                            stroke="#6b7280" 
                            tickLine={false} 
                            axisLine={false}
                            style={{ fontSize: '10px' }}
                            width={30}
                        />
                        <Tooltip 
                            cursor={{ fill: '#d1d5db', opacity: 0.5 }} 
                            contentStyle={{ 
                                borderRadius: '8px', 
                                border: 'none', 
                                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                fontSize: '12px',
                                padding: '8px'
                            }}
                        />
                        <Bar 
                            dataKey="count" 
                            fill="#8b5cf6" 
                            name="Publicaciones" 
                            radius={[4, 4, 0, 0]}
                            maxBarSize={50}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
