"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  color,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 flex items-center justify-between transition-shadow duration-300 hover:shadow-xl">
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">
          {title}
        </p>
        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1">
          {value}
        </p>
      </div>

      <div className={`p-2 sm:p-3 rounded-full ${color} text-white ml-3 sm:ml-4 flex-shrink-0`}>
        {Icon && <Icon className="w-5 h-5 sm:w-6 sm:h-6" />}
      </div>
    </div>
  );
}
