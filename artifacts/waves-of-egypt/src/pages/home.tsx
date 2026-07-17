import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
  Search, MessageCircle, Star, Shield, Car, Users, Tag,
  ChevronRight, ChevronDown, ChevronUp,
  Clock, Award, Check
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { TourCard } from '@/components/ui/TourCard';
import { Button } from '@/components/ui/button';
import {
  useListCategories,
  useGetBestSellerTours,
  useListReviews,
} from '@workspace/api-client-react';

/* ─── Constants ──────────────────────────────────────────── */

const WHATSAPP_BASE = 'https://wa.me/201001234567';
const WA_GENERAL = `${WHATSAPP_BASE}?text=${encodeURIComponent('Hello! I would like to book a tour in Hurghada. Can you help me?')}`;

const QUICK_CATS = [
  { emoji: '🏝', label: 'Islands', id: 1 },
  { emoji: '🤿', label: 'Diving', id: 2 },
  { emoji: '🌊', label: 'Water Sports', id: 3 },
  { emoji: '🏜', label: 'Safari', id: 4 },
  { emoji: '🏛', label: 'Luxor & Cairo', id: 5 },
  { emoji: '🚐', label: 'Transfers', id: 6 },
];

const CAT_IMAGES: Record<number, string> = {
  1: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700&q=85',
  2: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=700&q=85',
  3: 'https://images.unsplash.com/photo-1530053969600-caed2596d242?w=700&q=85',
  4: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=700&q=85',
  5: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=700&q=85',
  6: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=700&q=85',
};


/* Country → flag emoji map (common nationalities for Hurghada) */
const COUNTRY_FLAGS: Record<string, string> = {
  'United Kingdom': '🇬🇧',
  'Germany': '🇩🇪',
  'Russia': '🇷🇺',
  'Saudi Arabia': '🇸🇦',
  'France': '🇫🇷',
  'Australia': '🇦🇺',
  'United States': '🇺🇸',
  'Egypt': '🇪🇬',
  'Netherlands': '🇳🇱',
  'Poland': '🇵🇱',
  'Italy': '🇮🇹',
  'Spain': '🇪🇸',
  'Ukraine': '🇺🇦',
};

/* Deterministic avatar from name initial */
const AVATAR_POOL = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80',
];
function getAvatar(id: number) {
  return AVATAR_POOL[id % AVATAR_POOL.length];
}


const FAQS = [
  {
    q: 'How do I book a tour in Hurghada?',
    a: 'You can book directly on our website by clicking "Book Now" on any tour, or instantly via WhatsApp by clicking the green WhatsApp button. Our team replies within minutes, 24/7.',
  },
  {
    q: 'Is hotel pickup included in the tours?',
    a: 'Yes! Most of our tours include free hotel pickup and drop-off from all Hurghada hotels and resorts. This is clearly marked on each tour page with a "Hotel Pickup Included" badge.',
  },
  {
    q: 'What is your cancellation policy?',
    a: 'Most tours offer free cancellation up to 24 hours before departure. Tours with a "Free Cancellation" badge can be cancelled for a full refund. Check each tour\'s specific policy on the detail page.',
  },
  {
    q: 'Are the tours suitable for children and families?',
    a: 'Absolutely! Many of our tours are specifically designed for families with children. Look for the "Family Friendly" badge. Our guides are experienced with young travelers and prioritize safety.',
  },
  {
    q: 'What languages do your guides speak?',
    a: 'Our guides speak English, Arabic, German, Russian, and French. When booking via WhatsApp, just let us know your preferred language and we will match you with the right guide.',
  },
  {
    q: 'How do I pay for my tour?',
    a: 'You can pay securely online when booking through the website, or pay in cash or by card on the day of the tour when booking via WhatsApp. No upfront payment is required to reserve your spot.',
  },
  {
    q: 'Do I need to bring anything for the tours?',
    a: 'For water activities: sunscreen, swimwear, a towel, and a change of clothes. For desert safaris: comfortable closed shoes, a hat, and sunglasses. For historical trips: comfortable walking shoes and a light jacket.',
  },
  {
    q: 'Is Hurghada safe for tourists?',
    a: 'Hurghada is one of Egypt\'s safest tourist destinations with a strong security presence. Our operators are fully licensed and insured. The Red Sea is calm and safe for water activities year-round.',
  },
];

/* ─── Sub-components ─────────────────────────────────────── */

function SectionHeader({
  label, title, subtitle, href, centered = false,
}: {
  label?: string;
  title: string;
  subtitle?: string;
  href?: string;
  centered?: boolean;
}) {
  return (
    <div className={`flex flex-col ${centered ? 'items-center text-center' : 'md:flex-row md:items-end'} justify-between mb-12 gap-3`}>
      <div className={centered ? 'max-w-2xl' : ''}>
        {label && (
          <div className={`flex items-center gap-2.5 mb-3 ${centered ? 'justify-center' : ''}`}>
            <span className="w-8 h-px bg-accent inline-block" />
            <span className="text-accent font-bold uppercase tracking-widest text-xs">{label}</span>
            <span className="w-8 h-px bg-accent inline-block" />
          </div>
        )}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground leading-tight">{title}</h2>
        {subtitle && <p className="text-muted-foreground mt-3 text-base max-w-xl leading-relaxed">{subtitle}</p>}
      </div>
      {href && !centered && (
        <Link href={href} className="text-primary font-medium hover:text-primary/80 flex items-center gap-1 text-sm shrink-0 group">
          View all <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-xl overflow-hidden transition-colors duration-200 ${open ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left font-semibold text-sm md:text-base hover:bg-muted/40 transition-colors"
      >
        <span className="pr-4">{q}</span>
        <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${open ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          {open
            ? <ChevronUp className="w-3.5 h-3.5" />
            : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
          {a}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: bestSellers } = useGetBestSellerTours({ limit: 12 });
  const { data: categories } = useListCategories();
  const { data: topReviews } = useListReviews({ rating: 5, limit: 6 });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) setLocation(`/tours?search=${encodeURIComponent(searchQuery.trim())}`);
    else setLocation('/tours');
  };

  return (
    <Layout>

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90dvh] md:min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden">

        {/* Background — darker gradient for drama */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1920&q=90"
            alt="Hurghada Red Sea"
            className="w-full h-full object-cover"
            loading="eager"
          />
          {/* Rich cinematic gradient: dark top for legibility, clear middle to show the sea, dark bottom for stats */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/15 to-black/75" />
          {/* Vignette sides on desktop */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.45)_100%)]" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 md:px-6 text-center text-white flex flex-col items-center mt-16 md:mt-20 mb-24 md:mb-28">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-4xl"
          >
            {/* Eyebrow badge */}
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/12 backdrop-blur-md text-xs font-bold tracking-widest uppercase mb-7 border border-white/20"
            >
              ⭐ Hurghada's #1 Experience Marketplace
            </motion.span>

            {/* Headline — two-line, emotional */}
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-serif font-bold tracking-tight mb-6 leading-[1.05]">
              Where Ancient Egypt<br />
              <span className="text-accent">Meets the Red Sea</span>
            </h1>

            <p className="text-lg md:text-xl font-light max-w-2xl mx-auto mb-10 text-white/85 leading-relaxed">
              Island escapes, coral reef dives, Sahara safaris, and temple odysseys —
              all from Hurghada, Egypt's adventure capital.
            </p>

            {/* Search box */}
            <form
              onSubmit={handleSearch}
              className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl flex items-center gap-2 p-2"
            >
              <div className="flex-1 flex items-center px-3 gap-2.5">
                <Search className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search tours, activities, islands, diving…"
                  className="w-full bg-transparent border-none text-gray-800 focus:outline-none focus:ring-0 text-base placeholder:text-gray-400 py-1"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="rounded-xl px-7 py-3 h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-base shrink-0"
              >
                Search
              </Button>
            </form>

            {/* Quick category pills */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-7">
              {QUICK_CATS.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setLocation(`/tours?categoryId=${cat.id}`)}
                  className="flex items-center gap-1.5 bg-white/12 hover:bg-white/22 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-sm font-medium text-white transition-all hover:scale-105"
                >
                  <span>{cat.emoji}</span> {cat.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          className="absolute bottom-[88px] left-1/2 -translate-x-1/2 z-10 text-white/40 flex flex-col items-center gap-1 hidden md:flex"
        >
          <span className="text-[10px] tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-4 h-4" />
        </motion.div>

        {/* Stats strip — frosted glass, premium */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-r from-black/60 via-black/55 to-black/60 backdrop-blur-md border-t border-white/8">
          <div className="container mx-auto px-4 py-4 flex flex-wrap justify-center md:justify-around gap-6">
            {[
              { value: '36+', label: 'Experiences' },
              { value: '15,000+', label: 'Happy Travelers' },
              { value: '4.9 ★', label: 'Average Rating' },
              { value: '24/7', label: 'WhatsApp Support' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="text-center text-white"
              >
                <div className="text-2xl font-bold tracking-tight">{s.value}</div>
                <div className="text-[11px] text-white/55 uppercase tracking-widest mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CATEGORIES — premium image cards
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader
            label="Browse by Activity"
            title="Find Your Perfect Experience"
            subtitle="Six distinct worlds — all within reach from your Hurghada hotel."
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {categories?.map((cat, i) => {
              const qc = QUICK_CATS.find(q => q.id === cat.id);
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.5 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.98 }}
                  className="relative rounded-2xl overflow-hidden cursor-pointer group aspect-[3/4] sm:aspect-[4/3]"
                  onClick={() => setLocation(`/tours?categoryId=${cat.id}`)}
                >
                  <img
                    src={CAT_IMAGES[cat.id] || CAT_IMAGES[1]}
                    alt={cat.name}
                    loading="lazy"
                    className="w-full h-full object-cover absolute inset-0 group-hover:scale-[1.06] transition-transform duration-700 ease-out"
                  />
                  {/* Gradient: visible at bottom, clear at top */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  {/* Bottom label */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-0">
                    <h3 className="text-white font-bold text-sm md:text-base leading-tight">{cat.name}</h3>
                    <p className="text-white/65 text-xs mt-0.5 flex items-center gap-1">
                      <span>{qc?.emoji}</span>
                      {cat.tourCount || '5+'} experiences
                    </p>
                  </div>
                  {/* Hover arrow */}
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/0 group-hover:bg-white/15 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 backdrop-blur-sm">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          BEST SELLING EXPERIENCES — full grid
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader
            label="Traveler Favorites"
            title="Best Selling Experiences"
            subtitle="Our most-booked tours — chosen by thousands of happy travelers every month."
            href="/tours?sortBy=best_seller"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {bestSellers?.map((tour, i) => (
              <TourCard key={tour.id} tour={tour} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WHY BOOK WITH US
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader
            label="Our Promise"
            title="Why Travelers Choose Us"
            subtitle="We're local Hurghada experts — not a global aggregator. Every operator is personally verified by our team."
            centered
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[
              {
                icon: <Tag className="w-5 h-5" />,
                title: 'Best Price Guarantee',
                desc: 'Find the same tour cheaper anywhere online? We\'ll match the price — no questions asked.',
                color: 'text-yellow-400',
              },
              {
                icon: <MessageCircle className="w-5 h-5" />,
                title: 'Instant WhatsApp Booking',
                desc: 'Book any tour in minutes. Our team is online 24/7 in English, Arabic, German & Russian.',
                color: 'text-green-400',
              },
              {
                icon: <Shield className="w-5 h-5" />,
                title: 'Free Cancellation',
                desc: 'Most tours include free cancellation up to 24 hours before departure. No risk, no stress.',
                color: 'text-blue-400',
              },
              {
                icon: <Award className="w-5 h-5" />,
                title: 'Verified Local Operators',
                desc: 'All operators are licensed, insured, and personally verified. Your safety is our priority.',
                color: 'text-purple-400',
              },
              {
                icon: <Car className="w-5 h-5" />,
                title: 'Hotel Pickup Included',
                desc: 'Free door-to-door pickup from every hotel and resort in Hurghada for most tours.',
                color: 'text-cyan-400',
              },
              {
                icon: <Users className="w-5 h-5" />,
                title: '15,000+ Happy Travelers',
                desc: "Join thousands who've experienced Hurghada with us. Hundreds of genuine 5-star reviews.",
                color: 'text-orange-400',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group flex flex-col gap-4 bg-white/5 hover:bg-white/9 border border-white/10 hover:border-white/20 p-6 rounded-2xl transition-all duration-300"
              >
                {/* Icon circle */}
                <div className={`w-11 h-11 rounded-xl bg-white/8 flex items-center justify-center ${item.color}`}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-base mb-1.5">{item.title}</h3>
                  <p className="text-primary-foreground/60 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CUSTOMER REVIEWS — premium testimonial cards
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader
            label="What Travelers Say"
            title="Loved Around the World"
            centered
          />
          {/* Aggregate trust signal */}
          <div className="flex items-center justify-center gap-3 mb-12 -mt-4">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(s => <Star key={s} className="w-5 h-5 fill-accent text-accent" />)}
            </div>
            <span className="text-xl font-bold">4.9</span>
            <span className="text-muted-foreground text-sm">· Based on 3,200+ verified reviews</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(topReviews ?? []).map((rev, i) => (
              <motion.div
                key={rev.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                className="bg-card border border-border rounded-2xl p-6 flex flex-col hover:shadow-lg hover:border-primary/20 transition-all duration-300"
              >
                {/* Stars */}
                <div className="flex items-center gap-0.5 mb-4">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-accent text-accent" />)}
                </div>

                {/* Opening quotemark */}
                <div className="text-5xl leading-none font-serif text-accent/25 select-none mb-2 -mt-1">"</div>

                {/* Review text — foreground, not muted */}
                <p className="text-foreground text-sm leading-relaxed flex-1">{rev.comment ?? ''}"</p>

                {/* Author */}
                <div className="pt-4 mt-4 border-t border-border flex items-center gap-3">
                  <img
                    src={getAvatar(rev.id)}
                    alt={rev.name ?? ''}
                    loading="lazy"
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-border"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{rev.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {rev.country ? `${COUNTRY_FLAGS[rev.country] ?? '🌍'} ${rev.country}` : ''}
                    </p>
                  </div>
                  {/* Verified tag */}
                  <div className="flex items-center gap-1 text-[10px] text-green-600 font-semibold bg-green-50 border border-green-200 px-2 py-1 rounded-full shrink-0">
                    <Check className="w-2.5 h-2.5" /> Verified
                  </div>
                </div>

                {/* Tour name */}
                {rev.tourTitle && (
                  <p className="text-[11px] text-accent font-medium mt-2.5 truncate">{rev.tourTitle}</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <SectionHeader
              label="Got Questions?"
              title="Everything You Need to Know"
              subtitle="Common questions about booking tours in Hurghada, answered."
              centered
            />
            <div className="space-y-3">
              {FAQS.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
            </div>
            <div className="mt-10 text-center bg-muted/40 border border-border rounded-2xl p-8">
              <p className="font-bold text-lg mb-1.5">Still have questions?</p>
              <p className="text-muted-foreground text-sm mb-6">Our local Hurghada team replies within minutes — 24/7 on WhatsApp.</p>
              <a
                href={WA_GENERAL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3.5 rounded-xl transition-colors shadow-md hover:shadow-lg"
              >
                <MessageCircle className="w-5 h-5" /> Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FINAL CTA — dramatic close
      ══════════════════════════════════════════════════════ */}
      <section className="relative py-28 text-center overflow-hidden">
        {/* Rich background with sea image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1800&q=85"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/88" />
        </div>

        <div className="relative z-10 container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center justify-center gap-2.5 mb-6">
              <span className="w-10 h-px bg-accent inline-block" />
              <span className="text-accent font-bold uppercase tracking-widest text-xs">Your Adventure Awaits</span>
              <span className="w-10 h-px bg-accent inline-block" />
            </div>

            <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-5 leading-tight">
              Your Dream Holiday<br className="hidden md:block" />
              Starts With One Message.
            </h2>

            <p className="text-white/70 text-lg max-w-lg mx-auto mb-10 leading-relaxed">
              33 handpicked experiences. Free cancellation. Hotel pickup included. Instant WhatsApp confirmation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setLocation('/tours')}
                className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl px-10 h-12 text-base font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Browse All Experiences
              </Button>
              <a
                href={WA_GENERAL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-10 h-12 rounded-xl transition-all text-base shadow-lg hover:shadow-xl"
              >
                <MessageCircle className="w-5 h-5" /> Book via WhatsApp
              </a>
            </div>

            {/* Trust micro-copy */}
            <p className="text-white/40 text-xs mt-8 flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              No payment required to enquire · Free cancellation on most tours · Reply within 5 minutes
            </p>
          </motion.div>
        </div>
      </section>

    </Layout>
  );
}
