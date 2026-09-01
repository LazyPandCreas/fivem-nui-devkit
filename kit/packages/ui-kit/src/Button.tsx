import React from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-sky-600 hover:bg-sky-500 text-white',
  secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-100',
  danger: 'bg-rose-600 hover:bg-rose-500 text-white',
};

// Bottone base condiviso da tutte le interfacce. Estendi qui, non nelle
// singole app, cosi ogni interfaccia resta visivamente coerente.
export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
