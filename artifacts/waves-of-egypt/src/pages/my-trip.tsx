import React, { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  Heart, Trash2, Plus, Minus, MessageCircle, MapPin, Calendar,
  Users, Baby, Hotel, FileText, Star, Clock, Car, ChevronRight, Shield
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useTripPlanner } from '@/hooks/useTripPlanner';

const WHATSAPP_NUMBER = '201001234567';

function buildWhatsAppMessage(
  items: ReturnType<typeof useTripPlanner>['items'],
  hotel: string,
  requests: string
): string {
  const lines: string[] = [];
  lines.push("Hello! I'd like to plan my Hurghada trip. Here are my selected experiences:\n");

  items.forEach((item, i) => {
    lines.push(`${i + 1}. ${item.tour.title}`);
    if (item.date) lines.push(`   📅 Date: ${item.date}`);
    const pax = [item.adults > 0 ? `${item.adults} adult${item.adults !== 1 ? 's' : ''}` : '', item.children > 0 ? `${item.children} child${item.children !== 1 ? 'ren' : ''}` : ''].filter(Boolean).join(', ');
    lines.push(`   👥 ${pax}`);
    const price = item.tour.discountPrice ?? item.tour.price;
    lines.push(`   💰 From $${price} / person`);
    lines.push('');
  });

  if (hotel) lines.push(`🏨 Hotel: ${hotel}\n`);
  if (requests) lines.push(`📝 Special requests: ${requests}\n`);
  lines.push('Please confirm availability and total pricing. Thank you!');

  return lines.join('\n');
}

function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="w-5 text-center font-semibold text-sm">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function MyTrip() {
  const { items, hotel, requests, count, removeTour, updateItem, setHotel, setRequests, clear } = useTripPlanner();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const totalFrom = items.reduce((acc, item) => {
    const price = item.tour.discountPrice ?? item.tour.price;
    return acc + price * item.adults + price * 0.5 * item.children;
  }, 0);

  function handleWhatsApp() {
    const msg = buildWhatsAppMessage(items, hotel, requests);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  // Empty state
  if (count === 0) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-3">Your trip is empty</h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Browse our tours and tap the <Heart className="w-4 h-4 inline text-red-400" /> heart icon
              on any experience to add it here. Then send your whole trip to us in one WhatsApp message.
            </p>
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl px-8">
              <Link href="/tours">Browse Experiences</Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-6 flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              No account needed · Saves in your browser · Free to plan
            </p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Page Header */}
      <div className="bg-primary text-primary-foreground pt-28 pb-10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-7 h-7 fill-accent text-accent" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold">My Trip</h1>
          </div>
          <p className="text-primary-foreground/70 text-lg">
            {count} {count === 1 ? 'experience' : 'experiences'} selected · Send all to WhatsApp in one message
          </p>
        </div>
      </div>

      <div className="bg-muted/30 min-h-[60vh]">
        <div className="container mx-auto px-4 md:px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* Left — tour list */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-lg">Your Experiences</h2>
                {count > 1 && (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="text-sm text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Remove all
                  </button>
                )}
              </div>

              {showClearConfirm && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-4">
                  <p className="flex-1 text-sm font-medium">Remove all {count} experiences from your trip?</p>
                  <button onClick={() => { clear(); setShowClearConfirm(false); }} className="text-sm font-bold text-destructive hover:underline">Yes, remove</button>
                  <button onClick={() => setShowClearConfirm(false)} className="text-sm text-muted-foreground hover:underline">Cancel</button>
                </div>
              )}

              {items.map((item, i) => {
                const price = item.tour.discountPrice ?? item.tour.price;
                const discount = item.tour.discountPrice
                  ? Math.round((1 - item.tour.discountPrice / item.tour.price) * 100)
                  : 0;

                return (
                  <motion.div
                    key={item.tour.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card border border-border rounded-2xl overflow-hidden"
                  >
                    {/* Tour info row */}
                    <div className="flex gap-4 p-4">
                      {/* Thumbnail */}
                      <Link href={`/tours/${item.tour.id}`} className="shrink-0">
                        <div className="w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden bg-muted">
                          <img
                            src={item.tour.coverImage}
                            alt={item.tour.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">{item.tour.categoryName}</p>
                            <Link href={`/tours/${item.tour.id}`}>
                              <h3 className="font-semibold text-sm sm:text-base leading-snug hover:text-primary transition-colors line-clamp-2">
                                {item.tour.title}
                              </h3>
                            </Link>
                          </div>
                          <button
                            onClick={() => removeTour(item.tour.id)}
                            aria-label="Remove from trip"
                            className="shrink-0 w-8 h-8 rounded-full hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-muted-foreground transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-accent text-accent" />
                            {item.tour.rating.toFixed(1)} ({item.tour.reviewCount})
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />{item.tour.durationHours}h
                          </span>
                          {item.tour.hasHotelPickup && (
                            <span className="flex items-center gap-1 text-green-600">
                              <Car className="w-3 h-3" />Pickup included
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex items-baseline gap-1.5">
                          {discount > 0 && (
                            <span className="text-xs line-through text-muted-foreground">${item.tour.price}</span>
                          )}
                          <span className="font-bold text-base">${price}</span>
                          <span className="text-xs text-muted-foreground">/ person</span>
                          {discount > 0 && (
                            <span className="text-xs font-bold text-red-500">-{discount}%</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Preferences row */}
                    <div className="border-t border-border bg-muted/30 px-4 py-3 flex flex-wrap gap-4 items-center">
                      {/* Date */}
                      <label className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground text-xs font-medium">Date</span>
                        <input
                          type="date"
                          value={item.date}
                          onChange={(e) => updateItem(item.tour.id, { date: e.target.value })}
                          className="border border-border rounded-lg px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </label>

                      {/* Adults */}
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground text-xs font-medium">Adults</span>
                        <NumberStepper
                          value={item.adults}
                          onChange={(v) => updateItem(item.tour.id, { adults: v })}
                          min={1}
                        />
                      </div>

                      {/* Children */}
                      <div className="flex items-center gap-2 text-sm">
                        <Baby className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground text-xs font-medium">Children</span>
                        <NumberStepper
                          value={item.children}
                          onChange={(v) => updateItem(item.tour.id, { children: v })}
                          min={0}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Add more tours CTA */}
              <Link
                href="/tours"
                className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-2xl py-5 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors group"
              >
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Add more experiences
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Right — sticky summary + booking */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-2xl p-6 sticky top-24 space-y-5">
                <h2 className="font-bold text-lg">Trip Details</h2>

                {/* Hotel */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Hotel className="w-4 h-4 text-muted-foreground" />
                    Hotel / Resort name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jaz Makadi Hotel"
                    value={hotel}
                    onChange={(e) => setHotel(e.target.value)}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>

                {/* Special requests */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Special requests
                  </label>
                  <textarea
                    placeholder="Dietary needs, accessibility, special occasions…"
                    value={requests}
                    onChange={(e) => setRequests(e.target.value)}
                    rows={3}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  />
                </div>

                {/* Summary */}
                <div className="border-t border-border pt-4 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Trip summary</p>
                  {items.map((item) => {
                    const price = item.tour.discountPrice ?? item.tour.price;
                    return (
                      <div key={item.tour.id} className="flex items-start justify-between gap-2 text-sm">
                        <span className="text-muted-foreground line-clamp-1 flex-1">{item.tour.title}</span>
                        <span className="font-medium shrink-0">${price}/pp</span>
                      </div>
                    );
                  })}
                  <div className="border-t border-border pt-2 flex items-center justify-between text-sm font-bold">
                    <span>Estimated from</span>
                    <span className="text-lg">${Math.round(totalFrom)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    * Estimate only. Final pricing confirmed via WhatsApp.
                  </p>
                </div>

                {/* WhatsApp CTA */}
                <button
                  onClick={handleWhatsApp}
                  className="w-full flex items-center justify-center gap-2.5 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all text-base shadow-lg hover:shadow-xl active:scale-[0.98]"
                >
                  <MessageCircle className="w-5 h-5" />
                  Request My Trip via WhatsApp
                </button>

                <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1.5">
                  <Shield className="w-3 h-3" />
                  No payment required · Free cancellation · Reply in 5 min
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
