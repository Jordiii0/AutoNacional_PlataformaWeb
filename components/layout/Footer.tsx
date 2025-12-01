"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Github } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-gray-300">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-6">
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                AutoNacional
              </h3>
            </Link>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              La mejor plataforma para encontrar y comparar vehículos en todo el país.
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase mb-6 tracking-wider">
              Plataforma
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/shop" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  Explorar Vehículos
                </Link>
              </li>
              <li>
                <Link href="/publication" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  Publicar Vehículo
                </Link>
              </li>
              <li>
                <Link href="/mypost" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  Mis Publicaciones
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  Mis Favoritos
                </Link>
              </li>
              <li>
                <Link href="/my-reports" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  Mis Reportes
                </Link>
              </li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase mb-6 tracking-wider">
              Empresa
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  Nuestro Equipo
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  Carreras
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  Prensa
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase mb-6 tracking-wider">
              Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  Privacidad
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  Términos y Condiciones
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  Política de Cookies
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  Licencias
                </a>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase mb-6 tracking-wider">
              Contacto
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <a href="mailto:contacto@autonacional.com" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  autonacional@autonacional.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <a href="tel:+56912345678" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  +56 9 1234 5678
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-400 text-sm">
                  Talca, Región del Maule, Chile
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 mb-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Copyright */}
          <div className="text-sm text-gray-400">
            <p>© {currentYear} <span className="text-indigo-400 font-semibold">AutoNacional</span>. Todos los derechos reservados.</p>
            <p className="mt-2 text-xs text-gray-500">
              Desarrollado con ❤️ por <a href="#" className="text-indigo-400 hover:text-indigo-300">nuestro equipo</a>
            </p>
          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap gap-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">
              Mapa del Sitio
            </a>
            <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">
              Accesibilidad
            </a>
            <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">
              Reportar Problema
            </a>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-xl p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Mantente Informado</h3>
                <p className="text-gray-400 text-sm">
                  Recibe las últimas ofertas y novedades en el mercado automotriz
                </p>
              </div>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="tu@email.com"
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-500 text-sm"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors text-sm"
                >
                  Suscribir
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
