import React from 'react';
import { useRoute } from 'wouter';
import { useGetDestination, useListTours } from '@workspace/api-client-react';
import Layout from '@/components/layout/Layout';
import { TourCard } from '@/components/ui/TourCard';
import { MapPin } from 'lucide-react';

export default function DestinationDetail() {
  const [, params] = useRoute('/destinations/:id');
  const id = params?.id ? parseInt(params.id) : 0;

  const { data: destination, isLoading: isLoadingDest } = useGetDestination(id, { 
    query: { enabled: !!id } 
  });
  
  const { data: toursData, isLoading: isLoadingTours } = useListTours(
    { destinationId: id },
    { query: { enabled: !!id } }
  );

  if (isLoadingDest || isLoadingTours) {
    return (
      <Layout>
        <div className="h-[60vh] bg-muted animate-pulse"></div>
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 bg-muted animate-pulse rounded-2xl"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!destination) {
    return (
      <Layout>
        <div className="py-32 text-center">
          <h1 className="text-3xl font-serif font-bold">Destination not found</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="relative h-[60vh] min-h-[400px] flex items-end pb-16">
        <div className="absolute inset-0 z-0">
          <img 
            src={destination.imageUrl} 
            alt={destination.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 md:px-6">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary backdrop-blur-md px-3 py-1 rounded-full text-sm font-medium mb-4">
            <MapPin className="w-4 h-4" />
            {destination.region.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-4">{destination.name}</h1>
          {destination.description && (
            <p className="text-lg md:text-xl text-foreground/80 max-w-3xl">
              {destination.description}
            </p>
          )}
        </div>
      </div>

      <div className="py-16 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-serif font-bold">Experiences in {destination.name}</h2>
            <span className="text-muted-foreground">{toursData?.total || 0} tours available</span>
          </div>

          {toursData?.tours && toursData.tours.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {toursData.tours.map((tour, i) => (
                <TourCard key={tour.id} tour={tour} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/30 rounded-2xl border border-border">
              <p className="text-lg text-muted-foreground">No experiences found for this destination yet.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
