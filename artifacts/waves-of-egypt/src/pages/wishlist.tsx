import React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useGetWishlist, getGetWishlistQueryKey } from '@workspace/api-client-react';
import Layout from '@/components/layout/Layout';
import { TourCard } from '@/components/ui/TourCard';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { Link } from 'wouter';

export default function Wishlist() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: wishlist, isLoading: isWishlistLoading } = useGetWishlist({
    query: { enabled: !!user } as any,
  });

  if (isAuthLoading || isWishlistLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="h-10 bg-muted animate-pulse rounded w-1/4 mb-12"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-96 bg-muted animate-pulse rounded-2xl"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-32 text-center max-w-lg">
          <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-3xl font-serif font-bold mb-4">Your Wishlist</h1>
          <p className="text-muted-foreground mb-8">
            Log in to save your favorite Egyptian experiences and access them across all your devices.
          </p>
          <Button onClick={() => setLocation('/login')} size="lg" className="w-full sm:w-auto">
            Log in or sign up
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-primary pt-32 pb-16 text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center gap-4 mb-4">
            <Heart className="w-8 h-8 fill-accent text-accent" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold">Your Wishlist</h1>
          </div>
          <p className="text-lg text-primary-foreground/80">
            {wishlist?.length === 1 ? '1 saved experience' : `${wishlist?.length || 0} saved experiences`}
          </p>
        </div>
      </div>

      <div className="py-16 bg-background min-h-[50vh]">
        <div className="container mx-auto px-4 md:px-6">
          {wishlist && wishlist.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {wishlist.map((tour, i) => (
                <TourCard key={tour.id} tour={tour} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-muted/30 rounded-2xl border border-border">
              <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-2xl font-serif font-bold mb-4">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Explore our destinations and tours to find the perfect Egyptian adventure. Click the heart icon on any tour to save it here.
              </p>
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/tours">Explore Tours</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
