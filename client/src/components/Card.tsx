import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  bordered?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ bordered = true, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: bordered ? 'var(--border)' : 'transparent',
          borderWidth: bordered ? '1px' : '0',
        }}
        className={`rounded overflow-hidden ${className}`}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          borderBottomColor: 'var(--border)',
          borderBottomWidth: '1px',
        }}
        className={`px-6 py-4 ${className}`}
        {...props}
      />
    );
  }
);

CardHeader.displayName = 'CardHeader';

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`p-6 ${className}`}
        {...props}
      />
    );
  }
);

CardBody.displayName = 'CardBody';

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          borderTopColor: 'var(--border)',
          borderTopWidth: '1px',
        }}
        className={`px-6 py-4 ${className}`}
        {...props}
      />
    );
  }
);

CardFooter.displayName = 'CardFooter';
