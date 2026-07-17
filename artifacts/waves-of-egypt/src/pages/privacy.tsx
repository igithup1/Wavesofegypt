import React from 'react';
import Layout from '@/components/layout/Layout';
import { usePageMeta } from '@/hooks/usePageMeta';

export default function Privacy() {
  usePageMeta({
    title: 'Privacy Policy',
    description: 'How WavesOfEgypt collects, uses, and protects your personal information.',
    canonical: '/privacy',
  });
  return (
    <Layout>
      <div className="bg-primary pt-32 pb-16 text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Privacy Policy</h1>
          <p className="text-primary-foreground/80 max-w-xl mx-auto">
            Last updated: 1 July 2025
          </p>
        </div>
      </div>

      <div className="py-16 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="prose prose-lg dark:prose-invert max-w-none">

            <p>
              WavesOfEgypt ("we", "us", "our") operates the website <strong>wavesofegypt.com</strong>. This Privacy Policy explains how we collect, use, and protect your personal information when you use our platform.
            </p>

            <h2>1. Information We Collect</h2>
            <p>We collect information you provide directly to us, including:</p>
            <ul>
              <li><strong>Account information:</strong> name, email address, and password when you register.</li>
              <li><strong>Booking information:</strong> tour selections, travel dates, number of travelers, and any special requests.</li>
              <li><strong>Contact information:</strong> messages you send us via the contact form or WhatsApp.</li>
              <li><strong>Usage data:</strong> pages visited, tours viewed, and actions taken on our platform (collected via analytics tools).</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Process and confirm your tour bookings.</li>
              <li>Send booking confirmation emails and important updates.</li>
              <li>Respond to your inquiries and provide customer support.</li>
              <li>Improve our website, services, and user experience.</li>
              <li>Send you promotional offers and travel tips (only if you have opted in).</li>
              <li>Comply with legal obligations.</li>
            </ul>

            <h2>3. Sharing Your Information</h2>
            <p>We do not sell your personal information. We may share it with:</p>
            <ul>
              <li><strong>Tour operators:</strong> to facilitate your booked experience.</li>
              <li><strong>Service providers:</strong> email delivery, payment processing, and analytics services that help us operate the platform.</li>
              <li><strong>Legal authorities:</strong> when required by law or to protect our rights.</li>
            </ul>

            <h2>4. Cookies</h2>
            <p>
              We use cookies and similar technologies to remember your preferences, keep you logged in, and understand how visitors use our site. You can control cookies through your browser settings. Disabling cookies may affect some features of the platform.
            </p>

            <h2>5. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide services. Booking records may be kept for up to 5 years for legal and accounting purposes.
            </p>

            <h2>6. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data ("right to be forgotten").</li>
              <li>Opt out of marketing communications at any time.</li>
            </ul>
            <p>To exercise these rights, contact us at <a href="mailto:info@wavesofegypt.com">info@wavesofegypt.com</a>.</p>

            <h2>7. Security</h2>
            <p>
              We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure. We encourage you to use a strong, unique password for your account.
            </p>

            <h2>8. Third-Party Links</h2>
            <p>
              Our website may contain links to third-party websites (e.g., WhatsApp, Google Maps). We are not responsible for the privacy practices of those sites and encourage you to read their privacy policies.
            </p>

            <h2>9. Children's Privacy</h2>
            <p>
              Our platform is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us.
            </p>

            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last updated" date above.
            </p>

            <h2>11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us:
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
