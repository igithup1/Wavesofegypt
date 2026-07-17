import React from 'react';
import Layout from '@/components/layout/Layout';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Shield, Star, Users, MapPin, MessageCircle, Award } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

const stats = [
  { value: '33+', label: 'Handpicked Tours' },
  { value: '5,000+', label: 'Happy Travelers' },
  { value: '4.9★', label: 'Average Rating' },
  { value: '24/7', label: 'WhatsApp Support' },
];

const values = [
  {
    icon: <Shield className="w-7 h-7" />,
    title: 'Verified Operators Only',
    description: 'Every tour operator on our platform is personally vetted for safety standards, licences, and guest satisfaction before going live.',
  },
  {
    icon: <Star className="w-7 h-7" />,
    title: 'Genuine Reviews',
    description: 'Only travelers who have completed a booking can leave a review. No fake five-stars — just honest feedback from real guests.',
  },
  {
    icon: <Users className="w-7 h-7" />,
    title: 'Small Groups, Big Experiences',
    description: 'We prioritize boutique group sizes so you get a personal experience — not a crowded bus tour.',
  },
  {
    icon: <Award className="w-7 h-7" />,
    title: 'Free Cancellation',
    description: 'Life happens. Most of our tours offer free cancellation up to 24 hours before departure, no questions asked.',
  },
];

export default function About() {
  usePageMeta({
    title: 'About Us',
    description: 'Learn how WavesOfEgypt connects travelers with the finest Red Sea tours in Hurghada — verified operators, genuine reviews, free cancellation.',
    canonical: '/about',
  });
  return (
    <Layout>
      {/* Hero */}
      <div className="bg-primary pt-32 pb-20 text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">About WavesOfEgypt</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Hurghada's first curated tour marketplace — connecting travelers with the finest Red Sea experiences since 2022.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-accent/10 border-y border-accent/20 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-4xl font-serif font-bold text-primary mb-1">{s.value}</div>
                <div className="text-muted-foreground text-sm font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Story */}
      <div className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <h2 className="text-3xl font-serif font-bold mb-6">Our Story</h2>
          <div className="space-y-5 text-muted-foreground leading-relaxed text-lg">
            <p>
              WavesOfEgypt was born out of frustration. Our founders — avid divers who visited Hurghada every year — kept running into the same problem: the best local guides were impossible to find online, and the ones that were easy to book were often overpriced aggregators with hidden fees and impersonal service.
            </p>
            <p>
              So in 2022, we built the platform we always wished existed. One place to browse every type of Red Sea experience — from a morning snorkel on Giftun Island to a full-day Luxor excursion — with transparent pricing, real reviews, and a direct line to the team via WhatsApp.
            </p>
            <p>
              Today WavesOfEgypt works with over 15 licensed local operators and has helped more than 5,000 travelers discover the magic of the Red Sea coast.
            </p>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-serif font-bold mb-4">What We Stand For</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Four principles that guide every decision we make.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {values.map((v) => (
              <div key={v.title} className="bg-background rounded-2xl p-8 border border-border shadow-sm">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-5">
                  {v.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{v.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-serif font-bold">Based in Hurghada</h2>
          </div>
          <p className="text-muted-foreground text-lg leading-relaxed mb-10">
            Our team lives and works in Hurghada year-round. We know which dive sites are best at which season, which boat operators run the tightest safety checks, and which local guide will make your desert safari unforgettable. We're not a call centre — we're your neighbours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/tours">Browse All Tours</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="https://wa.me/201001234567?text=Hello%2C%20I%27d%20like%20to%20learn%20more%20about%20WavesOfEgypt." target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4 mr-2" /> Chat on WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
