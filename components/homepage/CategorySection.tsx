"use client";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Handshake, Scale, ArrowRight, BadgeCheck, TrendingUp } from "lucide-react";

export default function CategorySection() {
  const categories = [
    {
      title: "Nuevos",
      subtitle: "Vehículos 0km",
      description: "Las últimas novedades del mercado",
      image: "/images/main/CategorySection/new.jpg",
      href: "/shop?conditions=Nuevo",
      buttonText: "Ver catálogo",
      icon: Sparkles,
      color: "from-blue-500 to-indigo-600",
      badge: "0 KM",
      stats: "Garantía completa"
    },
    {
      title: "Usados",
      subtitle: "Segunda mano",
      description: "Calidad verificada al mejor precio",
      image: "/images/main/CategorySection/trato.jpg",
      href: "/shop?conditions=Usado&conditions=Semi-nuevo",
      buttonText: "Ver catálogo",
      icon: Handshake,
      color: "from-emerald-500 to-teal-600",
      badge: "Certificados",
      stats: "Revisión completa"
    },
    {
      title: "Comparativa",
      subtitle: "Compara modelos",
      description: "Encuentra las mejores opciones",
      image: "/images/main/CategorySection/comparativa.jpg",
      href: "/comparativa",
      buttonText: "Comparar",
      icon: Scale,
      color: "from-purple-500 to-pink-600",
      badge: "Análisis",
      stats: "Lado a lado"
    },
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium mb-4">
            <TrendingUp className="w-4 h-4" />
            <span>Explora por Categoría</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            Encuentra tu vehículo ideal
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            Busca, compara y elige la mejor opción para ti
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {categories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <Link key={index} href={category.href}>
                <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-gray-100 hover:border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer h-full">
                  {/* Image Container */}
                  <div className="relative h-56 sm:h-64 lg:h-72 overflow-hidden">
                    <Image
                      src={category.image}
                      alt={category.title}
                      width={600}
                      height={400}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      priority={index === 0}
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    
                    {/* Badge */}
                    <div className="absolute top-4 right-4">
                      <div className={`px-3 py-1.5 bg-gradient-to-r ${category.color} text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm flex items-center gap-1.5`}>
                        <BadgeCheck className="w-3.5 h-3.5" />
                        {category.badge}
                      </div>
                    </div>

                    {/* Icon */}
                    <div className="absolute top-4 left-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 sm:p-6 lg:p-7">
                    {/* Title */}
                    <div className="mb-3 sm:mb-4">
                      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-gray-700 transition-colors">
                        {category.title}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-500 font-medium">
                        {category.subtitle}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 sm:mb-5 line-clamp-2">
                      {category.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-2 mb-4 sm:mb-5 pb-4 sm:pb-5 border-b border-gray-100">
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="font-medium">{category.stats}</span>
                      </div>
                    </div>

                    {/* Button */}
                    <button className="w-full flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 bg-gray-900 hover:bg-gray-800 text-white text-sm sm:text-base font-semibold rounded-xl sm:rounded-2xl transition-all duration-300 group-hover:shadow-xl group-hover:scale-[1.02] active:scale-95">
                      <span>{category.buttonText}</span>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  {/* Hover Effect Border */}
                  <div className={`absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r ${category.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl`} />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 sm:mt-12 lg:mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl sm:rounded-3xl shadow-xl">
            <div className="text-center sm:text-left">
              <p className="text-white font-semibold text-base sm:text-lg mb-1">
                ¿No encuentras lo que buscas?
              </p>
              <p className="text-gray-300 text-xs sm:text-sm">
                Explora nuestro catálogo completo con más de 500 vehículos
              </p>
            </div>
            <Link href="/shop">
              <button className="px-6 sm:px-8 py-2.5 sm:py-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-xl transition-all hover:shadow-lg hover:scale-105 active:scale-95 whitespace-nowrap text-sm sm:text-base">
                Ver todos
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
