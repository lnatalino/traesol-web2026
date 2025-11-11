"use client";
import Image from "next/image";
import { useState, useEffect } from "react";

type Slide = {
  id: string;
  titulo: string | null;
  imagen_url: string | null;
  link_url: string | null;
};

export default function Carousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % (slides.length || 1)), 4000);
    return () => clearInterval(id);
  }, [slides.length]);

  if (!slides.length) return null;

  const s = slides[index];
  const imageSrc =
    s.imagen_url && s.imagen_url.trim() !== ""
      ? s.imagen_url
      : "https://placehold.co/1200x500?text=Carrusel+Traesol";

  const body = (
    <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden shadow-lg transition-all duration-500">
      <Image
        src={imageSrc}
        alt={s.titulo ?? "slide"}
        fill
        className="object-cover"
        unoptimized
        priority
      />
      {s.titulo && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white p-4 text-sm md:text-base">
          {s.titulo}
        </div>
      )}
    </div>
  );

  return s.link_url ? (
    <a href={s.link_url} target="_blank" rel="noreferrer">
      {body}
    </a>
  ) : (
    body
  );
}
