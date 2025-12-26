import { AnimatedText } from "@mjs/ui/components/motion";
import { cn } from "@mjs/ui/lib/utils";
import Image from "next/image";
import MahjongStarsIconXl from "@/public/static/images/logos/isologo.webp";

export function PulseLoader({
  children,
  text = "Loading...",
  className,
}: {
  children?: React.ReactNode;
  text?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="aspect-square animate-pulse">
        <Image
          height={80}
          width={80}
          src={MahjongStarsIconXl}
          alt="The Tiles Company Logo"
          className="animate-spin aspect-square w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20"
        />
      </span>
      {children || (
        <AnimatedText className="text-base md:text-lg sm:text-xl font-bold font-head">
          {text}
        </AnimatedText>
      )}
    </div>
  );
}
