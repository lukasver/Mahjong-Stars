import { Card, CardContent, CardHeader } from "@mjs/ui/primitives/card";
import { Skeleton } from "@mjs/ui/primitives/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
        {/* Header Loading */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
            <Skeleton className="h-6 sm:h-8 w-6 sm:w-8 rounded-full bg-secondary-500" />
            <Skeleton className="h-8 sm:h-10 w-40 sm:w-56 md:w-64 max-w-full bg-secondary-500" />
          </div>
          <Skeleton className="h-5 sm:h-6 w-72 sm:w-80 md:w-96 max-w-full mx-auto bg-secondary-500" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Content - Main Image and Information */}
          <div className="lg:col-span-2">
            <Card className="">
              <CardContent className="p-0">
                {/* Main Image Loading */}
                <div className="relative">
                  <Skeleton className="w-full h-48 sm:h-56 md:h-64 bg-secondary-500" />
                </div>

                {/* Tabs Loading */}
                <div className="p-4 sm:p-6">
                  <div className="flex space-x-1 sm:space-x-2 mb-4 sm:mb-6 overflow-x-auto">
                    <Skeleton className="h-8 sm:h-10 w-24 sm:w-28 md:w-32 flex-shrink-0 bg-secondary-600" />
                    <Skeleton className="h-8 sm:h-10 w-28 sm:w-32 md:w-36 flex-shrink-0 bg-secondary-500" />
                    <Skeleton className="h-8 sm:h-10 w-20 sm:w-24 md:w-28 flex-shrink-0 bg-secondary-500" />
                  </div>

                  {/* Expandable Sections Loading */}
                  <div className="space-y-3 sm:space-y-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="border-b border-secondary-600 pb-3 sm:pb-4"
                      >
                        <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
                          <Skeleton className="h-5 sm:h-6 w-36 sm:w-40 md:w-48 max-w-full bg-secondary-600" />
                          <Skeleton className="h-3 sm:h-4 w-3 sm:w-4 flex-shrink-0 bg-secondary-600" />
                        </div>
                        {index === 0 && (
                          <div className="space-y-2">
                            <Skeleton className="h-3 sm:h-4 w-full bg-secondary-500" />
                            <Skeleton className="h-3 sm:h-4 w-full bg-secondary-500" />
                            <Skeleton className="h-3 sm:h-4 w-3/4 bg-secondary-500" />
                            <div className="mt-3 sm:mt-4 space-y-2">
                              <Skeleton className="h-3 sm:h-4 w-full bg-secondary-500" />
                              <Skeleton className="h-3 sm:h-4 w-full bg-secondary-500" />
                              <Skeleton className="h-3 sm:h-4 w-5/6 bg-secondary-500" />
                            </div>
                            <div className="mt-3 sm:mt-4 space-y-2">
                              <Skeleton className="h-3 sm:h-4 w-full bg-secondary-500" />
                              <Skeleton className="h-3 sm:h-4 w-2/3 bg-secondary-500" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Overview Section Loading */}
            <Card className="bg-secondary-800/50 border-secondary-700">
              <CardHeader className="p-4 sm:p-6">
                <Skeleton className="h-6 sm:h-7 w-20 sm:w-24 bg-secondary-600" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {/* Tokens Available */}
                <div className="flex justify-between items-center gap-2">
                  <Skeleton className="h-3 sm:h-4 w-24 sm:w-32 bg-secondary-500" />
                  <Skeleton className="h-3 sm:h-4 w-16 sm:w-20 bg-secondary-600" />
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-12 sm:w-16 bg-secondary-500" />
                  </div>
                  <Skeleton className="h-2 w-full bg-secondary-500" />
                  <div className="flex justify-between gap-2">
                    <Skeleton className="h-3 w-16 sm:w-20 bg-secondary-500" />
                    <Skeleton className="h-3 w-12 sm:w-16 bg-secondary-500" />
                  </div>
                </div>

                {/* Token Details */}
                <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4">
                  {[
                    { label: "Name", width: "w-24 sm:w-32" },
                    { label: "Symbol", width: "w-10 sm:w-12" },
                    { label: "Total supply", width: "w-16 sm:w-20" },
                    { label: "Price per token", width: "w-12 sm:w-14" },
                    { label: "Sale starts", width: "w-20 sm:w-24" },
                    { label: "Sale ends", width: "w-20 sm:w-24" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center gap-2"
                    >
                      <Skeleton className="h-3 sm:h-4 w-20 sm:w-24 bg-secondary-500" />
                      <Skeleton
                        className={`h-3 sm:h-4 ${item.width} bg-secondary-600`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Invest Section Loading */}
            <Card className="bg-secondary-800/50 border-secondary-700">
              <CardHeader className="p-4 sm:p-6">
                <Skeleton className="h-6 sm:h-7 w-14 sm:w-16 bg-secondary-600" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {/* Wallet Address */}
                <div className="space-y-2">
                  <Skeleton className="h-3 sm:h-4 w-24 sm:w-28 bg-secondary-500" />
                  <Skeleton className="h-9 sm:h-10 w-full bg-secondary-500" />
                </div>

                {/* Token Amount */}
                <div className="space-y-2">
                  <Skeleton className="h-3 sm:h-4 w-20 sm:w-24 bg-secondary-500" />
                  <Skeleton className="h-9 sm:h-10 w-full bg-secondary-500" />
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Skeleton className="h-3 sm:h-4 w-14 sm:w-16 bg-secondary-500" />
                  <Skeleton className="h-9 sm:h-10 w-full bg-secondary-500" />
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Skeleton className="h-3 sm:h-4 w-28 sm:w-32 bg-secondary-500" />
                  <Skeleton className="h-9 sm:h-10 w-full bg-secondary-500" />
                </div>

                {/* Purchase Button */}
                <Skeleton className="h-10 sm:h-12 w-full bg-secondary-600 mt-4 sm:mt-6" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
