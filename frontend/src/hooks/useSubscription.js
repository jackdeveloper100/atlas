import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook to access normalized subscription state.
 * Consumes AuthContext to guarantee a single source of truth across the application.
 */
export function useSubscription() {
  const { user, subscription, loading } = useAuth();

  const isAuthenticated = Boolean(user);

  const now = new Date();
  const periodEndDate = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
  const isPeriodValid = periodEndDate ? periodEndDate > now : false;

  const isSubscribed = Boolean(
    isAuthenticated &&
      subscription &&
      (subscription.status === 'active' || subscription.status === 'trialing' || isPeriodValid)
  );

  const status = subscription ? subscription.status : 'inactive';
  const plan = subscription?.subscription_plans || null;
  const planName = plan?.name || (isSubscribed ? 'Pro Account' : 'Free Account');
  
  const priceGbp = plan?.price_gbp ? (plan.price_gbp / 100).toFixed(2) : '10.00';
  const price = `£${priceGbp}`;
  const interval = plan?.interval || 'month';
  const currentPeriodEnd = subscription?.current_period_end || null;
  const cancelAtPeriodEnd = Boolean(subscription?.cancel_at_period_end);

  return {
    loading,
    isAuthenticated,
    isSubscribed,
    status,
    plan,
    planName,
    price,
    interval,
    currentPeriodEnd,
    cancelAtPeriodEnd,
  };
}

export default useSubscription;
