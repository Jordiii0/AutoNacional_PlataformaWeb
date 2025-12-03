"use client";
import Image from "next/image";
import Link from "next/link";

export default function CategorySection() {
  const categories = [
    {
      title: "Nuevos",
      subtitle: "Vehículos 0km",
      image: "/images/main/CategorySection/new.jpg",
      href: "/shop?conditions=Nuevo",
      buttonText: "Ver catálogo",
    },
    {
      title: "Usados",
      subtitle: "Segunda mano",
      image: "/images/main/CategorySection/trato.jpg",
      href: {
        pathname: "/shop",
        query: { conditions: ["Usado", "Semi-nuevo"] },
      },
      buttonText: "Ver catálogo",
    },
    {
      title: "Comparativa",
      subtitle: "Compara modelos",
      image: "/images/main/CategorySection/comparativa.jpg",
      href: "/comparativa",
      buttonText: "Comparar",
    },
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Encuentra tu vehículo ideal
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Busca, compara y elige la mejor opción para ti
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <Link key={index} href={category.href}>
              <div className="group relative overflow-hidden rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer">
                {/* Image */}
                <div className="relative h-80 overflow-hidden">
                  <Image
                    src={category.image}
                    alt={category.title}
                    width={500}
                    height={500}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                </div>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                  <div className="space-y-2 mb-6">
                    <h3 className="text-3xl font-bold text-white">
                      {category.title}
                    </h3>
                    <p className="text-white/90 text-sm">
                      {category.subtitle}
                    </p>
                  </div>

                  {/* Button */}
                  <button className="px-6 py-2.5 bg-white text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
                    {category.buttonText}
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
