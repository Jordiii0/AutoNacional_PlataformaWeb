"use client";

import Image from "next/image";
import Link from "next/link";
import { Zap, Shield, Users, Target, Leaf, Heart } from "lucide-react";

export default function AboutUs() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block mb-4">
            <span className="px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
              Sobre AutoNacional
            </span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
            La Mejor Asesoría en <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Automóviles</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Somos una plataforma innovadora dedicada a centralizar y comparar la oferta automotriz de distintos concesionarios y vendedores del país. Te brindamos información clara, actualizada y confiable para que tomes la mejor decisión de compra.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/shop"
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors inline-block text-center"
            >
              Explora Vehículos
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors inline-block text-center"
            >
              Contacta con Nosotros
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">500+</div>
              <p className="text-gray-600">Vehículos Disponibles</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">50+</div>
              <p className="text-gray-600">Concesionarios Asociados</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-600 mb-2">10K+</div>
              <p className="text-gray-600">Usuarios Satisfechos</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
              <p className="text-gray-600">Soporte Disponible</p>
            </div>
          </div>
        </div>
      </section>

      {/* Historia Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">Nuestra Historia</h2>
              <p className="text-indigo-100 text-lg mb-4 leading-relaxed">
                AutoNacional nació con el propósito de simplificar la búsqueda y compra de automóviles. Detectamos la necesidad de una plataforma que reuniera en un solo lugar la oferta de distintos concesionarios y vendedores, permitiendo comparar precios, modelos y condiciones de forma clara y segura.
              </p>
              <p className="text-indigo-100 text-lg leading-relaxed">
                Desde entonces, trabajamos para ofrecer una experiencia confiable, transparente y moderna, ayudando a cada persona a encontrar el vehículo ideal según sus necesidades. Cada día, miles de usuarios confían en nosotros para tomar la decisión más importante en sus vidas.
              </p>
            </div>
            <div className="relative h-96 rounded-xl overflow-hidden shadow-2xl">
              <Image
                src="/images/about/team.jpg"
                alt="Nuestra Historia"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Misión y Visión */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">Nuestra Misión y Visión</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Misión */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-8 rounded-xl border border-indigo-200">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-8 h-8 text-indigo-600" />
                <h3 className="text-2xl font-bold text-gray-900">Misión</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Facilitar la elección del vehículo perfecto para cada persona, ofreciendo una plataforma digital confiable que centraliza, compara y asesora en la compra de automóviles nuevos y usados en todo el país. Buscamos simplificar el proceso de búsqueda y decisión, brindando información transparente, actualizada y objetiva.
              </p>
            </div>

            {/* Visión */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-xl border border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-8 h-8 text-purple-600" />
                <h3 className="text-2xl font-bold text-gray-900">Visión</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Ser la plataforma número uno de confianza en el mercado automotriz latinoamericano. Queremos transformar la experiencia de compra de vehículos a través de tecnología innovadora, transparencia absoluta y un servicio al cliente excepcional que empodere a cada usuario en su decisión.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Nuestro Equipo</h2>
          <p className="text-center text-gray-600 text-lg mb-16 max-w-2xl mx-auto">
            Un equipo apasionado de profesionales dedicados a revolucionar la industria automotriz
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: "Javier Veloso", role: "Ing. Informático", image: "/images/team/javier.jpg" },
              { name: "Tomás Mariscal", role: "Ing. Informático", image: "/images/team/tomas.jpg" },
              { name: "Matías Pardo", role: "Ing. Informático", image: "/images/team/matias.jpg" },
              { name: "Felipe Catalán", role: "Ing. Informático", image: "/images/team/felipe.jpg" },
            ].map((member, index) => (
              <div key={index} className="group">
                <div className="relative mb-4 overflow-hidden rounded-xl h-64">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                <p className="text-indigo-600 font-semibold">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">Nuestros Valores</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Calidad */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-8 border border-blue-200 hover:shadow-xl transition-all duration-300">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-200 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <Shield className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Calidad</h3>
              <p className="text-gray-700 leading-relaxed">
                Nos comprometemos a ofrecer información precisa, actualizada y confiable, garantizando una experiencia de comparación y compra de vehículos con los más altos estándares de excelencia.
              </p>
            </div>

            {/* Sustentabilidad */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-8 border border-green-200 hover:shadow-xl transition-all duration-300">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-green-200 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <Leaf className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Sustentabilidad</h3>
              <p className="text-gray-700 leading-relaxed">
                Promovemos prácticas responsables y sostenibles dentro del sector automotriz, fomentando la elección de vehículos eficientes y tecnologías que contribuyan al cuidado del medio ambiente.
              </p>
            </div>

            {/* Enfoque al Cliente */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 p-8 border border-pink-200 hover:shadow-xl transition-all duration-300">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-pink-200 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <Heart className="w-12 h-12 text-pink-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Enfoque al Cliente</h3>
              <p className="text-gray-700 leading-relaxed">
                Nuestros usuarios son el centro de todo lo que hacemos. Escuchamos sus necesidades y trabajamos constantemente para brindar un servicio cercano, transparente y orientado a su satisfacción.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">¿Listo para encontrar tu vehículo ideal?</h2>
          <p className="text-indigo-100 text-lg mb-8">
            Únete a miles de usuarios que ya confían en AutoNacional
          </p>
          <Link
            href="/shop"
            className="inline-block px-8 py-4 bg-white text-indigo-600 rounded-lg font-bold text-lg hover:bg-indigo-50 transition-colors shadow-lg"
          >
            Empezar a Buscar
          </Link>
        </div>
      </section>
    </div>
  );
}
