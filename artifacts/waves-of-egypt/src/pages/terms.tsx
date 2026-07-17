import React from 'react';
import Layout from '@/components/layout/Layout';
import { usePageMeta } from '@/hooks/usePageMeta';

export default function Terms() {
  usePageMeta({
    title: 'Terms of Service',
    description: 'The terms and conditions governing your use of the WavesOfEgypt platform.',
    canonical: '/terms',
  });
  return (
    <Layout>
      <div className="bg-primary pt-32 pb-16 text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Terms of Service</h1>
          <p className="text-primary-foreground/80 max-w-xl mx-auto">
            Last updated: 1 July 2025
          </p>
        </div>
      </div>

      <div className="py-16 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="prose prose-lg dark:prose-invert max-w-none">

            <p>
              Please read these Terms of Service ("Terms") carefully before using the WavesOfEgypt website at <strong>wavesofegypt.com</strong>. By accessing or using our platform, you agree to be bound by these Terms.
            </p>

            <h2>1. Services</h2>
            <p>
              WavesOfEgypt is an online marketplace that connects travelers with verified local tour operators in Hurghada, Egypt. We facilitate bookings but the tour itself is delivered by the respective operator.
            </p>

            <h2>2. Eligibility</h2>
            <p>
              You must be at least 18 years old to create an account and make bookings. By using our platform, you confirm that you meet this requirement.
            </p>

            <h2>3. Bookings</h2>
            <p>
              All bookings are subject to availability and operator confirmation. A booking is confirmed once you receive a confirmation email or WhatsApp message from us or the operator. Prices are displayed in US dollars (USD) unless stated otherwise.
            </p>

            <h2>4. Cancellation & Refunds</h2>
            <ul>
              <li><strong>Free cancellation:</strong> Most tours offer free cancellation up to 24 hours before the start time. The specific cancellation window is shown on each tour's detail page.</li>
              <li><strong>Late cancellations:</strong> Cancellations within 24 hours of the tour start may be subject to a 100% cancellation fee.</li>
              <li><strong>No-show:</strong> Failure to show up without prior notice will result in no refund.</li>
              <li><strong>Operator cancellations:</strong> If the operator cancels due to weather or other circumstances, you will receive a full refund or the option to reschedule.</li>
            </ul>

            <h2>5. User Responsibilities</h2>
            <p>You agree to:</p>
            <ul>
              <li>Provide accurate and complete information when creating an account or making a booking.</li>
              <li>Arrive on time for your booked experience.</li>
              <li>Follow all safety instructions provided by tour operators and guides.</li>
              <li>Respect local laws, customs, and the environment.</li>
              <li>Not engage in any activity that disrupts other travelers or tour operators.</li>
            </ul>

            <h2>6. Prohibited Activities</h2>
            <p>You may not use our platform to:</p>
            <ul>
              <li>Post false or misleading reviews.</li>
              <li>Circumvent our platform to book directly with operators for bookings that originated through our marketplace.</li>
              <li>Attempt to gain unauthorized access to our systems.</li>
              <li>Engage in any unlawful activity.</li>
            </ul>

            <h2>7. Reviews</h2>
            <p>
              Reviews must be honest, based on your genuine experience, and free of offensive language. We reserve the right to remove reviews that violate our community guidelines.
            </p>

            <h2>8. Liability</h2>
            <p>
              WavesOfEgypt acts as a marketplace and is not directly responsible for the quality, safety, or legality of any tour experience. We are not liable for personal injury, property damage, or other losses arising from participation in any tour. Operators carry their own insurance.
            </p>
            <p>
              To the maximum extent permitted by applicable law, our total liability to you for any claim arising from use of the platform shall not exceed the amount you paid for the specific booking in dispute.
            </p>

            <h2>9. Intellectual Property</h2>
            <p>
              All content on this website — including text, images, logos, and software — is owned by WavesOfEgypt or its licensors and is protected by intellectual property laws. You may not reproduce or distribute any content without our written permission.
            </p>

            <h2>10. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the Arab Republic of Egypt. Any disputes shall be subject to the exclusive jurisdiction of the courts of Cairo, Egypt.
            </p>

            <h2>11. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the platform after changes are posted constitutes your acceptance of the updated Terms.
            </p>

            <h2>12. Contact Us</h2>
            <p>
              For questions about these Terms, please contact us:
            </p>
            <ul>
              <li>Email: <a href="mailto:info@wavesofegypt.com">info@wavesofegypt.com</a></li>
              <li>WhatsApp: <a href="https://wa.me/201001234567" target="_blank" rel="noopener noreferrer">+20 100 123 4567</a></li>
              <li>Address: El Mamsha, Hurghada, Red Sea Governorate, Egypt</li>
            </ul>

          </div>
        </div>
      </div>
    </Layout>
  );
}
