"use client";
import { Card } from "@mjs/ui/primitives/card";
import { Skeleton } from "@mjs/ui/primitives/skeleton";


export function OnRampSkeleton() {
  return (
    <div className='w-full flex justify-center items-center'>
      <OnRampWidgetSkeleton />
    </div>
  );
};

export const OnRampWidgetSkeleton = () => {
  return (
    <Card className="bg-gray-900/80 border-gray-700/50 backdrop-blur-sm rounded-[20px]">
      <div className="p-6">
        <Skeleton className="h-6 w-24 mb-6 bg-gray-700/50" />

        {/* Wallet Balance Skeleton */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg bg-gray-700/50" />
              <div>
                <Skeleton className="h-4 w-24 mb-1 bg-gray-700/50" />
                <Skeleton className="h-3 w-16 bg-gray-700/50" />
              </div>
            </div>
            <div className="text-right">
              <Skeleton className="h-4 w-20 mb-1 bg-gray-700/50" />
              <Skeleton className="h-3 w-12 bg-gray-700/50" />
            </div>
          </div>
        </div>

        {/* Quick Buy Options Skeleton */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Skeleton className="h-10 bg-gray-700/50" />
          <Skeleton className="h-10 bg-gray-700/50" />
          <Skeleton className="h-10 bg-gray-700/50" />
        </div>

        {/* Rainbow Wallet Skeleton */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full bg-gray-700/50" />
            <div>
              <Skeleton className="h-4 w-20 mb-1 bg-gray-700/50" />
              <Skeleton className="h-3 w-16 bg-gray-700/50" />
            </div>
          </div>
        </div>

        {/* Buy Button Skeleton */}
        <Skeleton className="w-full h-10 bg-gray-700/50" />

        <div className="text-center mt-4">
          <Skeleton className="h-3 w-32 mx-auto bg-gray-700/50" />
        </div>
      </div>
    </Card>
  );
};
