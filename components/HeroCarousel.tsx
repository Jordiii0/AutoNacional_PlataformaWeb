"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  image: string;
  title: string;
  subtitle: string;
}

const HeroCarousel: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const slides: Slide[] = [
    {
      image: '/images/banner.jpg',
      title: 'Nuevos Vehículos',
      subtitle: 'Descubre un gran catálogo de vehículos'
    },
    {
      image: '/images/banner2.jpg',
      title: 'Ofertas Exclusivas',
      subtitle: 'Encuentra las mejores ofertas del mercado'
    },
    {
      image: '/images/banner3.jpg',
      title: 'Vende tu Auto',
      subtitle: 'Publica tu vehículo de forma rápida y sencilla'
    }
  ];

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length, isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
  };

  return (
    <section className="relative h-[500px] md:h-[600px] lg:h-[650px] overflow-hidden bg-gray-900">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            {/* Overlay más sutil */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
          </div>

          {/* Content */}
          <div className="relative container mx-auto px-6 lg:px-8 h-full flex items-center z-20">
            <div className="max-w-2xl text-white">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 animate-fade-in">
                {slide.title}
              </h2>
              <p className="text-lg md:text-xl text-white/90 mb-8 animate-fade-in-delay">
                {slide.subtitle}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4 animate-fade-in-delay-2">
                <a
                  href="/login"
                  className="inline-block px-8 py-3 bg-white text-gray-900 text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
                >
                  Inicia Sesión
                </a>
                <a
                  href="/shop"
                  className="inline-block px-8 py-3 bg-transparent text-white text-sm font-semibold rounded-lg border-2 border-white hover:bg-white hover:text-gray-900 transition-colors"
                >
                  Ver Catálogo
                </a>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 md:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 flex items-center justify-center"
        aria-label="Anterior"
      >
        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 md:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 flex items-center justify-center"
        aria-label="Siguiente"
      >
        <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all focus:outline-none ${
              index === currentSlide
                ? 'w-8 bg-white'
                : 'w-2 bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Ir a slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;
