import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGetAdminDashboard, useListBookings, useUpdateBooking, useListReviews, getListReviewsQueryKey, getGetTourQueryKey } from '@workspace/api-client-react';
import Layout from '@/components/layout/Layout';
import { Link, useLocation } from 'wouter';
import { Users, Building2, Map, CreditCard, Activity, ChevronDown, Calendar, Filter, RefreshCw, BarChart3, Mail, CheckCircle2, XCircle, Send, Star, Trash2, MessageSquare, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { getListBookingsQueryKey } from '@workspace/api-client-react';
import type { Booking } from '@workspace/api-client-react';

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
type TabKey = 'overview' | 'bookings' | 'tours' | 'reviews' | 'email';

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending:   'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
};

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function StatusSelect({
  bookingId,
  currentStatus,
  onSuccess,
}: {
  bookingId: number;
  currentStatus: BookingStatus;
  onSuccess: () => void;
}) {
  const { mutate, isPending } = useUpdateBooking();
  const [value, setValue] = React.useState<BookingStatus>(currentStatus);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as BookingStatus;
    setValue(next);
    mutate(
      { id: bookingId, data: { status: next } },
      {
        onSuccess,
        onError: () => setValue(currentStatus),
      }
    );
  };

  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={handleChange}
        disabled={isPending}
        className={`appearance-none pr-8 pl-3 py-1.5 text-xs font-semibold rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${STATUS_COLORS[value]} ${isPending ? 'opacity-60 cursor-wait' : ''}`}
      >
        {Object.entries(STATUS_LABELS).map(([v, label]) => (
          <option key={v} value={v}>{label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60" />
    </div>
  );
}

export default function AdminDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = React.useState<TabKey>('overview');
  const [statusFilter, setStatusFilter] = React.useState<BookingStatus | 'all'>('all');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [page, setPage] = React.useState(0);
  const PAGE_SIZE = 25;

  // Reset to page 0 when filters change
  React.useEffect(() => { setPage(0); }, [statusFilter, dateFrom, dateTo]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: dashboard, isLoading: isDashLoading } = useGetAdminDashboard({
    query: { enabled: !!user && user.role === 'admin' } as any,
  });

  // Paginated bookings query — uses server-side date + status filtering
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allBookings, isLoading: isBookingsLoading, refetch: refetchBookings, dataUpdatedAt } = useListBookings(
    {
      status: statusFilter !== 'all' ? statusFilter : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    },
    {
      query: {
        enabled: !!user && user.role === 'admin',
        // Auto-poll every 30 s while an active tab that shows bookings is open
        refetchInterval: (activeTab === 'overview' || activeTab === 'bookings' || activeTab === 'tours') ? 30_000 : false,
        refetchIntervalInBackground: false,
      } as any,
    }
  );

  // Separate unfiltered query for the tours breakdown tab (no date/status filter)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allBookingsForTours, isLoading: isToursLoading } = useListBookings(
    { limit: 500 },
    {
      query: {
        enabled: !!user && user.role === 'admin' && activeTab === 'tours',
      } as any,
    }
  );

  // Tick every second so the "Last updated X s ago" label stays live
  const [, tick] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, []);

  const secondsAgo = dataUpdatedAt ? Math.floor((Date.now() - dataUpdatedAt) / 1_000) : null;
  const lastUpdatedLabel = (() => {
    if (secondsAgo === null) return null;
    if (secondsAgo < 5) return 'just now';
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    return `${Math.floor(secondsAgo / 60)}m ago`;
  })();

  React.useEffect(() => {
    if (!isAuthLoading) {
      if (!user) setLocation('/login');
      else if (user.role !== 'admin') setLocation('/');
    }
  }, [user, isAuthLoading, setLocation]);

  const handleStatusUpdate = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
    refetchBookings();
  }, [queryClient, refetchBookings]);

  // Server-side filtering is applied via query params; allBookings is already filtered
  const filteredBookings = (allBookings ?? []) as Booking[];
  const isLastPage = filteredBookings.length < PAGE_SIZE;

  // Booking counts per tour — uses the separate unfiltered query for accuracy
  const tourBreakdown = React.useMemo(() => {
    const source = (allBookingsForTours ?? []) as Booking[];
    if (source.length === 0) return [];
    const map: Record<string, { tourId: number; tourTitle: string; counts: Record<string, number>; total: number; revenue: number }> = {};
    source.forEach(b => {
      const key = String(b.tourId);
      if (!map[key]) {
        map[key] = { tourId: b.tourId, tourTitle: b.tourTitle ?? `Tour #${b.tourId}`, counts: {}, total: 0, revenue: 0 };
      }
      map[key].counts[b.status] = (map[key].counts[b.status] ?? 0) + 1;
      map[key].total += 1;
      map[key].revenue += b.totalPrice;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [allBookingsForTours]);

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

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
    { key: 'bookings', label: 'Bookings', icon: <CreditCard className="w-4 h-4" /> },
    { key: 'tours',    label: 'By Tour',  icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'reviews',  label: 'Reviews',  icon: <Star className="w-4 h-4" /> },
    { key: 'email',    label: 'Email',    icon: <Mail className="w-4 h-4" /> },
  ];

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

          {/* Tabs */}
          <div className="flex gap-1 mt-10 border-b border-primary-foreground/20">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-t-lg transition-all -mb-px border-b-2 ${
                  activeTab === tab.key
                    ? 'bg-background text-foreground border-background'
                    : 'text-primary-foreground/70 border-transparent hover:text-primary-foreground hover:bg-primary-foreground/10'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12">

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <>
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
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <h2 className="text-xl font-serif font-bold">Recent Platform Activity</h2>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    View all →
                  </button>
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
                        <StatusBadge status={booking.status as BookingStatus} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── BOOKINGS TAB ── */}
        {activeTab === 'bookings' && (
          <div>
            {/* Filter bar */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-5 mb-6 flex flex-wrap items-end gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filters</span>
              </div>

              {/* Status filter */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as BookingStatus | 'all')}
                  className="text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="all">All statuses</option>
                  {Object.entries(STATUS_LABELS).map(([v, label]) => (
                    <option key={v} value={v}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Date from */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Tour date from</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="text-sm border border-input rounded-lg pl-9 pr-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Date to */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Tour date to</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    className="text-sm border border-input rounded-lg pl-9 pr-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Clear */}
              {(statusFilter !== 'all' || dateFrom || dateTo) && (
                <button
                  onClick={() => { setStatusFilter('all'); setDateFrom(''); setDateTo(''); setPage(0); }}
                  className="text-xs text-muted-foreground hover:text-foreground underline self-end pb-2"
                >
                  Clear filters
                </button>
              )}

              <div className="ml-auto flex flex-col items-end gap-1">
                <button
                  onClick={() => refetchBookings()}
                  disabled={isBookingsLoading}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 bg-background hover:bg-muted/30 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBookingsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                {lastUpdatedLabel && (
                  <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">
                    Updated {lastUpdatedLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Results summary */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {isBookingsLoading ? (
                  'Loading…'
                ) : (
                  <>
                    Page <span className="font-semibold text-foreground">{page + 1}</span>
                    {' · '}
                    <span className="font-semibold text-foreground">{filteredBookings.length}</span> booking{filteredBookings.length !== 1 ? 's' : ''} on this page
                    {statusFilter !== 'all' && <span> · status: <span className="font-medium capitalize">{statusFilter}</span></span>}
                    {(dateFrom || dateTo) && <span> · date filtered</span>}
                  </>
                )}
              </p>
            </div>

            {/* Table */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              {isBookingsLoading ? (
                <div className="p-12 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No bookings found</p>
                  <p className="text-sm mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-6 py-4 font-medium">ID</th>
                        <th className="px-6 py-4 font-medium">Tour</th>
                        <th className="px-6 py-4 font-medium">Traveler</th>
                        <th className="px-6 py-4 font-medium">Tour Date</th>
                        <th className="px-6 py-4 font-medium text-right">Participants</th>
                        <th className="px-6 py-4 font-medium text-right">Total</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium text-muted-foreground/60">Booked</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredBookings.map(booking => (
                        <tr key={booking.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                            WOE-{String(booking.id).padStart(5, '0')}
                          </td>
                          <td className="px-6 py-4 font-medium max-w-[180px] truncate" title={booking.tourTitle ?? ''}>
                            <Link href={`/tours/${booking.tourId}`} className="hover:text-primary transition-colors">
                              {booking.tourTitle ?? `Tour #${booking.tourId}`}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {booking.userName ?? `User #${booking.userId}`}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                            {format(new Date(booking.date), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 text-right font-medium">
                            {booking.participants}
                          </td>
                          <td className="px-6 py-4 text-right font-bold">
                            ${booking.totalPrice.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <StatusSelect
                              bookingId={booking.id}
                              currentStatus={booking.status as BookingStatus}
                              onSuccess={handleStatusUpdate}
                            />
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground/60 whitespace-nowrap">
                            {format(new Date(booking.createdAt), 'MMM dd, yyyy')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination controls */}
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0 || isBookingsLoading}
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <span className="text-sm text-muted-foreground">Page {page + 1}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={isLastPage || isBookingsLoading}
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── TOURS TAB ── */}
        {activeTab === 'tours' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-serif font-bold mb-1">Booking Counts by Tour</h2>
              <p className="text-muted-foreground text-sm">How many bookings each tour has received, broken down by status</p>
            </div>

            {isToursLoading ? (
              <div className="p-12 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : tourBreakdown.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Map className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No booking data yet</p>
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-6 py-4 font-medium">Tour</th>
                        <th className="px-6 py-4 font-medium text-center">Total</th>
                        <th className="px-6 py-4 font-medium text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${STATUS_COLORS.pending}`}>Pending</span>
                        </th>
                        <th className="px-6 py-4 font-medium text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${STATUS_COLORS.confirmed}`}>Confirmed</span>
                        </th>
                        <th className="px-6 py-4 font-medium text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${STATUS_COLORS.completed}`}>Completed</span>
                        </th>
                        <th className="px-6 py-4 font-medium text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${STATUS_COLORS.cancelled}`}>Cancelled</span>
                        </th>
                        <th className="px-6 py-4 font-medium text-right">Revenue</th>
                        <th className="px-6 py-4 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {tourBreakdown.map(tour => {
                        const maxTotal = tourBreakdown[0].total;
                        const pct = Math.round((tour.total / maxTotal) * 100);
                        return (
                          <tr key={tour.tourId} className="hover:bg-muted/20 transition-colors">
                            <td className="px-6 py-4 font-medium">
                              <div>
                                <Link href={`/tours/${tour.tourId}`} className="hover:text-primary transition-colors">
                                  {tour.tourTitle}
                                </Link>
                                <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden w-32">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-lg">{tour.total}</td>
                            <td className="px-6 py-4 text-center text-muted-foreground">{tour.counts.pending ?? 0}</td>
                            <td className="px-6 py-4 text-center text-emerald-700 font-medium">{tour.counts.confirmed ?? 0}</td>
                            <td className="px-6 py-4 text-center text-blue-700 font-medium">{tour.counts.completed ?? 0}</td>
                            <td className="px-6 py-4 text-center text-red-600 font-medium">{tour.counts.cancelled ?? 0}</td>
                            <td className="px-6 py-4 text-right font-bold">${tour.revenue.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => { setStatusFilter('all'); setDateFrom(''); setDateTo(''); setPage(0); setActiveTab('bookings'); }}
                                className="text-xs text-primary hover:underline whitespace-nowrap"
                              >
                                View bookings →
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-muted/30 border-t-2 border-border">
                      <tr>
                        <td className="px-6 py-4 font-bold text-muted-foreground">Grand Total</td>
                        <td className="px-6 py-4 text-center font-bold">{tourBreakdown.reduce((s, t) => s + t.total, 0)}</td>
                        <td className="px-6 py-4 text-center">{tourBreakdown.reduce((s, t) => s + (t.counts.pending ?? 0), 0)}</td>
                        <td className="px-6 py-4 text-center">{tourBreakdown.reduce((s, t) => s + (t.counts.confirmed ?? 0), 0)}</td>
                        <td className="px-6 py-4 text-center">{tourBreakdown.reduce((s, t) => s + (t.counts.completed ?? 0), 0)}</td>
                        <td className="px-6 py-4 text-center">{tourBreakdown.reduce((s, t) => s + (t.counts.cancelled ?? 0), 0)}</td>
                        <td className="px-6 py-4 text-right font-bold">${tourBreakdown.reduce((s, t) => s + t.revenue, 0).toLocaleString()}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        {/* ── REVIEWS TAB ── */}
        {activeTab === 'reviews' && (
          <ReviewsPanel />
        )}

        {/* ── EMAIL SETTINGS TAB ── */}
        {activeTab === 'email' && (
          <EmailSettingsPanel adminEmail={user?.email ?? ''} />
        )}

      </div>
    </Layout>
  );
}

// ── Reviews Moderation Panel ─────────────────────────────────────────────────

function ReviewsPanel() {
  const queryClient = useQueryClient();
  const [tourIdFilter, setTourIdFilter] = React.useState('');
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editRating, setEditRating] = React.useState(5);
  const [editComment, setEditComment] = React.useState('');
  const [actionResult, setActionResult] = React.useState<{ ok: boolean; message: string } | null>(null);

  const parsedTourId = tourIdFilter ? parseInt(tourIdFilter, 10) : undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reviews, isLoading, refetch } = useListReviews(
    { tourId: parsedTourId, limit: 100 } as any,
    { query: { enabled: true } } as any,
  );

  const handleDelete = async (reviewId: number, tourId: number) => {
    if (!confirm('Delete this review? This will recalculate the tour rating immediately.')) return;
    setDeletingId(reviewId);
    setActionResult(null);
    try {
      const token = localStorage.getItem('auth_token');
      const resp = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await resp.json();
      if (resp.ok) {
        setActionResult({ ok: true, message: 'Review deleted and tour rating recalculated.' });
        // Invalidate reviews list and the specific tour so the tour page updates immediately
        queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTourQueryKey(tourId) });
        refetch();
      } else {
        setActionResult({ ok: false, message: data.error ?? 'Failed to delete review.' });
      }
    } catch {
      setActionResult({ ok: false, message: 'Network error.' });
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (review: { id: number; rating: number; comment?: string | null }) => {
    setEditingId(review.id);
    setEditRating(Math.round(review.rating));
    setEditComment(review.comment ?? '');
    setActionResult(null);
  };

  const handleEdit = async (reviewId: number, tourId: number) => {
    setActionResult(null);
    try {
      const token = localStorage.getItem('auth_token');
      const resp = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ rating: editRating, comment: editComment }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setActionResult({ ok: true, message: 'Review updated and tour rating recalculated.' });
        setEditingId(null);
        // Invalidate reviews list and the specific tour so the tour page updates immediately
        queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTourQueryKey(tourId) });
        refetch();
      } else {
        setActionResult({ ok: false, message: data.error ?? 'Failed to update review.' });
      }
    } catch {
      setActionResult({ ok: false, message: 'Network error.' });
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold mb-1">Review Moderation</h2>
          <p className="text-muted-foreground text-sm">Delete or edit traveler reviews. Rating and count recalculate automatically.</p>
        </div>
        <div className="ml-auto flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Filter by Tour ID</label>
            <input
              type="number"
              value={tourIdFilter}
              onChange={e => setTourIdFilter(e.target.value)}
              placeholder="Any tour"
              className="text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 w-32"
            />
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 bg-background hover:bg-muted/30 transition-all self-end"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {actionResult && (
        <div className={`mb-4 flex items-start gap-3 p-4 rounded-xl border text-sm ${actionResult.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {actionResult.ok
            ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
            : <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
          }
          {actionResult.message}
        </div>
      )}

      {isLoading ? (
        <div className="p-12 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !reviews || reviews.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No reviews found</p>
          {tourIdFilter && <p className="text-sm mt-1">Try clearing the tour ID filter</p>}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">ID</th>
                  <th className="px-6 py-4 font-medium">Tour</th>
                  <th className="px-6 py-4 font-medium">Reviewer</th>
                  <th className="px-6 py-4 font-medium">Rating</th>
                  <th className="px-6 py-4 font-medium">Comment</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(reviews as unknown as Array<{ id: number; tourId: number; tourTitle?: string | null; name?: string | null; country?: string | null; rating: number; comment?: string | null; createdAt: string }>).map(review => (
                  <React.Fragment key={review.id}>
                    <tr className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">#{review.id}</td>
                      <td className="px-6 py-4 max-w-[160px]">
                        <Link href={`/tours/${review.tourId}`} className="hover:text-primary transition-colors font-medium truncate block" title={review.tourTitle ?? `Tour #${review.tourId}`}>
                          {review.tourTitle ?? `Tour #${review.tourId}`}
                        </Link>
                        <span className="text-xs text-muted-foreground">ID {review.tourId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{review.name ?? 'Anonymous'}</p>
                        {review.country && <p className="text-xs text-muted-foreground">{review.country}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(review.rating) ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                          ))}
                          <span className="ml-1 text-xs text-muted-foreground">{review.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-[240px]">
                        <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">{review.comment ?? <em>No comment</em>}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(review)}
                            disabled={deletingId === review.id}
                            title="Edit review"
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors disabled:opacity-40"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(review.id, review.tourId)}
                            disabled={deletingId === review.id}
                            title="Delete review"
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-40"
                          >
                            {deletingId === review.id
                              ? <RefreshCw className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                    {editingId === review.id && (
                      <tr className="bg-blue-50/60 border-t border-blue-100">
                        <td colSpan={7} className="px-6 py-5">
                          <div className="flex flex-wrap items-end gap-4">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Rating</label>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <button key={s} type="button" onClick={() => setEditRating(s)} className="p-0.5">
                                    <Star className={`w-6 h-6 transition-colors ${s <= editRating ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="flex-1 min-w-[200px]">
                              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Comment</label>
                              <textarea
                                value={editComment}
                                onChange={e => setEditComment(e.target.value)}
                                rows={2}
                                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                              />
                            </div>
                            <div className="flex gap-2 self-end">
                              <button
                                onClick={() => handleEdit(review.id, review.tourId)}
                                className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted/30 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-border text-xs text-muted-foreground bg-muted/20">
            {reviews.length} review{reviews.length !== 1 ? 's' : ''} shown
          </div>
        </div>
      )}
    </div>
  );
}

// ── Email Settings Panel ──────────────────────────────────────────────────────

interface SmtpStatus {
  configured: boolean;
  smtpHost: string | null;
  smtpUser: string | null;
  smtpPort: string;
  smtpFrom: string;
  sentTo?: string;
  message?: string;
  error?: string;
}

function EmailSettingsPanel({ adminEmail }: { adminEmail: string }) {
  const [status, setStatus] = React.useState<SmtpStatus | null>(null);
  const [isSending, setIsSending] = React.useState(false);
  const [result, setResult] = React.useState<{ ok: boolean; message: string } | null>(null);

  // Load SMTP status on mount by calling the test endpoint in dry-run mode
  React.useEffect(() => {
    const token = localStorage.getItem('auth_token');
    fetch('/api/admin/email-status', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then((data: SmtpStatus) => setStatus(data))
      .catch(() => setStatus(null));
  }, []);

  const handleSendTest = async () => {
    setIsSending(true);
    setResult(null);
    try {
      const token = localStorage.getItem('auth_token');
      const resp = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await resp.json();
      if (resp.ok) {
        setResult({ ok: true, message: data.message ?? `Test email sent to ${data.sentTo}.` });
        setStatus(data);
      } else {
        setResult({ ok: false, message: data.error ?? 'Failed to send test email.' });
        setStatus(data);
      }
    } catch {
      setResult({ ok: false, message: 'Network error — could not reach the server.' });
    } finally {
      setIsSending(false);
    }
  };

  const isConfigured = status?.configured ?? false;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-bold mb-1">Email Configuration</h2>
        <p className="text-muted-foreground text-sm">
          Booking confirmation emails are sent via SMTP. Use the test below to verify delivery is working.
        </p>
      </div>

      {/* Status card */}
      <div className={`rounded-2xl border p-6 mb-6 ${isConfigured ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-start gap-4">
          {isConfigured
            ? <CheckCircle2 className="w-6 h-6 text-emerald-600 mt-0.5 shrink-0" />
            : <XCircle className="w-6 h-6 text-amber-500 mt-0.5 shrink-0" />
          }
          <div>
            <p className={`font-semibold text-sm ${isConfigured ? 'text-emerald-800' : 'text-amber-800'}`}>
              {isConfigured ? 'SMTP is configured — emails will send' : 'SMTP is not fully configured'}
            </p>
            <p className={`text-xs mt-1 ${isConfigured ? 'text-emerald-700' : 'text-amber-700'}`}>
              {isConfigured
                ? 'All required credentials are present. Click "Send test email" to confirm delivery.'
                : 'Set SMTP_HOST, SMTP_USER, and SMTP_PASS in the Replit Secrets panel to enable emails.'}
            </p>
          </div>
        </div>
      </div>

      {/* Config details */}
      {status && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Current settings</h3>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <dt className="text-xs font-medium text-muted-foreground mb-0.5">SMTP Host</dt>
              <dd className="font-mono font-medium">{status.smtpHost ?? <span className="text-destructive italic">not set</span>}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground mb-0.5">SMTP Port</dt>
              <dd className="font-mono font-medium">{status.smtpPort}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground mb-0.5">SMTP User</dt>
              <dd className="font-mono font-medium">{status.smtpUser ?? <span className="text-destructive italic">not set</span>}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground mb-0.5">From Address</dt>
              <dd className="font-mono font-medium">{status.smtpFrom}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground mb-0.5">Password</dt>
              <dd className="font-medium">{status.configured ? '••••••••' : <span className="text-destructive italic">not set</span>}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Send test button */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        <h3 className="text-sm font-semibold mb-1">Send a test email</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Sends a sample booking confirmation to <span className="font-medium text-foreground">{adminEmail}</span>.
        </p>
        <button
          onClick={handleSendTest}
          disabled={isSending || !isConfigured}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className={`w-4 h-4 ${isSending ? 'animate-pulse' : ''}`} />
          {isSending ? 'Sending…' : 'Send test email'}
        </button>

        {!isConfigured && (
          <p className="text-xs text-muted-foreground mt-3">
            Configure SMTP credentials above to enable test sending.
          </p>
        )}

        {result && (
          <div className={`mt-4 flex items-start gap-3 p-4 rounded-xl border text-sm ${result.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {result.ok
              ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
              : <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
            }
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}
