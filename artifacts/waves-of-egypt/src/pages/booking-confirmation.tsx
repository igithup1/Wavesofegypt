import React from 'react';
import { useSearch, Link } from 'wouter';
import { useGetBooking, type ApiError } from '@workspace/api-client-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import {
  CheckCircle2, Calendar, Users, DollarSign, MessageCircle,
  LayoutDashboard, ArrowRight, Copy, ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';

export default function BookingConfirmation() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const bookingId = params.get('id') ? parseInt(params.get('id')!) : 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: booking, isLoading, error } = useGetBooking(bookingId, {
    query: { enabled: !!bookingId, retry: false } as any,
  });

  // error is an ApiError class instance (from custom-fetch) which carries .status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isForbidden = (error as any)?.status === 403;

  const bookingRef = booking ? `WOE-${String(booking.id).padStart(5, '0')}` : '';

  const whatsappMsg = booking
    ? encodeURIComponent(
        `Hi! I just booked "${booking.tourTitle}" on WavesOfEgypt.\n` +
        `📋 Booking Ref: ${bookingRef}\n` +
        `📅 Date: ${format(new Date(booking.date), 'MMMM dd, yyyy')}\n` +
        `👥 Travelers: ${booking.participants}\n` +
        `💰 Total: $${booking.totalPrice}\n\n` +
        `Looking forward to the experience!`
      )
    : '';
  const whatsappUrl = `https://wa.me/201001234567?text=${whatsappMsg}`;

  const copyRef = () => {
    navigator.clipboard.writeText(bookingRef);
    toast.success('Booking reference copied!');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-muted/30 flex items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="w-20 h-20 rounded-full bg-muted animate-pulse mx-auto" />
            <div className="h-6 bg-muted animate-pulse rounded w-48 mx-auto" />
            <div className="h-4 bg-muted animate-pulse rounded w-64 mx-auto" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!booking) {
    return (
      <Layout>
        <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            {isForbidden ? (
              <>
                <div className="flex justify-center mb-4">
                  <ShieldAlert className="w-14 h-14 text-destructive" />
                </div>
                <h1 className="text-2xl font-serif font-bold mb-3">Access Denied</h1>
                <p className="text-muted-foreground mb-6">You don't have permission to view this booking. Please make sure you're logged in to the correct account.</p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-serif font-bold mb-3">Booking not found</h1>
                <p className="text-muted-foreground mb-6">We couldn't find that booking. It may have been removed or the link is invalid.</p>
              </>
            )}
            <Button asChild>
              <Link href="/dashboard">View My Bookings</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Mobile sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/97 backdrop-blur-md border-t border-border shadow-2xl">
        <div className="flex items-center gap-3 px-4 py-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border border-green-300 bg-green-50 hover:bg-green-100 text-green-700 font-medium text-sm transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Message us on WhatsApp
          </a>
          <Button asChild className="h-12 px-5 bg-primary text-primary-foreground rounded-xl">
            <Link href="/dashboard">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              My Trips
            </Link>
          </Button>
        </div>
      </div>

      <div className="min-h-screen bg-muted/30 pb-28 lg:pb-16">
        {/* Hero banner */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 text-white py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shadow-xl">
                <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold mb-3">Booking Confirmed!</h1>
            <p className="text-green-100 text-lg max-w-md mx-auto">
              Your adventure is locked in. We can't wait to welcome you to Egypt.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-6 -mt-8 max-w-2xl">

          {/* Main confirmation card */}
          <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden mb-6">

            {/* Tour image & title */}
            {booking.tourCoverImage && (
              <div className="relative h-48 md:h-56">
                <img
                  src={booking.tourCoverImage}
                  alt={booking.tourTitle ?? 'Tour'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5">
                  <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Your Tour</p>
                  <h2 className="text-white font-serif font-bold text-xl md:text-2xl line-clamp-2">
                    {booking.tourTitle}
                  </h2>
                </div>
              </div>
            )}

            <div className="p-6 md:p-8 space-y-6">

              {/* Booking reference */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Booking Reference</p>
                  <p className="text-2xl font-bold font-mono text-primary tracking-wider">{bookingRef}</p>
                </div>
                <button
                  onClick={copyRef}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 border border-primary/30 rounded-lg px-3 py-2 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>

              {/* Booking details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-muted/40 rounded-xl p-4 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider">Date</span>
                  </div>
                  <p className="font-semibold text-sm">
                    {format(new Date(booking.date), 'MMMM dd, yyyy')}
                  </p>
                </div>
                <div className="bg-muted/40 rounded-xl p-4 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider">Travelers</span>
                  </div>
                  <p className="font-semibold text-sm">
                    {booking.participants} {booking.participants === 1 ? 'person' : 'people'}
                  </p>
                </div>
                <div className="bg-muted/40 rounded-xl p-4 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider">Total Paid</span>
                  </div>
                  <p className="font-semibold text-sm">${booking.totalPrice}</p>
                </div>
              </div>

              {/* Status pill */}
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-medium border border-green-200">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Status: {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>

              {/* Notes */}
              {booking.notes && (
                <div className="bg-muted/30 border border-border rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Special Notes</p>
                  <p className="text-sm text-foreground">{booking.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* WhatsApp CTA card */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 md:p-8 text-white mb-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg mb-1">Connect with your guide</h3>
                <p className="text-green-100 text-sm mb-4">
                  Message us on WhatsApp with your booking reference and we'll send you full trip details, 
                  meeting point, and any preparation tips.
                </p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white text-green-700 hover:bg-green-50 font-bold text-sm px-5 py-3 rounded-xl transition-colors shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Open WhatsApp Chat
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Next steps */}
          <div className="bg-card rounded-2xl border border-border p-6 md:p-8 mb-6">
            <h3 className="font-serif font-bold text-lg mb-5">What happens next?</h3>
            <div className="space-y-4">
              {[
                { step: '1', title: 'Confirmation SMS', desc: "You'll receive a confirmation with your booking reference shortly." },
                { step: '2', title: 'WhatsApp briefing', desc: 'Our team will message you with meeting point, timing, and what to bring.' },
                { step: '3', title: 'Day of experience', desc: 'Arrive at the meeting point on time. Show your booking reference to your guide.' },
              ].map((s) => (
                <div key={s.step} className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{s.title}</p>
                    <p className="text-muted-foreground text-sm">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons — desktop */}
          <div className="hidden lg:flex gap-4">
            <Button asChild variant="outline" className="flex-1 h-12 rounded-xl">
              <Link href="/tours">
                Explore More Tours
              </Link>
            </Button>
            <Button asChild className="flex-1 h-12 rounded-xl">
              <Link href="/dashboard">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                View My Bookings
              </Link>
            </Button>
          </div>

        </div>
      </div>
    </Layout>
  );
}
