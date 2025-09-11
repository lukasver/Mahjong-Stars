"use client";
import { Card } from "@mjs/ui/primitives/card";
import { Skeleton } from "@mjs/ui/primitives/skeleton";
import { PaymentInstructions } from './instructions';


export function OnRampSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br  p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Summary Section Skeleton */}
        <Card className="backdrop-blur-sm">
          <div className="p-6">
            <Skeleton className="h-6 w-24 mb-4 " />
            <div className="flex justify-between items-center mb-2">
              <Skeleton className="h-4 w-24 " />
              <Skeleton className="h-4 w-20 " />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-32 " />
              <Skeleton className="h-4 w-28 " />
            </div>
          </div>
        </Card>

        <div className="flex flex-col-reverse md:flex-row-reverse gap-4">
          {/* Get Funds Section Skeleton */}
          <OnRampWidgetSkeleton />

          {/* Steps Section Skeleton */}
          <PaymentInstructions />
        </div>

        {/* Payment Status Skeleton */}
        <Card className="border">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="h-5 w-28" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between border-t pt-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>

            {/* Gas Toggle Skeleton */}
            <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
              <Skeleton className="w-10 h-6 rounded-full" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </Card>

        {/* Proceed Button Skeleton */}
        <div className="flex justify-center">
          <Skeleton className="h-10 flex-1" />
        </div>
      </div>
    </div>
  );
}

export const PaymentInstructionsSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Step 1 Skeleton */}
      <Card className="bg-red-900/50 border-red-700/50 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="w-8 h-8 rounded-full " />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-2 " />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full " />
                <Skeleton className="h-3 w-full " />
                <Skeleton className="h-3 w-3/4 " />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Step 2 Skeleton */}
      <Card className="bg-red-900/50 border-red-700/50 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="w-8 h-8 rounded-full " />
            <div className="flex-1">
              <Skeleton className="h-5 w-28 mb-2 " />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full " />
                <Skeleton className="h-3 w-full " />
                <Skeleton className="h-3 w-2/3 " />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Step 3 Skeleton */}
      <Card className="bg-red-900/50 border-red-700/50 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="w-8 h-8 rounded-full " />
            <div className="flex-1">
              <Skeleton className="h-5 w-36 mb-2 " />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full " />
                <Skeleton className="h-3 w-4/5 " />
              </div>
            </div>
          </div>
        </div>
      </Card>
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
