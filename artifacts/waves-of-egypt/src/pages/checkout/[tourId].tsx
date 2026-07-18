import React, { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useGetTour, useCreateBooking, useGetMe, useListBookings } from '@workspace/api-client-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Users, CreditCard, ShieldCheck, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Checkout() {
  const [, params] = useRoute('/checkout/:tourId');
  const tourId = params?.tourId ? parseInt(params.tourId) : 0;
  const [, setLocation] = useLocation();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tour, isLoading } = useGetTour(tourId, {
    query: { enabled: !!tourId } as any,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: user } = useGetMe({ query: { retry: false } as any });

  const [date, setDate] = useState<Date>();
  const [participants, setParticipants] = useState(1);
  const [notes, setNotes] = useState('');
  const [capacityError, setCapacityError] = useState<string | null>(null);

  // Fetch existing bookings so we can disable already-booked dates in the picker
  const { data: myBookings } = useListBookings(
    { limit: 100 },
    { query: { enabled: !!user } } as any,
  );
  const bookedDatesForTour: Set<string> = new Set(
    (myBookings ?? [])
      .filter((b) => b.tourId === tourId && b.status !== 'cancelled')
      .map((b) => (typeof b.date === 'string' ? b.date : new Date(b.date).toISOString().split('T')[0])),
  );

  const selectedDateStr = date ? format(date, 'yyyy-MM-dd') : null;
  const selectedDateAlreadyBooked = selectedDateStr ? bookedDatesForTour.has(selectedDateStr) : false;

  const createBookingMutation = useCreateBooking();

  const pricePerPerson = tour?.discountPrice || tour?.price || 0;
  const totalPrice = pricePerPerson * participants;

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to complete your booking');
      setLocation(`/login?redirect=/checkout/${tourId}`);
      return;
    }

    if (!date) {
      toast.error('Please select a date');
      return;
    }

    setCapacityError(null);
    createBookingMutation.mutate(
      { 
        data: { 
          tourId,
          date: format(date, 'yyyy-MM-dd'),
          participants,
          notes
        } 
      },
      {
        onSuccess: (data) => {
          toast.success('Booking confirmed successfully!');
          setLocation(`/booking-confirmation?id=${data.id}`);
        },
        onError: (error) => {
          const msg = error.message || 'Failed to complete booking';
          if (error.status === 409) {
            // Capacity exceeded — surface inline near the date picker
            const apiMsg = (error.data as { error?: string } | null)?.error;
            setCapacityError(apiMsg ?? 'This date is fully booked. Please choose a different date.');
          }
          toast.error(msg);
        }
      }
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="h-8 bg-muted animate-pulse rounded w-1/4 mb-12"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <div className="h-64 bg-muted animate-pulse rounded-2xl"></div>
              <div className="h-64 bg-muted animate-pulse rounded-2xl"></div>
            </div>
            <div className="h-96 bg-muted animate-pulse rounded-2xl"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!tour) {
    return (
      <Layout>
        <div className="py-32 text-center">
          <h1 className="text-3xl font-serif font-bold">Tour not found</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-muted/30 min-h-screen pb-24">
        <div className="bg-primary text-primary-foreground py-12 mb-12">
          <div className="container mx-auto px-4 md:px-6">
            <h1 className="text-3xl md:text-5xl font-serif font-bold">Complete your booking</h1>
            <p className="text-primary-foreground/80 mt-2">Almost there! Just a few more details.</p>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-6">
          <form onSubmit={handleBooking} className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
            
            <div className="lg:col-span-2 space-y-8">
              
              <div className="bg-card p-6 md:p-8 rounded-2xl shadow-sm border border-border">
                <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">1</span>
                  Select Date & Travelers
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full h-12 justify-start text-left font-normal border-border",
                            !date && "text-muted-foreground",
                            capacityError && "border-destructive"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(d) => { setDate(d); setCapacityError(null); }}
                          disabled={(d) => {
                            if (d < new Date() || d < new Date("1900-01-01")) return true;
                            const ds = format(d, 'yyyy-MM-dd');
                            return bookedDatesForTour.has(ds);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {selectedDateAlreadyBooked && (
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800 font-medium">You've already booked this date. Please pick a different one.</p>
                      </div>
                    )}
                    {capacityError && !selectedDateAlreadyBooked && (
                      <p className="text-sm text-destructive font-medium">{capacityError}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label>Travelers</Label>
                    <div className="flex items-center">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-12 h-12 rounded-r-none border-r-0"
                        onClick={() => setParticipants(Math.max(1, participants - 1))}
                      >
                        -
                      </Button>
                      <div className="h-12 flex-1 flex items-center justify-center border-y border-border font-medium">
                        {participants} <Users className="w-4 h-4 ml-2 text-muted-foreground" />
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-12 h-12 rounded-l-none border-l-0"
                        onClick={() => setParticipants(Math.min(tour.maxParticipants || 99, participants + 1))}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 md:p-8 rounded-2xl shadow-sm border border-border">
                <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">2</span>
                  Lead Traveler Details
                </h2>
                
                {!user ? (
                  <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl">
                    <p className="mb-4">You need to be logged in to complete a booking.</p>
                    <Button type="button" onClick={() => setLocation(`/login?redirect=/checkout/${tourId}`)}>
                      Log in or create account
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={user.name} disabled className="h-12 bg-muted/50" />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" value={user.email} disabled className="h-12 bg-muted/50" />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="notes">Special Requirements or Notes (Optional)</Label>
                      <Input 
                        id="notes" 
                        value={notes} 
                        onChange={(e) => setNotes(e.target.value)} 
                        className="h-12"
                        placeholder="Dietary requirements, accessibility needs, etc."
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-card p-6 md:p-8 rounded-2xl shadow-sm border border-border">
                <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">3</span>
                  Payment Method
                </h2>
                
                <div className="bg-muted/50 border border-border p-6 rounded-xl text-center space-y-4">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto" />
                  <h3 className="font-semibold text-lg">Secure Payment Demo</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    This is a demo marketplace. Clicking "Confirm Booking" will create a confirmed booking without actually charging a card.
                  </p>
                </div>
              </div>

            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
                <div className="relative h-48">
                  <img src={tour.coverImage} alt={tour.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="font-serif font-bold text-xl line-clamp-2">{tour.title}</h3>
                  </div>
                </div>
                
                <div className="p-6 md:p-8 space-y-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{date ? format(date, "MMM dd, yyyy") : 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Travelers</span>
                    <span className="font-medium">{participants} {participants === 1 ? 'person' : 'people'}</span>
                  </div>
                  
                  <div className="border-t border-border pt-6 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">${pricePerPerson} x {participants}</span>
                      <span className="font-medium">${totalPrice}</span>
                    </div>
                    {tour.discountPrice && (
                      <div className="flex justify-between text-green-600 text-sm">
                        <span>Discount applied</span>
                        <span>-${(tour.price - tour.discountPrice) * participants}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border pt-6 flex justify-between items-end">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-3xl text-primary">${totalPrice}</span>
                  </div>

                  <Button 
                    type="submit"
                    className="w-full h-14 text-lg bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl"
                    disabled={createBookingMutation.isPending || selectedDateAlreadyBooked}
                  >
                    {createBookingMutation.isPending ? 'Processing...' : 'Confirm Booking'}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    Secure booking via WavesOfEgypt
                  </div>
                </div>
              </div>
            </div>

          </form>
        </div>
      </div>
    </Layout>
  );
}
