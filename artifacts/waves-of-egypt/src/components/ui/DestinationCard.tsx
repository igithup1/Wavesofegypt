import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import type { Destination } from '@workspace/api-client-react';

interface DestinationCardProps {
  destination: Destination;
  index?: number;
  featured?: boolean;
}

export function DestinationCard({ destination, index = 0, featured = false }: DestinationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
      className={`group relative overflow-hidden rounded-2xl ${featured ? 'aspect-[4/5] md:aspect-[3/4]' : 'aspect-square'}`}
    >
      <Link href={`/destinations/${destination.id}`} className="absolute inset-0 z-10">
        <span className="sr-only">Explore {destination.name}</span>
      </Link>

      <img 
        src={destination.imageUrl} 
        alt={destination.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col justify-end text-white z-20">
        <span className="text-accent text-sm font-bold uppercase tracking-wider mb-2 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          {destination.tourCount} Experiences
        </span>
        <h3 className="font-serif text-2xl md:text-3xl font-bold">
          {destination.name}
        </h3>
      </div>
    </motion.div>
  );
}
