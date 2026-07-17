import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGetAdminDashboard, useListBookings, useUpdateBooking } from '@workspace/api-client-react';
import Layout from '@/components/layout/Layout';
import { Link, useLocation } from 'wouter';
import { Users, Building2, Map, CreditCard, Activity, ChevronDown, Calendar, Filter, RefreshCw, BarChart3, Mail, CheckCircle2, XCircle, Send } from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { getListBookingsQueryKey } from '@workspace/api-client-react';
import type { Booking } from '@workspace/api-client-react';

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
type TabKey = 'overview' | 'bookings' | 'tours' | 'email';

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
  const [limit] = React.useState(100);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: dashboard, isLoading: isDashLoading } = useGetAdminDashboard({
    query: { enabled: !!user && user.role === 'admin' } as any,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allBookings, isLoading: isBookingsLoading, refetch: refetchBookings, dataUpdatedAt } = useListBookings(
    { limit },
    {
      query: {
        enabled: !!user && user.role === 'admin',
        // Auto-poll every 30 s while an active tab that shows bookings is open
        refetchInterval: (activeTab === 'overview' || activeTab === 'bookings' || activeTab === 'tours') ? 30_000 : false,
        refetchIntervalInBackground: false,
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

  // Client-side filtering
  const filteredBookings = React.useMemo<Booking[]>(() => {
    if (!allBookings) return [];
    let result = allBookings as Booking[];

    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter);
    }

    if (dateFrom) {
      const from = startOfDay(parseISO(dateFrom));
      result = result.filter(b => {
        const d = new Date(b.date);
        return d >= from;
      });
    }

    if (dateTo) {
      const to = endOfDay(parseISO(dateTo));
      result = result.filter(b => {
        const d = new Date(b.date);
        return d <= to;
      });
    }

    return result;
  }, [allBookings, statusFilter, dateFrom, dateTo]);

  // Booking counts per tour
  const tourBreakdown = React.useMemo(() => {
    if (!allBookings) return [];
    const map: Record<string, { tourId: number; tourTitle: string; counts: Record<string, number>; total: number; revenue: number }> = {};
    (allBookings as Booking[]).forEach(b => {
      const key = String(b.tourId);
      if (!map[key]) {
        map[key] = { tourId: b.tourId, tourTitle: b.tourTitle ?? `Tour #${b.tourId}`, counts: {}, total: 0, revenue: 0 };
      }
      map[key].counts[b.status] = (map[key].counts[b.status] ?? 0) + 1;
      map[key].total += 1;
      map[key].revenue += b.totalPrice;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [allBookings]);

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
    { key: 'bookings', label: `Bookings${allBookings ? ` (${allBookings.length})` : ''}`, icon: <CreditCard className="w-4 h-4" /> },
    { key: 'tours',    label: 'By Tour',  icon: <BarChart3 className="w-4 h-4" /> },
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
                  onClick={() => { setStatusFilter('all'); setDateFrom(''); setDateTo(''); }}
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
                Showing <span className="font-semibold text-foreground">{filteredBookings.length}</span> booking{filteredBookings.length !== 1 ? 's' : ''}
                {statusFilter !== 'all' && <span> · status: <span className="font-medium capitalize">{statusFilter}</span></span>}
                {(dateFrom || dateTo) && <span> · date filtered</span>}
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

            {/* Status summary pills */}
            {allBookings && allBookings.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-3">
                {(Object.keys(STATUS_LABELS) as BookingStatus[]).map(s => {
                  const count = (allBookings as Booking[]).filter(b => b.status === s).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        statusFilter === s
                          ? STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-primary/30'
                          : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/60'
                      }`}
                    >
                      {STATUS_LABELS[s]}
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${statusFilter === s ? 'bg-white/50' : 'bg-muted'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
                <span className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground">
                  Total revenue: <span className="font-bold text-foreground">${(allBookings as Booking[]).reduce((s, b) => s + b.totalPrice, 0).toLocaleString()}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── TOURS TAB ── */}
        {activeTab === 'tours' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-serif font-bold mb-1">Booking Counts by Tour</h2>
              <p className="text-muted-foreground text-sm">How many bookings each tour has received, broken down by status</p>
            </div>

            {isBookingsLoading ? (
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
                                onClick={() => { setStatusFilter('all'); setDateFrom(''); setDateTo(''); setActiveTab('bookings'); }}
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
        {/* ── EMAIL SETTINGS TAB ── */}
        {activeTab === 'email' && (
          <EmailSettingsPanel adminEmail={user?.email ?? ''} />
        )}

      </div>
    </Layout>
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
