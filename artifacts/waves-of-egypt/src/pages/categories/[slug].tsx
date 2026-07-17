import React from 'react';
import { useRoute } from 'wouter';
import { useListTours, useListCategories } from '@workspace/api-client-react';
import Layout from '@/components/layout/Layout';
import { TourCard } from '@/components/ui/TourCard';

export default function CategoryDetail() {
  const [, params] = useRoute('/categories/:slug');
  const slug = params?.slug || '';
  const idStr = slug; // Since we edited the Link to pass ID instead of slug

  // Support both slug-based and id-based routing gracefully for demo purposes
  const isId = !isNaN(parseInt(idStr));
  
  const { data: categories } = useListCategories();
  
  const category = categories?.find(c => 
    isId ? c.id === parseInt(idStr) : c.slug === slug
  );

  const { data: toursData, isLoading } = useListTours(
    { categoryId: category?.id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { query: { enabled: !!category?.id } as any },
  );

  return (
    <Layout>
      <div className="bg-primary pt-32 pb-16 text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 capitalize">
            {category?.name || slug.replace('-', ' ')}
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Discover the best {category?.name?.toLowerCase() || slug.replace('-', ' ')} experiences in Egypt.
          </p>
        </div>
      </div>

      <div className="py-16 bg-background min-h-[50vh]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-8">
            <h2 className="text-2xl font-serif font-bold">
              {isLoading ? 'Loading...' : `${toursData?.total || 0} Experiences Found`}
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-96 bg-muted animate-pulse rounded-2xl"></div>
              ))}
            </div>
          ) : toursData?.tours && toursData.tours.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {toursData.tours.map((tour, i) => (
                <TourCard key={tour.id} tour={tour} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/30 rounded-2xl border border-border">
              <p className="text-lg text-muted-foreground">No tours found in this category.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
