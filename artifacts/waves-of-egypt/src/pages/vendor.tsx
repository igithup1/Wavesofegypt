import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGetVendorDashboard, useListVendorTours } from '@workspace/api-client-react';
import Layout from '@/components/layout/Layout';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { PlusCircle, TrendingUp, Users, Calendar, DollarSign, Star } from 'lucide-react';
import { format } from 'date-fns';

export default function VendorDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: dashboard, isLoading: isDashLoading } = useGetVendorDashboard({
    query: { enabled: !!user && user.role === 'vendor' }
  });

  const { data: toursData, isLoading: isToursLoading } = useListVendorTours({
    query: { enabled: !!user && user.role === 'vendor' }
  });

  React.useEffect(() => {
    if (!isAuthLoading) {
      if (!user) setLocation('/login');
      else if (user.role !== 'vendor') setLocation('/');
    }
  }, [user, isAuthLoading, setLocation]);

  if (isAuthLoading || isDashLoading || isToursLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="h-8 bg-muted animate-pulse rounded w-1/4 mb-12"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl"></div>
            ))}
          </div>
          <div className="h-96 bg-muted animate-pulse rounded-2xl"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-primary pt-32 pb-16 text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-2">Vendor Dashboard</h1>
              <p className="text-primary-foreground/80">Manage your experiences and bookings</p>
            </div>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/vendor/tours/new">
                <PlusCircle className="w-4 h-4 mr-2" /> Add New Tour
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
              <h3 className="text-3xl font-bold">${dashboard?.totalRevenue || 0}</h3>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Bookings</p>
              <h3 className="text-3xl font-bold">{dashboard?.totalBookings || 0}</h3>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Active Tours</p>
              <h3 className="text-3xl font-bold">{dashboard?.totalTours || 0}</h3>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 text-accent flex items-center justify-center shrink-0">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Average Rating</p>
              <h3 className="text-3xl font-bold">{dashboard?.averageRating?.toFixed(1) || '0.0'}</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Active Tours List */}
          <div className="xl:col-span-2 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold">Your Tours</h2>
              <Link href="/vendor/tours" className="text-sm text-primary font-medium hover:underline">View All</Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">Tour Name</th>
                    <th className="px-6 py-4 font-medium">Price</th>
                    <th className="px-6 py-4 font-medium">Rating</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {toursData?.tours && toursData.tours.length > 0 ? (
                    toursData.tours.map(tour => (
                      <tr key={tour.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-6 py-4 font-medium flex items-center gap-3">
                          <img src={tour.coverImage} alt="" className="w-10 h-10 rounded object-cover" />
                          <span className="line-clamp-1">{tour.title}</span>
                        </td>
                        <td className="px-6 py-4">
                          ${tour.price}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-accent text-accent" />
                            {tour.rating.toFixed(1)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm">Edit</Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                        No tours created yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="xl:col-span-1 bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold">Recent Bookings</h2>
              <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
                {dashboard?.pendingBookings || 0} Pending
              </span>
            </div>
            
            <div className="p-0 flex-1 overflow-auto max-h-[600px]">
              {dashboard?.recentBookings && dashboard.recentBookings.length > 0 ? (
                <div className="divide-y divide-border">
                  {dashboard.recentBookings.map(booking => (
                    <div key={booking.id} className="p-6 hover:bg-muted/20 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold line-clamp-1 pr-4">{booking.tourTitle}</h3>
                        <span className="font-bold text-primary">${booking.totalPrice}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-3">
                        <p>{booking.userName} • {booking.participants} guests</p>
                        <p className="flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" /> {format(new Date(booking.date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                          booking.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600' :
                          booking.status === 'confirmed' ? 'bg-green-500/10 text-green-600' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {booking.status}
                        </span>
                        {booking.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="h-8 text-xs text-red-500 border-red-200 hover:bg-red-50">Decline</Button>
                            <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700">Confirm</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No recent bookings.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
