import React from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center py-32 bg-background">
        <div className="text-center max-w-md px-4">
          <div className="text-primary font-serif font-bold text-8xl mb-4">404</div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Lost in the desert?</h1>
          <p className="text-muted-foreground text-lg mb-8">
            The page you're looking for seems to have vanished into the sands of time. Let's get you back on track.
          </p>
          <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/">Return to Oasis</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
