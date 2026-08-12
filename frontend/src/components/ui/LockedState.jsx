import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Sparkles } from 'lucide-react';
import Button from './Button';
import Card from './Card';

/**
 * LockedState Component
 * Standardized ATLAS locked/gated UI block for subscriber-only features.
 */
export function LockedState({
  title = 'PRO FEATURE',
  description = 'This feature is available to Pro members. Subscribe to unlock full historical archives and library narratives.',
  buttonText = 'Upgrade to Pro',
  redirectPath = '/pricing',
  className = '',
}) {
  return (
    <Card className={`p-8 md:p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto ${className}`}>
      <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center mb-5 shadow-xs">
        <Lock className="w-7 h-7" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-ink text-xs font-mono font-bold uppercase tracking-wider mb-3 border border-rule">
        <Sparkles className="w-3.5 h-3.5" />
        <span>{title}</span>
      </div>

      <h3 className="font-serif text-2xl font-bold text-ink mb-2">
        Subscriber Access Required
      </h3>

      <p className="text-sm font-sans text-ink-muted max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      <Link to={redirectPath}>
        <Button variant="primary" size="lg">
          {buttonText}
        </Button>
      </Link>

      <p className="text-xs font-mono text-ink-faint mt-4">
        Starting at £10.00/month • Cancel anytime
      </p>
    </Card>
  );
}

export default LockedState;
