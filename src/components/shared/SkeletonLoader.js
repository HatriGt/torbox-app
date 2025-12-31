'use client';

export default function SkeletonLoader({ className = '', count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse bg-surface-alt dark:bg-surface-alt-dark rounded ${className}`}
        />
      ))}
    </>
  );
}

