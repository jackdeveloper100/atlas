/**
 * PricingPage.jsx
 * 
 * Subscription pricing and checkout
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import api from '../api/client';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const sub = useSubscription();
  const navigate = useNavigate();

  async function handleSubscribe() {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/subscriptions/checkout');

      if (response.success && response.data?.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        setError(response.error || 'Failed to create checkout session');
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to create checkout session');
      setLoading(false);
    }
  }

  async function handleManageSubscription() {
    setPortalLoading(true);
    setError('');

    try {
      const response = await api.post('/subscriptions/portal');

      if (response.success && response.data?.portal_url) {
        window.location.href = response.data.portal_url;
      } else {
        setError(response.error || 'Failed to open customer portal');
        setPortalLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to open portal');
      setPortalLoading(false);
    }
  }

  if (sub.isSubscribed) {
    const formattedDate = sub.currentPeriodEnd
      ? new Date(sub.currentPeriodEnd).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '';

    return (
      <div className="min-h-screen bg-ground flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl bg-paper rounded-lg shadow-lg p-8 text-center border border-rule">
          <div className="flex justify-center mb-4">
            <Badge variant="accent" size="lg">PRO ACCOUNT</Badge>
          </div>
          <h1 className="text-3xl font-display font-bold text-ink mb-2">
            Active Pro Subscription
          </h1>
          <p className="text-ink/80 text-sm mb-6">
            {sub.cancelAtPeriodEnd
              ? `Your subscription is active until ${formattedDate}. It will not renew.`
              : `Your ${sub.planName} plan is active at ${sub.price}/${sub.interval}.${formattedDate ? ` Renews: ${formattedDate}` : ''}`}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="primary"
              size="md"
              onClick={handleManageSubscription}
              disabled={portalLoading}
            >
              {portalLoading ? 'Opening Portal...' : 'Manage Subscription'}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/account')}
            >
              Account Settings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ground py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-ink mb-4">
            Unlock the Full ATLAS Experience
          </h1>
          <p className="text-xl text-ink/70">
            Join as a founding member and get full access to the historical simulation.
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        <div className="max-w-2xl mx-auto bg-paper rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-display font-bold text-ink mb-2">
              Founding Member
            </h2>
            <div className="text-5xl font-display font-bold text-ink mb-2">
              £10<span className="text-2xl text-ink/60">/month</span>
            </div>
            <p className="text-ink/60">Cancel anytime</p>
          </div>

          <ul className="space-y-3 mb-8">
            <li className="flex items-start">
              <svg className="w-6 h-6 text-ink mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-ink">Full access to the Archive (1951 years of history)</span>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 text-ink mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-ink">All audio tracks and narrative content</span>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 text-ink mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-ink">Interactive timeline exploration</span>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 text-ink mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-ink">Early access to new features</span>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 text-ink mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-ink">Support independent development</span>
            </li>
          </ul>

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-black text-white font-bold py-3 px-6 rounded hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Redirecting to checkout...' : 'Subscribe Now'}
          </button>

          <p className="mt-4 text-xs text-ink/50 text-center">
            Secure payment processed by Stripe. Cancel anytime from your account page.
          </p>
        </div>

        <div className="mt-8 text-center text-sm text-ink/60">
          <p>
            Questions? Contact us or read our{' '}
            <a href="/terms" className="text-ink hover:underline font-medium">
              Terms of Service
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
