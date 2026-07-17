import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Star, Clock, Car, MessageCircle, Heart } from 'lucide-react';
import type { Tour } from '@workspace/api-client-react';
import { useTripPlanner } from '@/hooks/useTripPlanner';

interface TourCardProps {
  tour: Tour;
  index?: number;
  horizontal?: boolean;
}

export function TourCard({ tour, index = 0, horizontal = false }: TourCardProps) {
  const { toggleTour, isSaved } = useTripPlanner();
  const saved = isSaved(tour.id);

  const whatsappMsg = encodeURIComponent(
    `Hello, I would like to book the ${tour.title}. Could you please send me the available dates and price?`
  );
  const whatsappUrl = `https://wa.me/201001234567?text=${whatsappMsg}`;
  const discount = tour.discountPrice
    ? Math.round((1 - tour.discountPrice / tour.price) * 100)
    : 0;

  function handleToggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleTour(tour);
  }

  if (horizontal) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: index * 0.07 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
        className="group relative flex flex-col bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-border/50 w-72 shrink-0"
      >
        {/* Image */}
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={tour.coverImage}
            alt={tour.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {tour.isBestSeller && (
              <span className="bg-accent text-accent-foreground px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full shadow">
                Best Seller
              </span>
            )}
            {discount > 0 && (
              <span className="bg-red-500 text-white px-2.5 py-0.5 text-[11px] font-bold rounded-full shadow">
                -{discount}%
              </span>
            )}
          </div>
          {/* Heart save button */}
          <button
            onClick={handleToggleSave}
            aria-label={saved ? 'Remove from My Trip' : 'Save to My Trip'}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow transition-all hover:scale-110 z-10"
          >
            <Heart className={`w-4 h-4 transition-colors ${saved ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-base leading-snug line-clamp-2 mb-2 text-foreground">
            {tour.title}
          </h3>

          <div className="flex items-center gap-3 text-sm mb-1">
            <span className="flex items-center gap-1 font-medium">
              <Star className="w-3.5 h-3.5 fill-accent text-accent" />
              {tour.rating.toFixed(1)}
              <span className="text-muted-foreground font-normal">({tour.reviewCount})</span>
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />{tour.durationHours}h
            </span>
          </div>

          {tour.hasHotelPickup && (
            <div className="flex items-center gap-1 text-xs text-green-600 mb-2">
              <Car className="w-3 h-3" /> Hotel pickup included
            </div>
          )}

          <div className="mt-auto pt-3 border-t border-border">
            <div className="mb-3">
              <span className="text-xs text-muted-foreground">From</span>
              <div className="flex items-baseline gap-1.5">
                {tour.discountPrice ? (
                  <>
                    <span className="text-sm line-through text-muted-foreground">${tour.price}</span>
                    <span className="text-xl font-bold text-foreground">${tour.discountPrice}</span>
                  </>
                ) : (
                  <span className="text-xl font-bold">${tour.price}</span>
                )}
                <span className="text-xs text-muted-foreground">/ person</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/tours/${tour.id}`}
                className="flex-1 text-center bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-semibold py-2.5 rounded-xl transition-colors z-10 relative"
                onClick={(e) => e.stopPropagation()}
              >
                Book Now
              </Link>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-green-300 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium transition-colors z-10 relative"
                title="Book via WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Standard grid card
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.45, delay: index * 0.07 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex flex-col bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-border/50"
    >
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={tour.coverImage}
          alt={tour.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {tour.isBestSeller && (
            <span className="bg-accent text-accent-foreground px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full shadow">
              Best Seller
            </span>
          )}
          {tour.isFeatured && !tour.isBestSeller && (
            <span className="bg-primary text-primary-foreground px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full shadow">
              Featured
            </span>
          )}
          {discount > 0 && (
            <span className="bg-red-500 text-white px-2.5 py-0.5 text-[11px] font-bold rounded-full shadow">
              -{discount}%
            </span>
          )}
        </div>
        {/* Heart save button */}
        <button
          onClick={handleToggleSave}
          aria-label={saved ? 'Remove from My Trip' : 'Save to My Trip'}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow transition-all hover:scale-110 z-10"
        >
          <Heart className={`w-4 h-4 transition-colors ${saved ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-muted-foreground mb-1">{tour.categoryName}</p>
        <h3 className="font-semibold text-base leading-snug mb-2 text-foreground line-clamp-2">
          {tour.title}
        </h3>

        <div className="flex items-center gap-3 text-sm mb-1">
          <span className="flex items-center gap-1 font-medium">
            <Star className="w-3.5 h-3.5 fill-accent text-accent" />
            {tour.rating.toFixed(1)}
            <span className="text-muted-foreground font-normal">({tour.reviewCount})</span>
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />{tour.durationHours}h
          </span>
        </div>

        {tour.hasHotelPickup && (
          <div className="flex items-center gap-1 text-xs text-green-600 mb-1">
            <Car className="w-3 h-3" /> Hotel pickup included
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-border">
          <div className="mb-3">
            <span className="text-xs text-muted-foreground">From</span>
            <div className="flex items-baseline gap-1.5">
              {tour.discountPrice ? (
                <>
                  <span className="text-sm line-through text-muted-foreground">${tour.price}</span>
                  <span className="text-xl font-bold text-foreground">${tour.discountPrice}</span>
                </>
              ) : (
                <span className="text-xl font-bold">${tour.price}</span>
              )}
              <span className="text-xs text-muted-foreground">/ person</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/tours/${tour.id}`}
              className="flex-1 text-center bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              Book Now
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-green-300 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium transition-colors"
              title="Book via WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
