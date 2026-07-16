import React from 'react';
import { Link } from 'wouter';
import { Facebook, Instagram, Youtube, MessageCircle, Mail, MapPin, Phone, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">

        {/* WhatsApp CTA banner */}
        <div className="bg-green-600 rounded-2xl p-6 mb-14 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-lg text-white">Book any tour instantly via WhatsApp</p>
            <p className="text-white/80 text-sm mt-0.5">Our team replies within minutes, 24/7 in English & Arabic</p>
          </div>
          <a
            href="https://wa.me/201001234567?text=Hello%2C%20I%20would%20like%20to%20book%20a%20tour%20in%20Hurghada.%20Can%20you%20help%20me%3F"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white text-green-700 font-bold px-6 py-3 rounded-xl hover:bg-green-50 transition-colors shrink-0"
          >
            <MessageCircle className="w-5 h-5" /> +20 100 123 4567
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">

          {/* Brand */}
          <div className="lg:col-span-2 space-y-5">
            <Link href="/" className="text-3xl font-serif font-bold tracking-tight">
              WavesOf<span className="text-accent">Egypt</span>
            </Link>
            <p className="text-primary-foreground/75 leading-relaxed text-sm max-w-xs">
              Hurghada's #1 tour marketplace — 33 handpicked experiences on the Red Sea. Verified operators, instant WhatsApp booking, free cancellation.
            </p>
            <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
              <MapPin className="w-4 h-4 shrink-0" /> El Mamsha, Hurghada, Red Sea, Egypt
            </div>
            <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
              <Phone className="w-4 h-4 shrink-0" /> +20 100 123 4567
            </div>
            <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
              <Mail className="w-4 h-4 shrink-0" /> info@wavesofegypt.com
            </div>
            <div className="flex gap-3 pt-1">
              {[
                { href: '#', icon: <Facebook className="w-4 h-4" />, label: 'Facebook' },
                { href: '#', icon: <Instagram className="w-4 h-4" />, label: 'Instagram' },
                { href: '#', icon: <Youtube className="w-4 h-4" />, label: 'YouTube' },
                { href: 'https://wa.me/201001234567', icon: <MessageCircle className="w-4 h-4" />, label: 'WhatsApp' },
              ].map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  className="w-9 h-9 rounded-full bg-primary-foreground/10 hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-colors">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Experiences */}
          <div className="space-y-4">
            <h4 className="font-semibold text-primary-foreground">Experiences</h4>
            <ul className="space-y-2.5 text-sm text-primary-foreground/75">
              {[
                ['Sea & Island Trips', '/tours?categoryId=1'],
                ['Diving & Snorkeling', '/tours?categoryId=2'],
                ['Water Sports', '/tours?categoryId=3'],
                ['Safari & Desert', '/tours?categoryId=4'],
                ['Luxor & Cairo Tours', '/tours?categoryId=5'],
                ['Transfers', '/tours?categoryId=6'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-accent transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="font-semibold text-primary-foreground">Company</h4>
            <ul className="space-y-2.5 text-sm text-primary-foreground/75">
              {[
                ['About Us', '/about'],
                ['Contact', '/contact'],
                ['FAQ', '/faq'],
                ['Travel Blog', '/blog'],
                ['Become a Partner', '/vendor/register'],
                ['Terms of Service', '/terms'],
                ['Privacy Policy', '/privacy'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-accent transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter + Language */}
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-primary-foreground mb-3">Stay in the loop</h4>
              <p className="text-primary-foreground/70 text-xs mb-3">Get exclusive deals & Hurghada travel tips.</p>
              <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  className="bg-primary-foreground/10 border-primary-foreground/20 text-white placeholder:text-white/40 text-sm h-9"
                />
                <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-9 text-sm rounded-lg">
                  Subscribe
                </Button>
              </form>
            </div>
            <div>
              <h4 className="font-semibold text-primary-foreground mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Language
              </h4>
              <div className="flex flex-wrap gap-2">
                {['🇬🇧 English', '🇸🇦 العربية', '🇩🇪 Deutsch', '🇷🇺 Русский'].map((lang) => (
                  <button key={lang} className="text-xs text-primary-foreground/70 hover:text-accent px-2 py-1 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/15 transition-colors">
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/15 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-primary-foreground/50">
          <p>© {new Date().getFullYear()} WavesOfEgypt. All rights reserved. Cairo, Egypt 🇪🇬</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
