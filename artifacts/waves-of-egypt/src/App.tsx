import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AuthProvider } from '@/contexts/AuthContext';

// Pages
import Home from '@/pages/home';
import Destinations from '@/pages/destinations';
import DestinationDetail from '@/pages/destinations/[id]';
import Tours from '@/pages/tours';
import TourDetail from '@/pages/tours/[id]';
import CategoryDetail from '@/pages/categories/[slug]';
import Checkout from '@/pages/checkout/[tourId]';
import Login from '@/pages/login';
import Register from '@/pages/register';
import Dashboard from '@/pages/dashboard';
import VendorDashboard from '@/pages/vendor';
import AdminDashboard from '@/pages/admin';
import Wishlist from '@/pages/wishlist';
import About from '@/pages/about';
import Contact from '@/pages/contact';
import Blog from '@/pages/blog';
import FAQ from '@/pages/faq';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/destinations" component={Destinations} />
      <Route path="/destinations/:id" component={DestinationDetail} />
      <Route path="/tours" component={Tours} />
      <Route path="/tours/:id" component={TourDetail} />
      <Route path="/categories/:slug" component={CategoryDetail} />
      <Route path="/checkout/:tourId" component={Checkout} />
      
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/vendor" component={VendorDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/wishlist" component={Wishlist} />
      
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/blog" component={Blog} />
      <Route path="/faq" component={FAQ} />
      
      {/* Search results goes to tours page with query param handling */}
      <Route path="/search" component={Tours} />
      
      <Route component={NotFound} />
    </Switch>
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
