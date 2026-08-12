/**
 * SignupPage.jsx
 * 
 * User registration with age gate requirement
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!ageConfirmed) {
      setError('You must confirm you are 18 or older to create an account.');
      setLoading(false);
      return;
    }

    const { error: signUpError } = await signUp(email, password, displayName, ageConfirmed);

    if (signUpError) {
      setError(signUpError);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-ground flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-paper rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-display font-bold text-ink mb-6">
            Check Your Email
          </h1>
          <p className="text-ink/80 mb-6">
            We've sent a verification link to <strong>{email}</strong>.
            Please verify your email before signing in.
          </p>
          <Link
            to="/login"
            className="block w-full text-center bg-black text-white font-medium py-2 px-4 rounded hover:bg-neutral-800 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ground flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-paper rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-display font-bold text-ink mb-6">
          Create Account
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-rule rounded focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink mb-1">
              Password (min 8 characters)
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2 border border-rule rounded focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-ink mb-1">
              Display Name (optional)
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={100}
              className="w-full px-4 py-2 border border-rule rounded focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>

          <div className="flex items-start">
            <input
              id="ageConfirmed"
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              className="mt-1 mr-2"
              required
            />
            <label htmlFor="ageConfirmed" className="text-sm text-ink">
              I confirm that I am 18 years of age or older. *
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !ageConfirmed}
            className="w-full bg-black text-white font-medium py-2 px-4 rounded hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/60">
          Already have an account?{' '}
          <Link to="/login" className="text-ink hover:underline font-medium">
            Sign in
          </Link>
        </p>

        <p className="mt-4 text-xs text-ink/50 text-center">
          By creating an account, you agree to our{' '}
          <Link to="/terms" className="text-ink hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-ink hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
