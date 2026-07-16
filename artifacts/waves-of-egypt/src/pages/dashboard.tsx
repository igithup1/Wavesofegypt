import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useListBookings } from '@workspace/api-client-react';
import Layout from '@/components/layout/Layout';
import { format } from 'date-fns';
import { MapPin, Calendar, Users, CreditCard, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: bookingsData, isLoading: isBookingsLoading } = useListBookings(
    {}, 
    { query: { enabled: !!user } }
  );

  React.useEffect(() => {
    if (!isAuthLoading && !user) {
      setLocation('/login');
    }
    // Redirect admin/vendor to their respective dashboards
    if (user?.role === 'admin') setLocation('/admin');
    if (user?.role === 'vendor') setLocation('/vendor');
  }, [user, isAuthLoading, setLocation]);

  if (isAuthLoading || isBookingsLoading || !user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="h-8 bg-muted animate-pulse rounded w-1/4 mb-12"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 h-64 bg-muted animate-pulse rounded-2xl"></div>
            <div className="lg:col-span-3 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const upcomingBookings = bookingsData?.tours?.filter(b => 
    b.status === 'confirmed' || b.status === 'pending'
  ) || [];
  
  const pastBookings = bookingsData?.tours?.filter(b => 
    b.status === 'completed' || b.status === 'cancelled'
  ) || [];

  return (
    <Layout>
      <div className="bg-primary pt-32 pb-16 text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-2">Welcome back, {user.name}</h1>
          <p className="text-primary-foreground/80">Manage your bookings and preferences</p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6 sticky top-24">
              <div className="flex flex-col items-center text-center pb-6 border-b border-border">
                <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-serif font-bold mb-4">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <h2 className="font-bold text-lg">{user.name}</h2>
                <p className="text-muted-foreground text-sm">{user.email}</p>
                <div className="mt-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                  {user.role} Account
                </div>
              </div>
              
              <div className="py-6 space-y-2">
                <Link href="/dashboard" className="flex items-center justify-between p-3 rounded-lg bg-primary/5 text-primary font-medium">
                  My Bookings
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link href="/wishlist" className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-foreground">
                  My Wishlist
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link href="/settings" className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-foreground">
                  Account Settings
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-3 space-y-12">
            
            <section>
              <h2 className="text-2xl font-serif font-bold mb-6">Upcoming Adventures</h2>
              
              {upcomingBookings.length > 0 ? (
                <div className="space-y-4">
                  {upcomingBookings.map(booking => (
                    <div key={booking.id} className="bg-card flex flex-col sm:flex-row border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="sm:w-48 h-48 sm:h-auto shrink-0 relative">
                        <img 
                          src={booking.tourCoverImage || '/placeholder-tour.jpg'} 
                          alt={booking.tourTitle || 'Tour'} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                            booking.status === 'confirmed' ? 'bg-green-500/90 text-white' : 'bg-yellow-500/90 text-white'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <Link href={`/tours/${booking.tourId}`} className="text-xl font-serif font-bold hover:text-primary transition-colors line-clamp-1 mb-2">
                            {booking.tourTitle}
                          </Link>
                          
                          <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              {format(new Date(booking.date), 'MMM dd, yyyy')}
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-primary" />
                              {booking.participants} Travelers
                            </div>
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-primary" />
                              ${booking.totalPrice} Total
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 mt-4">
                          <Button variant="outline" size="sm">Manage Booking</Button>
                          <Button size="sm">View Details</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-muted/30 border border-border rounded-2xl p-12 text-center">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No upcoming trips</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    You don't have any upcoming experiences booked. Start planning your next Egyptian adventure!
                  </p>
                  <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link href="/tours">Explore Experiences</Link>
                  </Button>
                </div>
              )}
            </section>

            {pastBookings.length > 0 && (
              <section>
                <h2 className="text-2xl font-serif font-bold mb-6">Past Trips</h2>
                <div className="space-y-4 opacity-75">
                  {pastBookings.map(booking => (
                    <div key={booking.id} className="bg-card flex flex-col sm:flex-row border border-border rounded-2xl overflow-hidden">
                      <div className="sm:w-40 h-32 sm:h-auto shrink-0 bg-muted">
                        <img 
                          src={booking.tourCoverImage || '/placeholder-tour.jpg'} 
                          alt={booking.tourTitle || 'Tour'} 
                          className="w-full h-full object-cover grayscale"
                        />
                      </div>
                      
                      <div className="p-4 md:p-6 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="font-bold mb-1 line-clamp-1">{booking.tourTitle}</h3>
                          <div className="text-sm text-muted-foreground flex gap-4">
                            <span>{format(new Date(booking.date), 'MMM dd, yyyy')}</span>
                            <span className="capitalize">{booking.status}</span>
                          </div>
                        </div>
                        
                        {booking.status === 'completed' && (
                          <Button variant="outline" size="sm">Leave a Review</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
}
