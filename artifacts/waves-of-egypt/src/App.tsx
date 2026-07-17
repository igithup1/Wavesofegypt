import React, { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AuthProvider } from '@/contexts/AuthContext';

// Eagerly load the home page — it's the first thing users see.
import Home from '@/pages/home';

// Lazy-load all other pages so they are code-split into separate chunks.
// This dramatically reduces the initial bundle size.
const Destinations    = lazy(() => import('@/pages/destinations'));
const DestinationDetail = lazy(() => import('@/pages/destinations/[id]'));
const Tours           = lazy(() => import('@/pages/tours'));
const TourDetail      = lazy(() => import('@/pages/tours/[id]'));
const CategoryDetail  = lazy(() => import('@/pages/categories/[slug]'));
const Checkout        = lazy(() => import('@/pages/checkout/[tourId]'));
const BookingConfirmation = lazy(() => import('@/pages/booking-confirmation'));
const Login           = lazy(() => import('@/pages/login'));
const Register        = lazy(() => import('@/pages/register'));
const Dashboard       = lazy(() => import('@/pages/dashboard'));
const VendorDashboard = lazy(() => import('@/pages/vendor'));
const AdminDashboard  = lazy(() => import('@/pages/admin'));
const Wishlist        = lazy(() => import('@/pages/wishlist'));
const MyTrip          = lazy(() => import('@/pages/my-trip'));
const About           = lazy(() => import('@/pages/about'));
const Contact         = lazy(() => import('@/pages/contact'));
const Blog            = lazy(() => import('@/pages/blog'));
const FAQ             = lazy(() => import('@/pages/faq'));
const Privacy         = lazy(() => import('@/pages/privacy'));
const Terms           = lazy(() => import('@/pages/terms'));
const NotFound        = lazy(() => import('@/pages/not-found'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// Minimal spinner shown during lazy-load transitions.
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/destinations" component={Destinations} />
        <Route path="/destinations/:id" component={DestinationDetail} />
        <Route path="/tours" component={Tours} />
        <Route path="/tours/:id" component={TourDetail} />
        <Route path="/categories/:slug" component={CategoryDetail} />
        <Route path="/checkout/:tourId" component={Checkout} />
        <Route path="/booking-confirmation" component={BookingConfirmation} />

        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />

        <Route path="/dashboard" component={Dashboard} />
        <Route path="/vendor" component={VendorDashboard} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/wishlist" component={Wishlist} />
        <Route path="/my-trip" component={MyTrip} />

        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/blog" component={Blog} />
        <Route path="/faq" component={FAQ} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />

        {/* /search shows the tours list filtered by query params */}
        <Route path="/search" component={Tours} />

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
