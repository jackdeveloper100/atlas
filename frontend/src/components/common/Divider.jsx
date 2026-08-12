import React from 'react';

/**
 * Reusable Divider Component
 */
export function Divider({ className = '' }) {
  return <hr className={`border-t border-rule my-6 ${className}`} />;
}

export default Divider;
