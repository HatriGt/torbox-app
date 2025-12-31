'use client';

import SkeletonLoader from '@/components/shared/SkeletonLoader';

export default function SearchResultSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="p-4 rounded-lg border border-border dark:border-border-dark 
                   bg-surface dark:bg-surface-dark space-y-3"
          style={{
            animationDelay: `${index * 50}ms`,
          }}
        >
          {/* Title skeleton */}
          <div className="flex flex-col gap-2">
            <SkeletonLoader className="h-6 w-3/4" />
            <div className="flex items-center gap-2">
              <SkeletonLoader className="h-5 w-16" />
              <SkeletonLoader className="h-5 w-16" />
              <SkeletonLoader className="h-5 w-16" />
            </div>
          </div>

          {/* Metadata skeleton */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <SkeletonLoader className="h-4 w-20" />
              <SkeletonLoader className="h-4 w-16" />
              <SkeletonLoader className="h-4 w-24" />
              <SkeletonLoader className="h-4 w-20" />
            </div>
            <div className="flex items-center gap-4">
              <SkeletonLoader className="h-8 w-24" />
              <SkeletonLoader className="h-8 w-32" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

