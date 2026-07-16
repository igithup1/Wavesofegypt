import React from 'react';
import Layout from '@/components/layout/Layout';

export default function About() {
  return (
    <Layout>
      <div className="bg-primary pt-32 pb-16 text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4">About WavesOfEgypt</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Your premium gateway to the wonders of Egypt.
          </p>
        </div>
      </div>
      <div className="py-16 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl prose prose-lg dark:prose-invert">
          <p>
            WavesOfEgypt was founded with a single mission: to provide a world-class, premium travel concierge service for those looking to explore the magic of Egypt.
          </p>
          <h2>Our Story</h2>
          <p>
            We realized that while Egypt is one of the most mesmerizing destinations on earth, finding high-quality, curated experiences was often a challenge. We set out to change that by partnering only with the finest local guides, luxury vendors, and exclusive tour operators.
          </p>
          <h2>Our Promise</h2>
          <p>
            From the depths of the Red Sea to the timeless flow of the Nile, every experience on our platform has been vetted for quality, safety, and unforgettable impact. We don't just sell tours; we craft memories.
          </p>
        </div>
      </div>
    </Layout>
  );
}
