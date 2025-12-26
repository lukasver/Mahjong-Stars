import { getGlassyCardClassName } from "@mjs/ui/components/cards";
import { Card } from "@mjs/ui/primitives/card";
import { Skeleton } from "@mjs/ui/primitives/skeleton";
import { Calendar, ChevronDown } from "lucide-react";

function loading() {
  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        {/* Progress Steps */}
        <Card
          className={getGlassyCardClassName("rounded-2xl border p-4 sm:p-6")}
        >
          <div className="flex items-center justify-between overflow-x-auto pb-2 sm:pb-0">
            {/* Step 1 - Create (Active) */}
            <div className="flex flex-col items-center space-y-1 sm:space-y-2 flex-shrink-0">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-full border-2 border-primary bg-background">
                <span className="text-xs sm:text-sm font-semibold text-primary">
                  1
                </span>
              </div>
              <div className="text-center">
                <Skeleton className="h-3 sm:h-4 w-12 sm:w-16 mb-1" />
                <Skeleton className="h-2 sm:h-3 w-16 sm:w-20" />
              </div>
            </div>

            {/* Progress Line 1 */}
            <div className="h-0.5 flex-1 bg-muted mx-2 sm:mx-4 hidden sm:block"></div>

            {/* Step 2 - Contract */}
            <div className="flex flex-col items-center space-y-1 sm:space-y-2 flex-shrink-0">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-muted">
                <span className="text-xs sm:text-sm font-semibold text-muted-foreground">
                  2
                </span>
              </div>
              <div className="text-center">
                <Skeleton className="h-3 sm:h-4 w-12 sm:w-16 mb-1" />
                <Skeleton className="h-2 sm:h-3 w-16 sm:w-20" />
              </div>
            </div>

            {/* Progress Line 2 */}
            <div className="h-0.5 flex-1 bg-muted mx-2 sm:mx-4 hidden sm:block"></div>

            {/* Step 3 - Payment */}
            <div className="flex flex-col items-center space-y-1 sm:space-y-2 flex-shrink-0">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-muted">
                <span className="text-xs sm:text-sm font-semibold text-muted-foreground">
                  3
                </span>
              </div>
              <div className="text-center">
                <Skeleton className="h-3 sm:h-4 w-12 sm:w-16 mb-1" />
                <Skeleton className="h-2 sm:h-3 w-16 sm:w-20" />
              </div>
            </div>

            {/* Progress Line 3 */}
            <div className="h-0.5 flex-1 bg-muted mx-2 sm:mx-4 hidden sm:block"></div>

            {/* Step 4 - Additional Information */}
            <div className="flex flex-col items-center space-y-1 sm:space-y-2 flex-shrink-0">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-muted">
                <span className="text-xs sm:text-sm font-semibold text-muted-foreground">
                  4
                </span>
              </div>
              <div className="text-center">
                <Skeleton className="h-3 sm:h-4 w-20 sm:w-24 mb-1" />
                <Skeleton className="h-2 sm:h-3 w-12 sm:w-16" />
              </div>
            </div>
          </div>
        </Card>

        {/* Basic Information Form */}
        <Card
          className={getGlassyCardClassName("rounded-2xl border p-4 sm:p-6")}
        >
          <div className="mb-4 sm:mb-6">
            <Skeleton className="h-6 sm:h-8 w-36 sm:w-40 md:w-48 mb-2" />
            <Skeleton className="h-3 sm:h-4 w-48 sm:w-56 md:w-64 max-w-full" />
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {/* Left Column */}
            <div className="space-y-4 sm:space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <Skeleton className="h-3 sm:h-4 w-10 sm:w-12" />
                <div className="h-10 sm:h-12 w-full rounded-lg border bg-secondary-700/50 animate-pulse"></div>
                <Skeleton className="h-2 sm:h-3 w-40 sm:w-48 max-w-full" />
              </div>

              {/* Token Symbol Field */}
              <div className="space-y-2">
                <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                <div className="h-10 sm:h-12 w-full rounded-lg border bg-secondary-700/50 animate-pulse"></div>
                <Skeleton className="h-2 sm:h-3 w-44 sm:w-52 max-w-full" />
              </div>

              {/* Blockchain Dropdown */}
              <div className="space-y-2">
                <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
                <div className="relative">
                  <div className="h-10 sm:h-12 w-full rounded-lg border bg-secondary-700/50 animate-pulse flex items-center justify-between px-3">
                    <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
                <Skeleton className="h-2 sm:h-3 w-48 sm:w-56 max-w-full" />
              </div>

              {/* Currency Dropdown */}
              <div className="space-y-2">
                <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
                <div className="relative">
                  <div className="h-10 sm:h-12 w-full rounded-lg border bg-secondary-700/50 animate-pulse flex items-center justify-between px-3">
                    <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
                <Skeleton className="h-2 sm:h-3 w-56 sm:w-64 max-w-full" />
              </div>

              {/* Sale Start Date */}
              <div className="space-y-2">
                <Skeleton className="h-3 sm:h-4 w-24 sm:w-28" />
                <div className="relative">
                  <div className="h-10 sm:h-12 w-full rounded-lg border bg-secondary-700/50 animate-pulse flex items-center justify-between px-3">
                    <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
                <Skeleton className="h-2 sm:h-3 w-28 sm:w-36 max-w-full" />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4 sm:space-y-6">
              {/* Token Name Field */}
              <div className="space-y-2">
                <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                <div className="h-10 sm:h-12 w-full rounded-lg border bg-secondary-700/50 animate-pulse"></div>
                <Skeleton className="h-2 sm:h-3 w-52 sm:w-60 max-w-full" />
              </div>

              {/* Contract Address Field */}
              <div className="space-y-2">
                <Skeleton className="h-3 sm:h-4 w-28 sm:w-32" />
                <div className="h-10 sm:h-12 w-full rounded-lg border bg-secondary-700/50 animate-pulse"></div>
                <Skeleton className="h-2 sm:h-3 w-36 sm:w-44 max-w-full" />
              </div>

              {/* Price per Unit Field */}
              <div className="space-y-2">
                <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                <div className="h-10 sm:h-12 w-full rounded-lg border bg-secondary-700/50 animate-pulse"></div>
                <Skeleton className="h-2 sm:h-3 w-56 sm:w-64 max-w-full" />
              </div>

              {/* Wallet Address Field */}
              <div className="space-y-2">
                <Skeleton className="h-3 sm:h-4 w-24 sm:w-28" />
                <div className="h-10 sm:h-12 w-full rounded-lg border bg-secondary-700/50 animate-pulse"></div>
                <Skeleton className="h-2 sm:h-3 w-64 sm:w-72 max-w-full" />
              </div>

              {/* Sale Closing Date */}
              <div className="space-y-2">
                <Skeleton className="h-3 sm:h-4 w-28 sm:w-32" />
                <div className="relative">
                  <div className="h-10 sm:h-12 w-full rounded-lg border bg-secondary-700/50 animate-pulse flex items-center justify-between px-3">
                    <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
                <Skeleton className="h-2 sm:h-3 w-32 sm:w-40 max-w-full" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between gap-2 sm:gap-4 pt-6 sm:pt-8">
            <Skeleton className="h-9 sm:h-10 w-16 sm:w-20" />
            <Skeleton className="h-9 sm:h-10 w-16 sm:w-20" />
          </div>
        </Card>
      </div>
    </div>
  );
}

export default loading;
