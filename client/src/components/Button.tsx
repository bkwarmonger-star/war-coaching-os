import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', ...props }, ref) => {
    const baseStyles = 'font-oswald font-bold uppercase tracking-widest transition-all duration-150 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

    const variantStyles = {
      primary: {
        backgroundColor: 'var(--gold)',
        color: '#000',
        border: 'none',
        hover: 'hover:brightness-110',
      },
      secondary: {
        backgroundColor: 'var(--surface2)',
        color: 'var(--white)',
        border: '1px solid var(--border-gold)',
        hover: 'hover:border-gold hover:brightness-110',
      },
      outline: {
        backgroundColor: 'transparent',
        color: 'var(--muted)',
        border: '1px solid var(--border)',
        hover: 'hover:border-gold hover:text-gold',
      },
      danger: {
        backgroundColor: 'var(--red)',
        color: '#fff',
        border: 'none',
        hover: 'hover:brightness-110',
      },
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const styles = variantStyles[variant];

    return (
      <button
        ref={ref}
        style={{
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          border: styles.border,
        }}
        className={`${baseStyles} ${sizeStyles[size]} ${styles.hover} ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
