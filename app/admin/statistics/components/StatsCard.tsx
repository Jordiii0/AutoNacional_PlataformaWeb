import React from "react";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  value: number;
  label: string;
  gradient: string;
}

export default function StatsCard({ icon: Icon, value, label, gradient }: StatsCardProps) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl shadow-xl p-4 sm:p-6 text-white transform hover:scale-105 transition-transform`}>
      <Icon className="w-6 h-6 sm:w-8 sm:h-8 mb-2 opacity-90" />
      <p className="text-2xl sm:text-3xl font-bold">{value}</p>
      <p className="text-xs sm:text-sm opacity-90">{label}</p>
    </div>
  );
}
