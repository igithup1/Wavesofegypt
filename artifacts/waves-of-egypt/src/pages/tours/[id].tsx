import React, { useState } from 'react';
import { useRoute, Link } from 'wouter';
import { useGetTour, useListTours, useListReviews, useCreateReview, getGetTourQueryKey, useGetMe, useListBookings } from '@workspace/api-client-react';
import { useTripPlanner } from '@/hooks/useTripPlanner';
import Layout from '@/components/layout/Layout';
import { TourCard } from '@/components/ui/TourCard';
import {
  MapPin, Clock, Star, Users, Check, X, Calendar as CalendarIcon,
  Info, ChevronDown, ChevronUp, MessageCircle, Shield, Zap,
  Car, Award, Share2, Heart, ChevronLeft, ChevronRight, Play, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link as LinkPrimitive } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';

// Gallery images fallback array from Unsplash
const GALLERY_EXTRAS = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
  'https://images.unsplash.com/photo-1530053969600-caed2596d242?w=800',
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
  'https://images.unsplash.com/photo-1504884790557-80ead48b657c?w=800',
  'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800',
  'https://images.unsplash.com/photo-1539650116574-75c0c6d14e80?w=800',
];

function GallerySlider({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);
  return (
    <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-muted group">
      <img src={images[idx]} alt="" className="w-full h-full object-cover transition-opacity duration-500" />
      {images.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className={`w-2 h-2 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FAQAccordion({ faq }: { faq: Array<{ question: string; answer: string }> }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {faq.map((item, i) => (
        <div key={i} className="border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between p-4 text-left font-medium text-sm hover:bg-muted/40 transition-colors"
          >
            {item.question}
            {open === i ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
          </button>
          {open === i && (
            <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ReviewCard({ name, country, rating, comment, createdAt }: {
  name: string;
  country?: string | null;
  rating: number;
  comment?: string | null;
  createdAt: string;
}) {
  const COUNTRY_FLAGS: Record<string, string> = {
    'United Kingdom': '🇬🇧', 'Germany': '🇩🇪', 'Russia': '🇷🇺',
    'Saudi Arabia': '🇸🇦', 'France': '🇫🇷', 'Australia': '🇦🇺',
    'United States': '🇺🇸', 'Egypt': '🇪🇬', 'Netherlands': '🇳🇱',
    'Poland': '🇵🇱', 'Italy': '🇮🇹', 'Spain': '🇪🇸', 'Ukraine': '🇺🇦',
  };
  const date = new Date(createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-sm">{name}</p>
          {country && (
            <p className="text-xs text-muted-foreground mt-0.5">{COUNTRY_FLAGS[country] ?? '🌍'} {country}</p>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>
      <div className="flex items-center gap-0.5 mb-2">
        {[1, 2, 3, 4, 5].map(s => (
          <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
        ))}
      </div>
      {comment && <p className="text-sm text-muted-foreground leading-relaxed">{comment}</p>}
    </div>
  );
}

function LeaveReviewForm({ tourId, onSuccess }: { tourId: number; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { mutate, isPending, isError } = useCreateReview({
    mutation: {
      onSuccess: () => {
        setSubmitted(true);
        onSuccess();
      },
    },
  });

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
        <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <p className="font-semibold text-green-700">Thank you for your review!</p>
        <p className="text-sm text-green-600 mt-1">Your feedback helps other travelers.</p>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 border border-border rounded-xl p-6">
      <h3 className="font-bold text-base mb-4">Leave a Review</h3>
      <div className="space-y-4">
        {/* Star picker */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Your Rating</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s}
                type="button"
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(s)}
                className="p-0.5"
              >
                <Star className={`w-7 h-7 transition-colors ${s <= (hoverRating || rating) ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Your Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Sarah M."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Country</label>
            <input
              type="text"
              value={country}
              onChange={e => setCountry(e.target.value)}
              placeholder="e.g. United Kingdom"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Your Review</label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Tell future travelers about your experience…"
            rows={3}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        {isError && (
          <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
        )}

        <Button
          onClick={() => {
            if (!name.trim()) return;
            mutate({ data: { tourId, name: name.trim(), country: country.trim() || undefined, rating, comment: comment.trim() || undefined } });
          }}
          disabled={isPending || !name.trim()}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {isPending ? 'Submitting…' : 'Submit Review'}
        </Button>
      </div>
    </div>
  );
}

export default function TourDetail() {
  const [, params] = useRoute('/tours/:id');
  const id = params?.id ? parseInt(params.id) : 0;
  const { toggleTour, isSaved } = useTripPlanner();
  const queryClient = useQueryClient();

  const { data: tour, isLoading } = useGetTour(id, { query: { enabled: !!id } } as any);
  const { data: reviewsData, refetch: refetchReviews } = useListReviews(
    { tourId: id, limit: 50 },
    { query: { enabled: !!id } } as any,
  );
  const { data: related } = useListTours({
    categoryId: tour?.categoryId,
    limit: 4,
  } as any, { query: { enabled: !!tour?.categoryId } } as any);

  // Check if logged-in traveler already has bookings for this tour
  const { data: currentUser } = useGetMe({ query: { retry: false } } as any);
  const { data: myBookings } = useListBookings(
    { limit: 100 },
    { query: { enabled: !!currentUser && !!id } } as any,
  );
  const existingBookingsForTour = (myBookings ?? []).filter(
    (b) => b.tourId === id && b.status !== 'cancelled',
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="h-[60vh] bg-muted animate-pulse" />
        <div className="container mx-auto px-4 py-16">
          <div className="h-8 bg-muted animate-pulse rounded w-1/2 mb-4" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-2xl" />)}
            </div>
            <div className="h-80 bg-muted animate-pulse rounded-2xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!tour) {
    return (
      <Layout>
        <div className="py-32 text-center">
          <h1 className="text-3xl font-serif font-bold mb-4">Tour not found</h1>
          <Link href="/tours" className="text-primary underline">Back to all tours</Link>
        </div>
      </Layout>
    );
  }

  const discount = tour.discountPrice ? Math.round((1 - tour.discountPrice / tour.price) * 100) : 0;
  const whatsappMsg = encodeURIComponent(`Hi! I'm interested in booking "${tour.title}". Can you help me?`);
  const whatsappNum = (tour as any).whatsappNumber?.replace(/[^0-9]/g, '') || '201001234567';
  const whatsappUrl = `https://wa.me/${whatsappNum}?text=${whatsappMsg}`;

  // Build gallery: cover image only (or cover + additional images if provided)
  const galleryImages = tour.images?.length ? [tour.coverImage, ...tour.images] : [tour.coverImage];
  const faqData: Array<{ question: string; answer: string }> = (tour as any).faq || [];
  const videoUrl: string | null = (tour as any).videoUrl || null;

  const badges = [];
  if (tour.freeCancellation) badges.push({ icon: <Shield className="w-3.5 h-3.5" />, label: 'Free Cancellation', color: 'text-green-600 bg-green-50 border-green-200' });
  if (tour.instantConfirmation) badges.push({ icon: <Zap className="w-3.5 h-3.5" />, label: 'Instant Confirmation', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' });
  if (tour.hasHotelPickup) badges.push({ icon: <Car className="w-3.5 h-3.5" />, label: 'Hotel Pickup', color: 'text-blue-600 bg-blue-50 border-blue-200' });
  if (tour.isPrivate) badges.push({ icon: <Award className="w-3.5 h-3.5" />, label: 'Private Tour', color: 'text-purple-600 bg-purple-50 border-purple-200' });
  if (tour.isFamilyFriendly) badges.push({ icon: <Users className="w-3.5 h-3.5" />, label: 'Family Friendly', color: 'text-cyan-600 bg-cyan-50 border-cyan-200' });

  return (
    <Layout>
      {/* ── Sticky mobile booking bar (bottom) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/97 backdrop-blur-md border-t border-border shadow-2xl">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">From</p>
            <div className="flex items-baseline gap-1.5">
              {tour.discountPrice ? (
                <>
                  <span className="text-xs line-through text-muted-foreground">${tour.price}</span>
                  <span className="text-lg font-bold">${tour.discountPrice}</span>
                </>
              ) : (
                <span className="text-lg font-bold">${tour.price}</span>
              )}
              <span className="text-xs text-muted-foreground">/ person</span>
            </div>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-11 h-11 rounded-xl border border-green-300 bg-green-50 hover:bg-green-100 text-green-700 shrink-0"
            title="Book via WhatsApp"
          >
            <MessageCircle className="w-5 h-5" />
          </a>
          <Link
            href={`/checkout/${tour.id}`}
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-sm px-5 py-3 rounded-xl transition-colors shrink-0"
          >
            Book Now
          </Link>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="pt-24 pb-0 bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4 md:px-6 py-3 text-sm text-muted-foreground flex items-center gap-2">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/tours" className="hover:text-foreground">Tours</Link>
          {tour.categoryName && <><span>/</span><Link href={`/tours?categoryId=${tour.categoryId}`} className="hover:text-foreground">{tour.categoryName}</Link></>}
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[200px]">{tour.title}</span>
        </div>
      </div>

      {/* Sticky nav */}
      <div className="bg-card border-b border-border sticky top-[72px] z-40 shadow-sm hidden md:block">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between py-3">
            <div className="flex gap-6 text-sm font-medium text-muted-foreground">
              {['Overview', 'Highlights', 'Itinerary', 'FAQ', 'Reviews'].map(s => (
                <a key={s} href={`#${s.toLowerCase()}`} className="hover:text-primary transition-colors">{s}</a>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">From</div>
                <div className="text-xl font-bold">${tour.discountPrice ?? tour.price}</div>
              </div>
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl px-6">
                <Link href={`/checkout/${tour.id}`}>Book Now</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-10 pb-28 lg:pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-12">

            {/* Title & badges */}
            <div id="overview">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {tour.categoryName && (
                  <Badge className="bg-primary/10 text-primary border-primary/20">{tour.categoryName}</Badge>
                )}
                {tour.badge && (
                  <Badge className="bg-accent text-accent-foreground">{tour.badge}</Badge>
                )}
                {tour.isPrivate && <Badge variant="outline" className="text-purple-600 border-purple-300">Private</Badge>}
              </div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground flex-1">{tour.title}</h1>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => toggleTour(tour)}
                    aria-label={isSaved(tour.id) ? 'Remove from My Trip' : 'Save to My Trip'}
                    className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Heart className={`w-5 h-5 transition-colors ${isSaved(tour.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                  </button>
                  <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
                    <Share2 className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-primary" />
                  {tour.destinationName || 'Hurghada'}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-accent text-accent" />
                  <span className="font-semibold text-foreground">{tour.rating.toFixed(1)}</span>
                  <span>({tour.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {tour.durationHours}h
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Max {tour.maxParticipants || 20}
                </div>
              </div>

              {/* Feature badges */}
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {badges.map((b, i) => (
                    <span key={i} className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${b.color}`}>
                      {b.icon} {b.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Gallery */}
            <GallerySlider images={galleryImages} />

            {/* Thumbnail strip */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mt-6">
              {galleryImages.slice(0, 6).map((img, i) => (
                <div key={i} className="w-24 h-16 rounded-lg overflow-hidden shrink-0 border border-border">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <h2 className="text-2xl font-serif font-bold text-foreground mb-3">About this experience</h2>
              <p className="text-muted-foreground leading-relaxed">{tour.description}</p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: <Clock className="w-5 h-5 text-primary" />, label: 'Duration', value: `${tour.durationHours}h` },
                { icon: <Users className="w-5 h-5 text-primary" />, label: 'Max Group', value: `${tour.maxParticipants || 20} people` },
                { icon: <CalendarIcon className="w-5 h-5 text-primary" />, label: 'Availability', value: 'Daily' },
                { icon: <Info className="w-5 h-5 text-primary" />, label: 'Difficulty', value: tour.difficulty ? tour.difficulty.charAt(0).toUpperCase() + tour.difficulty.slice(1) : 'Easy' },
              ].map((s, i) => (
                <div key={i} className="bg-muted/40 rounded-xl p-4 flex flex-col gap-2">
                  {s.icon}
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <span className="font-semibold text-sm">{s.value}</span>
                </div>
              ))}
            </div>

            {/* Meeting Point */}
            {(tour as any).meetingPoint && (
              <div className="flex gap-4 items-start bg-blue-50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900 rounded-2xl p-5">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase tracking-wide mb-1">Meeting Point</h3>
                  <p className="text-sm text-foreground leading-relaxed">{(tour as any).meetingPoint}</p>
                </div>
              </div>
            )}

            {/* Highlights */}
            {tour.highlights && tour.highlights.length > 0 && (
              <section id="highlights">
                <h2 className="text-2xl font-serif font-bold mb-5">Experience Highlights</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tour.highlights.map((h, i) => (
                    <div key={i} className="flex gap-3 items-start bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900 rounded-xl p-3">
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{h}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Included / Excluded */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 dark:bg-green-950/20 rounded-2xl p-6 border border-green-200/50">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Check className="w-5 h-5" /> What's Included
                </h3>
                <ul className="space-y-2.5">
                  {(tour.included || []).map((item, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl p-6 border border-red-200/50">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-red-600 dark:text-red-400">
                  <X className="w-5 h-5" /> Not Included
                </h3>
                <ul className="space-y-2.5">
                  {(tour.excluded || []).map((item, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
                      <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Itinerary */}
            {tour.itinerary && tour.itinerary.length > 0 && (
              <section id="itinerary">
                <h2 className="text-2xl font-serif font-bold mb-8">Itinerary</h2>
                <div className="space-y-6">
                  {[...tour.itinerary].sort((a, b) => a.order - b.order).map((step, i) => (
                    <div key={i} className="flex gap-5">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0 shadow-md text-sm">
                          {step.order}
                        </div>
                        {i < tour.itinerary!.length - 1 && <div className="w-0.5 h-full bg-border mt-2 mb-0" />}
                      </div>
                      <div className="flex-1 bg-card border border-border rounded-xl p-5 -mt-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold">{step.title}</h3>
                          {step.durationMinutes && (
                            <span className="text-xs text-accent font-medium bg-accent/10 px-2 py-1 rounded-full">
                              {step.durationMinutes}min
                            </span>
                          )}
                        </div>
                        {step.description && <p className="text-sm text-muted-foreground">{step.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* FAQ */}
            {faqData.length > 0 && (
              <section id="faq">
                <h2 className="text-2xl font-serif font-bold mb-6">Frequently Asked Questions</h2>
                <FAQAccordion faq={faqData} />
              </section>
            )}

            {/* Reviews */}
            <section id="reviews">
              <h2 className="text-2xl font-serif font-bold mb-2">Reviews</h2>

              {/* Aggregate score */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-5 h-5 fill-accent text-accent" />)}
                </div>
                <span className="text-2xl font-bold">{tour.rating.toFixed(1)}</span>
                <span className="text-muted-foreground text-sm">· {tour.reviewCount} {tour.reviewCount === 1 ? 'review' : 'reviews'}</span>
              </div>

              {/* Review list */}
              {reviewsData && reviewsData.length > 0 ? (
                <div className="space-y-4 mb-8">
                  {reviewsData.map(rev => (
                    <ReviewCard
                      key={rev.id}
                      name={rev.name ?? ''}
                      country={rev.country ?? undefined}
                      rating={rev.rating}
                      comment={rev.comment}
                      createdAt={typeof rev.createdAt === 'string' ? rev.createdAt : new Date(rev.createdAt).toISOString()}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm mb-8">No reviews yet — be the first to share your experience!</p>
              )}

              {/* Leave a review form */}
              <LeaveReviewForm tourId={tour.id} onSuccess={() => {
                refetchReviews();
                queryClient.invalidateQueries({ queryKey: getGetTourQueryKey(tour.id) });
              }} />
            </section>

          </div>

          {/* RIGHT COLUMN — Booking sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-[140px] space-y-4">

              {/* Price card */}
              <div className="bg-card rounded-2xl shadow-xl border border-border p-6">
                <div className="flex items-end gap-3 mb-1">
                  {tour.discountPrice ? (
                    <>
                      <span className="text-lg text-muted-foreground line-through">${tour.price}</span>
                      <span className="text-4xl font-bold text-foreground">${tour.discountPrice}</span>
                    </>
                  ) : (
                    <span className="text-4xl font-bold">${tour.price}</span>
                  )}
                  <span className="text-muted-foreground mb-1 text-sm">/ person</span>
                </div>
                {discount > 0 && (
                  <Badge className="bg-red-100 text-red-700 border-0 mb-3">Save {discount}%</Badge>
                )}

                {/* Trust badges */}
                <div className="border-t border-border pt-4 mt-4 space-y-2.5 mb-5">
                  {badges.slice(0, 3).map((b, i) => (
                    <div key={i} className={`flex items-center gap-2 text-sm ${b.color} px-3 py-2 rounded-lg border`}>
                      {b.icon} {b.label}
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 fill-accent text-accent" />
                    <span className="font-medium">{tour.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({tour.reviewCount} reviews)</span>
                  </div>
                </div>

                {existingBookingsForTour.length > 0 && (
                  <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">You've already booked this tour</p>
                        <ul className="mt-1 space-y-0.5">
                          {existingBookingsForTour.map((b) => (
                            <li key={b.id} className="text-xs text-amber-700">
                              {new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {' '}· {b.participants} {b.participants === 1 ? 'person' : 'people'} · <span className="capitalize">{b.status}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-amber-600 mt-1.5">You can still book a different date.</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button asChild className="w-full h-12 text-base bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl mb-3">
                  <Link href={`/checkout/${tour.id}`}>Select Date & Book</Link>
                </Button>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 text-sm font-medium transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Book via WhatsApp
                </a>

                <p className="text-center text-xs text-muted-foreground mt-3">No payment required until checkout</p>
              </div>

              {/* Map placeholder */}
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="h-40 bg-muted flex items-center justify-center relative">
                  <img
                    src="https://images.unsplash.com/photo-1539650116574-75c0c6d14e80?w=600"
                    alt="Hurghada"
                    className="w-full h-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white rounded-xl px-4 py-2 shadow-lg flex items-center gap-2 text-sm font-medium">
                      <MapPin className="w-4 h-4 text-red-500" /> Hurghada, Egypt
                    </div>
                  </div>
                </div>
              </div>

              {/* Need help */}
              <div className="bg-muted/50 rounded-2xl border border-border p-5 text-center">
                <p className="font-semibold mb-1 text-sm">Need help choosing?</p>
                <p className="text-xs text-muted-foreground mb-3">Our local experts are available 24/7 on WhatsApp</p>
                <a
                  href={`https://wa.me/201001234567`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800"
                >
                  <MessageCircle className="w-4 h-4" /> Chat with us
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Related tours */}
        {related?.tours && related.tours.filter(t => t.id !== tour.id).length > 0 && (
          <section className="mt-20 pt-16 border-t border-border">
            <h2 className="text-2xl font-serif font-bold mb-8">You Might Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.tours.filter(t => t.id !== tour.id).slice(0, 4).map((t, i) => (
                <TourCard key={t.id} tour={t} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
