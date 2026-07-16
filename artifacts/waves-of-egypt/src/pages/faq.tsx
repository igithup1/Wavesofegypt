import React from 'react';
import Layout from '@/components/layout/Layout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  return (
    <Layout>
      <div className="bg-primary pt-32 pb-16 text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Everything you need to know about booking with WavesOfEgypt.
          </p>
        </div>
      </div>
      <div className="py-16 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left text-lg font-serif">What is your cancellation policy?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                Most experiences offer free cancellation up to 24 hours in advance for a full refund. Please check the specific tour details for exact terms, as some multi-day tours or exclusive experiences may have different requirements.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left text-lg font-serif">Are your guides licensed?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                Yes, absolutely. We strictly vet all our vendors. Every guide operating on WavesOfEgypt holds official certification from the Egyptian Ministry of Tourism and Antiquities.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left text-lg font-serif">How do I become a vendor?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                If you provide premium travel experiences in Egypt, you can register as a vendor. Once registered, our team will review your application, licenses, and insurance before your tours go live on the marketplace.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left text-lg font-serif">Is it safe to travel to Egypt?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                Yes, Egypt's major tourist destinations (Cairo, Luxor, Aswan, Red Sea resorts) are heavily secured and considered very safe for tourists. We only offer experiences in approved areas and work with established security-conscious vendors.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </Layout>
  );
}
