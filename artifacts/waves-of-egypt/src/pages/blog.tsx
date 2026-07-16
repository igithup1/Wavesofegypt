import React from 'react';
import Layout from '@/components/layout/Layout';

export default function Blog() {
  const posts = [
    {
      id: 1,
      title: "Top 10 Hidden Gems in the Red Sea",
      excerpt: "Discover the secret diving spots that only the locals know about.",
      date: "Oct 12, 2024"
    },
    {
      id: 2,
      title: "A Guide to the Best Nile River Cruises",
      excerpt: "From luxury yachts to traditional feluccas, find the perfect cruise for your style.",
      date: "Sep 28, 2024"
    },
    {
      id: 3,
      title: "What to Pack for a Sahara Desert Safari",
      excerpt: "Essential gear and tips for surviving and thriving in the majestic Egyptian desert.",
      date: "Sep 15, 2024"
    }
  ];

  return (
    <Layout>
      <div className="bg-primary pt-32 pb-16 text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4">Travel Blog</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Stories, tips, and inspiration from the heart of Egypt.
          </p>
        </div>
      </div>
      <div className="py-16 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {posts.map(post => (
              <div key={post.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-muted"></div>
                <div className="p-6">
                  <span className="text-sm text-muted-foreground">{post.date}</span>
                  <h2 className="text-xl font-serif font-bold mt-2 mb-3">{post.title}</h2>
                  <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                  <span className="text-primary font-medium hover:underline cursor-pointer">Read more</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
