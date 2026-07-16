import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
  Search, MessageCircle, Star, Shield, Zap, Car, Users, Tag,
  ChevronRight, ChevronDown, ChevronUp, CheckCircle2, MapPin,
  Clock, Award, Headphones, TrendingUp, BadgePercent
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { TourCard } from '@/components/ui/TourCard';
import { Button } from '@/components/ui/button';
import {
  useGetFeaturedTours,
  useListCategories,
  useGetBestSellerTours,
  useGetPlatformStats,
  useListTours,
} from '@workspace/api-client-react';

/* ─── Constants ──────────────────────────────────────────── */

const WHATSAPP_BASE = 'https://wa.me/201001234567';
const WA_GENERAL = `${WHATSAPP_BASE}?text=${encodeURIComponent('Hello! I would like to book a tour in Hurghada. Can you help me?')}`;

const QUICK_CATS = [
  { emoji: '🏝', label: 'Islands', id: 1 },
  { emoji: '🤿', label: 'Diving', id: 2 },
  { emoji: '🌊', label: 'Water Sports', id: 3 },
  { emoji: '🏜', label: 'Safari', id: 4 },
  { emoji: '🏛', label: 'Day Trips', id: 7 },
  { emoji: '🚐', label: 'Transfers', id: 6 },
];

const CAT_IMAGES: Record<number, string> = {
  1: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80',
  2: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80',
  3: 'https://images.unsplash.com/photo-1530053969600-caed2596d242?w=600&q=80',
  4: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&q=80',
  5: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=600&q=80',
  6: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80',
  7: 'https://images.unsplash.com/photo-1539650116574-75c0c6d14e80?w=600&q=80',
};

const DESTINATIONS = [
  {
    name: 'Orange Bay',
    tagline: "Hurghada's most beautiful island",
    img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80',
    query: 'Orange Bay',
  },
  {
    name: 'Paradise Island',
    tagline: 'White sand, crystal waters',
    img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    query: 'Paradise Island',
  },
  {
    name: 'Dolphin House',
    tagline: 'Swim with wild dolphins',
    img: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80',
    query: 'Dolphin House',
  },
  {
    name: 'Desert Safari',
    tagline: 'Quad bikes, Bedouin camps',
    img: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&q=80',
    query: 'Safari',
  },
  {
    name: 'Luxor',
    tagline: 'Temples & Valley of the Kings',
    img: 'https://images.unsplash.com/photo-1539650116574-75c0c6d14e80?w=600&q=80',
    query: 'Luxor',
  },
  {
    name: 'Cairo',
    tagline: 'Pyramids of Giza & Sphinx',
    img: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=600&q=80',
    query: 'Cairo',
  },
];

const REVIEWS = [
  {
    name: 'Sarah M.',
    country: '🇬🇧 United Kingdom',
    rating: 5,
    text: 'Absolutely incredible! The Orange Bay trip was the highlight of our holiday. The boat, food, and snorkeling were all perfect. Booked via WhatsApp and confirmed in minutes!',
    tour: 'Orange Bay Island Snorkeling',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80',
  },
  {
    name: 'Marcus K.',
    country: '🇩🇪 Germany',
    rating: 5,
    text: 'The desert quad bike safari was amazing. Our guide was so knowledgeable about Bedouin culture. Hotel pickup was on time, everything was organized perfectly.',
    tour: 'Desert Safari & Quad Biking',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80',
  },
  {
    name: 'Elena V.',
    country: '🇷🇺 Russia',
    rating: 5,
    text: 'My kids loved the family snorkeling trip! The guide was patient with children, the boat had good shade and the fish were incredible. Will definitely book again next year.',
    tour: 'Family Snorkeling Adventure',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80',
  },
  {
    name: 'Ahmed R.',
    country: '🇸🇦 Saudi Arabia',
    rating: 5,
    text: 'Best diving experience I\'ve ever had. The instructor was PADI certified, the equipment was clean and modern, and the coral reef at Giftun Island is stunning.',
    tour: 'PADI Diving Course',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&q=80',
  },
  {
    name: 'Julia B.',
    country: '🇫🇷 France',
    rating: 5,
    text: 'The Luxor day trip from Hurghada was worth every penny. The private guide at Karnak Temple was exceptional — so much knowledge. Highly recommend this company.',
    tour: 'Luxor Day Trip from Hurghada',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&q=80',
  },
  {
    name: 'Tom H.',
    country: '🇦🇺 Australia',
    rating: 5,
    text: 'Jet skiing, parasailing, and banana boat all in one afternoon. The staff were friendly and safety-conscious. Great value for money and instant WhatsApp confirmation!',
    tour: 'Water Sports Package',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80',
  },
];

const GALLERY_IMGS = [
  { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80', alt: 'Orange Bay Island', span: 'col-span-2 row-span-2' },
  { src: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80', alt: 'Snorkeling Red Sea', span: '' },
  { src: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&q=80', alt: 'Desert Safari', span: '' },
  { src: 'https://images.unsplash.com/photo-1530053969600-caed2596d242?w=600&q=80', alt: 'Water Sports', span: '' },
  { src: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=600&q=80', alt: 'Egyptian Temples', span: '' },
  { src: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80', alt: 'Airport Transfer', span: '' },
  { src: 'https://images.unsplash.com/photo-1539650116574-75c0c6d14e80?w=600&q=80', alt: 'Red Sea Hurghada', span: '' },
];

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
    a: 'For water activities: sunscreen, swimwear, a towel, and a change of clothes. For desert safaris: comfortable closed shoes, a hat, and sunglasses. For historical trips: comfortable walking shoes and a light jacket for air-conditioned coach travel.',
  },
  {
    q: 'Is Hurghada safe for tourists?',
    a: 'Hurghada is one of Egypt\'s safest tourist destinations with a strong security presence. Our operators are fully licensed and insured. The Red Sea is calm and safe for water activities year-round.',
  },
];

/* ─── Sub-components ─────────────────────────────────────── */

function SectionHeader({
  label, title, subtitle, href,
}: { label?: string; title: string; subtitle?: string; href?: string }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-3">
      <div>
        {label && <span className="text-accent font-bold uppercase tracking-widest text-xs">{label}</span>}
        <h2 className="text-3xl md:text-4xl font-serif font-bold mt-1 text-foreground">{title}</h2>
        {subtitle && <p className="text-muted-foreground mt-2 max-w-xl">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="text-primary font-medium hover:text-primary/80 flex items-center gap-1 text-sm shrink-0">
          View all <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left font-semibold text-sm md:text-base hover:bg-muted/40 transition-colors"
      >
        {q}
        {open ? <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0 ml-3" /> : <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0 ml-3" />}
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
          {a}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: bestSellers } = useGetBestSellerTours({ limit: 8 });
  const { data: categories } = useListCategories();
  const { data: stats } = useGetPlatformStats();
  const { data: specialOffers } = useListTours({ limit: 4, sortBy: 'price_asc' } as any);
  const { data: featuredTours } = useGetFeaturedTours({ limit: 4 });

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
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1920&q=85"
            alt="Hurghada Red Sea"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/60" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 md:px-6 text-center text-white mt-20 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
            className="w-full max-w-4xl"
          >
            <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold tracking-widest uppercase mb-6 border border-white/25">
              ⭐ Hurghada's #1 Experience Marketplace
            </span>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold tracking-tight mb-5 drop-shadow-lg leading-tight">
              Discover the Best<br />
              <span className="text-accent">Tours &amp; Excursions</span><br />
              in Hurghada
            </h1>

            <p className="text-lg md:text-xl font-light max-w-2xl mx-auto mb-10 text-white/90 drop-shadow leading-relaxed">
              Book the most popular experiences with instant WhatsApp confirmation.
            </p>

            {/* Search box */}
            <form
              onSubmit={handleSearch}
              className="max-w-2xl mx-auto bg-white/95 backdrop-blur-xl p-2.5 rounded-2xl shadow-2xl flex items-center gap-2"
            >
              <div className="flex-1 flex items-center px-4 gap-3">
                <Search className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search tours, activities, islands, diving…"
                  className="w-full bg-transparent border-none text-gray-800 focus:outline-none focus:ring-0 text-base placeholder:text-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="rounded-xl px-7 py-3 h-auto bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base shrink-0"
              >
                Search
              </Button>
            </form>

            {/* Quick category buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              {QUICK_CATS.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setLocation(`/tours?categoryId=${cat.id}`)}
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-md px-4 py-2 rounded-full border border-white/25 text-sm font-medium text-white transition-colors"
                >
                  <span>{cat.emoji}</span> {cat.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Stats strip at bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-md border-t border-white/10">
          <div className="container mx-auto px-4 py-4 flex flex-wrap justify-center md:justify-around gap-6">
            {[
              { value: `${stats?.totalTours || '231'}+`, label: 'Experiences' },
              { value: `${stats?.happyTravelers ? Number(stats.happyTravelers).toLocaleString() : '50,000'}+`, label: 'Happy Travelers' },
              { value: stats?.averageRating ? `${Number(stats.averageRating).toFixed(1)} ★` : '4.8 ★', label: 'Average Rating' },
              { value: '24/7', label: 'WhatsApp Support' },
            ].map((s) => (
              <div key={s.label} className="text-center text-white">
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-white/60 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          BEST SELLERS — horizontal scroll
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-background overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader
            label="Traveler Favorites"
            title="Best Selling Tours"
            subtitle="Our most popular experiences — booked by thousands of happy travelers every month."
            href="/tours?sortBy=best_seller"
          />
        </div>
        {/* Full-bleed scroll strip */}
        <div className="pl-4 md:pl-[calc((100vw-1280px)/2+24px)] overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex gap-4 pr-6 w-max">
            {bestSellers?.map((tour, i) => (
              <TourCard key={tour.id} tour={tour} index={i} horizontal />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CATEGORIES — large premium cards
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader
            label="Browse by Activity"
            title="What Do You Want to Do?"
            subtitle="Seven ways to experience the magic of Hurghada and the Red Sea."
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories?.map((cat, i) => {
              const qc = QUICK_CATS.find(q => q.id === cat.id);
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className={`relative rounded-2xl overflow-hidden cursor-pointer group ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
                  style={{ minHeight: i === 0 ? 340 : 160 }}
                  onClick={() => setLocation(`/tours?categoryId=${cat.id}`)}
                >
                  <img
                    src={CAT_IMAGES[cat.id] || CAT_IMAGES[1]}
                    alt={cat.name}
                    loading="lazy"
                    className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="text-2xl mb-1">{qc?.emoji || '🏖'}</div>
                    <h3 className="text-white font-bold text-lg leading-tight">{cat.name}</h3>
                    <p className="text-white/70 text-xs mt-0.5">{cat.tourCount || '20+'} tours</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WHY BOOK WITH US
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-serif font-bold">Why Book With Us?</h2>
            <p className="text-primary-foreground/70 mt-3 text-lg max-w-xl mx-auto">
              We're local Hurghada experts — not a global aggregator. Every operator is personally vetted.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <Tag className="w-7 h-7" />, title: 'Best Price Guarantee', desc: 'Find the same tour cheaper? We\'ll match the price — no questions asked.' },
              { icon: <MessageCircle className="w-7 h-7" />, title: 'Instant WhatsApp Booking', desc: 'Book any tour in minutes via WhatsApp. Our team is online 24/7 in English & Arabic.' },
              { icon: <MapPin className="w-7 h-7" />, title: 'Local Hurghada Experts', desc: '100% Hurghada-based team. We\'ve done every tour ourselves and know what\'s worth your time.' },
              { icon: <Car className="w-7 h-7" />, title: 'Hotel Pickup Included', desc: 'Free door-to-door pickup from every hotel and resort in Hurghada for most tours.' },
              { icon: <Shield className="w-7 h-7" />, title: 'Secure & Verified', desc: 'All operators are licensed, insured, and personally verified. Your safety is our top priority.' },
              { icon: <Users className="w-7 h-7" />, title: 'Thousands of Happy Travelers', desc: '50,000+ travelers have booked with us. Read thousands of genuine 5-star reviews.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-5 bg-primary-foreground/8 backdrop-blur-sm border border-primary-foreground/10 p-6 rounded-2xl"
              >
                <div className="text-accent shrink-0 mt-0.5">{item.icon}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    <h3 className="font-bold text-base">{item.title}</h3>
                  </div>
                  <p className="text-primary-foreground/65 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          POPULAR DESTINATIONS
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader
            label="Top Destinations"
            title="Popular Destinations"
            subtitle="From Red Sea islands to ancient temples — explore the best places from Hurghada."
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {DESTINATIONS.map((dest, i) => (
              <motion.div
                key={dest.name}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                onClick={() => setLocation(`/tours?search=${encodeURIComponent(dest.query)}`)}
                className="relative rounded-2xl overflow-hidden cursor-pointer group"
                style={{ height: i === 0 || i === 3 ? 260 : 200 }}
              >
                <img
                  src={dest.img}
                  alt={dest.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-bold text-lg leading-tight">{dest.name}</h3>
                  <p className="text-white/70 text-xs">{dest.tagline}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SPECIAL OFFERS
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-br from-red-950/20 via-background to-background border-y border-red-900/10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 text-red-600 font-bold uppercase tracking-widest text-xs">
                <BadgePercent className="w-4 h-4" /> Limited Time
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mt-1">Special Offers</h2>
              <p className="text-muted-foreground mt-2">Best value tours at unbeatable prices — don't miss out.</p>
            </div>
            <Link href="/tours?sortBy=price_asc" className="text-primary font-medium hover:text-primary/80 flex items-center gap-1 text-sm shrink-0">
              All deals <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {specialOffers?.tours?.map((tour, i) => (
              <TourCard key={tour.id} tour={tour} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CUSTOMER REVIEWS
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <span className="text-accent font-bold uppercase tracking-widest text-xs">What Travelers Say</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mt-1">Customer Reviews</h2>
            <div className="flex items-center justify-center gap-2 mt-3">
              {[1,2,3,4,5].map(s => <Star key={s} className="w-5 h-5 fill-accent text-accent" />)}
              <span className="text-lg font-bold ml-1">4.9</span>
              <span className="text-muted-foreground text-sm">· Based on 3,200+ reviews</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {REVIEWS.map((rev, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-accent text-accent" />)}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed flex-1">"{rev.text}"</p>
                <div className="pt-2 border-t border-border flex items-center gap-3">
                  <img
                    src={rev.avatar}
                    alt={rev.name}
                    loading="lazy"
                    className="w-10 h-10 rounded-full object-cover border-2 border-border"
                  />
                  <div>
                    <p className="font-semibold text-sm">{rev.name}</p>
                    <p className="text-xs text-muted-foreground">{rev.country}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-accent font-medium truncate max-w-[120px]">{rev.tour}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          GALLERY
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <span className="text-accent font-bold uppercase tracking-widest text-xs">Visual Journey</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mt-1">Hurghada in Pictures</h2>
            <p className="text-muted-foreground mt-2">Real photos from real tours — no filters, no stock images.</p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 gap-3 auto-rows-[160px]">
            {GALLERY_IMGS.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className={`relative rounded-2xl overflow-hidden group cursor-pointer ${img.span}`}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <span className="text-white font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-3 py-1 rounded-full">
                    {img.alt}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-accent font-bold uppercase tracking-widest text-xs">Got Questions?</span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mt-1">Frequently Asked Questions</h2>
              <p className="text-muted-foreground mt-2">Everything you need to know about booking tours in Hurghada.</p>
            </div>
            <div className="space-y-3">
              {FAQS.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
            </div>
            <div className="mt-10 text-center bg-card border border-border rounded-2xl p-8">
              <p className="font-semibold text-lg mb-2">Still have questions?</p>
              <p className="text-muted-foreground text-sm mb-5">Our local team is available 24/7 on WhatsApp — we reply in minutes.</p>
              <a
                href={WA_GENERAL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
              >
                <MessageCircle className="w-5 h-5" /> Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 bg-accent text-accent-foreground text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1400" className="w-full h-full object-cover" alt="" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">Ready for Your Hurghada Adventure?</h2>
          <p className="text-accent-foreground/80 text-lg max-w-xl mx-auto mb-10">
            231+ experiences. Free cancellation. Instant WhatsApp confirmation. Hotel pickup included.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setLocation('/tours')}
              className="bg-accent-foreground text-accent hover:bg-accent-foreground/90 rounded-xl px-10 h-12 text-base font-bold"
            >
              Browse All Experiences
            </Button>
            <a
              href={WA_GENERAL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-10 h-12 rounded-xl transition-colors text-base"
            >
              <MessageCircle className="w-5 h-5" /> Book via WhatsApp
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
