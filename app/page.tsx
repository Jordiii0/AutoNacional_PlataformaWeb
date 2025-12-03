import { Suspense } from "react"; // 👈 Importar Suspense
import CategorySection from "@/components/homepage/CategorySection";
import NewsletterSignup from "@/components/homepage/NewsletterSignup";
import HeroCarousel from "@/components/HeroCarousel";
import ShopPage from "./shop/page";

export default function Home() {
  return (
    <div className="mx-auto">
      <HeroCarousel />
      <CategorySection />
      
      {/* 🛑 SOLUCIÓN: Envolver el componente Client que usa useSearchParams() en Suspense.
          Esto permite que el Server Component renderice un placeholder (fallback)
          mientras espera la hidratación en el cliente.
      */}
      <Suspense fallback={<div className="p-8 text-center text-gray-500">Cargando la tienda...</div>}>
        <ShopPage />
      </Suspense>
      
      <NewsletterSignup />
    </div>
  );
}