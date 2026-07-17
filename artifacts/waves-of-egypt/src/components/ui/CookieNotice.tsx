import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Cookie } from 'lucide-react';

const STORAGE_KEY = 'woe_cookie_consent';

/**
 * Cookie consent banner — displayed once until the user accepts or declines.
 * The preference is persisted in localStorage so the banner doesn't reappear.
 */
export default function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show the banner if the user hasn't responded yet.
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
    // TODO: Activate analytics scripts here once tracking IDs are configured.
  };

  const handleDecline = () => {
    localStorage.setItem(STORAGE_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6"
    >
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl shadow-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="shrink-0 w-10 h-10 bg-accent/10 text-accent rounded-full flex items-center justify-center">
          <Cookie className="w-5 h-5" />
        </div>
        <p className="text-sm text-muted-foreground flex-1 leading-relaxed">
          We use cookies to improve your experience and understand how visitors use our site.
          By clicking <strong className="text-foreground">Accept</strong>, you agree to our{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={handleDecline}>
            Decline
          </Button>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleAccept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
