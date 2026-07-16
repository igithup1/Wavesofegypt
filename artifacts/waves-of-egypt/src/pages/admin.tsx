import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGetAdminDashboard } from '@workspace/api-client-react';
import Layout from '@/components/layout/Layout';
import { Link, useLocation } from 'wouter';
import { Users, Building2, Map, CreditCard, Activity } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: dashboard, isLoading: isDashLoading } = useGetAdminDashboard({
    query: { enabled: !!user && user.role === 'admin' }
  });

  React.useEffect(() => {
    if (!isAuthLoading) {
      if (!user) setLocation('/login');
      else if (user.role !== 'admin') setLocation('/');
    }
  }, [user, isAuthLoading, setLocation]);

  if (isAuthLoading || isDashLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="h-8 bg-muted animate-pulse rounded w-1/4 mb-12"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl"></div>
            ))}
          </div>
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
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold uppercase tracking-wider mb-4">
                Admin Console
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-2">Platform Overview</h1>
              <p className="text-primary-foreground/80">Manage marketplace operations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <Users className="w-8 h-8 text-primary mb-4" />
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Users</p>
            <h3 className="text-3xl font-bold">{dashboard?.totalUsers || 0}</h3>
            {dashboard?.newUsersThisMonth && (
              <p className="text-xs text-green-500 mt-2 font-medium">+{dashboard.newUsersThisMonth} this month</p>
            )}
          </div>
          
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <Building2 className="w-8 h-8 text-primary mb-4" />
            <p className="text-sm font-medium text-muted-foreground mb-1">Vendors</p>
            <h3 className="text-3xl font-bold">{dashboard?.totalVendors || 0}</h3>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <Map className="w-8 h-8 text-primary mb-4" />
            <p className="text-sm font-medium text-muted-foreground mb-1">Tours</p>
            <h3 className="text-3xl font-bold">{dashboard?.totalTours || 0}</h3>
          </div>
          
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <Activity className="w-8 h-8 text-primary mb-4" />
            <p className="text-sm font-medium text-muted-foreground mb-1">Bookings</p>
            <h3 className="text-3xl font-bold">{dashboard?.totalBookings || 0}</h3>
            {dashboard?.bookingsThisMonth && (
              <p className="text-xs text-green-500 mt-2 font-medium">+{dashboard.bookingsThisMonth} this month</p>
            )}
          </div>
          
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm bg-primary text-primary-foreground border-none">
            <CreditCard className="w-8 h-8 text-primary-foreground/80 mb-4" />
            <p className="text-sm font-medium text-primary-foreground/80 mb-1">Total Volume</p>
            <h3 className="text-3xl font-bold">${dashboard?.totalRevenue || 0}</h3>
            {dashboard?.revenueThisMonth && (
              <p className="text-xs text-accent mt-2 font-medium">+${dashboard.revenueThisMonth} this month</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Top Tours */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-serif font-bold">Top Performing Tours</h2>
            </div>
            <div className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">Tour</th>
                    <th className="px-6 py-4 font-medium">Vendor</th>
                    <th className="px-6 py-4 font-medium text-right">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard?.topTours?.map(tour => (
                    <tr key={tour.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-6 py-4 font-medium">
                        <Link href={`/tours/${tour.id}`} className="hover:text-primary transition-colors">
                          {tour.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{tour.vendorName || 'Unknown'}</td>
                      <td className="px-6 py-4 text-right font-bold text-accent">{tour.rating.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Platform Bookings */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-serif font-bold">Recent Platform Activity</h2>
            </div>
            <div className="divide-y divide-border max-h-[500px] overflow-auto">
              {dashboard?.recentBookings?.map(booking => (
                <div key={booking.id} className="p-6 hover:bg-muted/20 transition-colors flex justify-between items-center">
                  <div>
                    <h3 className="font-bold mb-1">{booking.tourTitle}</h3>
                    <p className="text-sm text-muted-foreground">Booked by {booking.userName} • {format(new Date(booking.date), 'MMM dd, yyyy')}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${booking.totalPrice}</div>
                    <div className="text-xs text-muted-foreground uppercase mt-1">{booking.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
