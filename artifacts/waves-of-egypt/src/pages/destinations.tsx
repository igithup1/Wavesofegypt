import React from 'react';
import { useListDestinations } from '@workspace/api-client-react';
import Layout from '@/components/layout/Layout';
import { DestinationCard } from '@/components/ui/DestinationCard';
import { motion } from 'framer-motion';

export default function Destinations() {
  const { data: destinations, isLoading } = useListDestinations();

  // Group destinations by region
  const groupedDestinations = destinations?.reduce((acc, dest) => {
    const region = dest.region.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    if (!acc[region]) acc[region] = [];
    acc[region].push(dest);
    return acc;
  }, {} as Record<string, typeof destinations>) || {};

  return (
    <Layout>
      <div className="bg-primary pt-32 pb-16 text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4">Destinations</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            From the bustling streets of Cairo to the serene waters of the Red Sea, explore the diverse landscapes of Egypt.
          </p>
        </div>
      </div>

      <div className="py-16 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-square bg-muted animate-pulse rounded-2xl"></div>
              ))}
            </div>
          ) : (
            Object.entries(groupedDestinations).map(([region, dests]) => (
              <div key={region} className="mb-16 last:mb-0">
                <h2 className="text-3xl font-serif font-bold mb-8 flex items-center gap-4">
                  {region}
                  <div className="h-px bg-border flex-1 ml-4"></div>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dests.map((dest, i) => (
                    <DestinationCard key={dest.id} destination={dest} index={i} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
