"use client";

// import { siteConfig } from "@/config/site"
// import { Icons } from "@/components/icons"
import { cn } from "@mjs/ui/lib/utils";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

function VideoBackground({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<motion.main
			id="hero"
			// ref={heroRef}
			className={cn("relative w-screen", className)}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 1 }}
		>
			{children}
			<VideoComponent />
		</motion.main>
	);
}

const VideoComponent = () => {
	const [videoLoaded, setVideoLoaded] = useState(false);
	const videoRef = useRef<HTMLVideoElement | null>(null);

	useEffect(() => {
		const video = videoRef.current;
		if (video) {
			const handleLoadedData = () => setVideoLoaded(true);

			video.addEventListener("loadeddata", handleLoadedData);
			if (video.readyState >= 2) setVideoLoaded(true);

			return () => video.removeEventListener("loadeddata", handleLoadedData);
		}
	}, []);

	return (
		<div className="mx-auto w-full lg:max-w-7xl lg:flex lg:justify-center">
			{!videoLoaded && (
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="border-4 rounded-full size-90 animate-spin"></div>
				</div>
			)}
			{/* <div className='w-screen'> */}
			<video
				ref={videoRef}
				muted
				loop
				autoPlay
				playsInline
				className={cn(
					"transition-opacity duration-1000 object-cover h-full w-full",
					videoLoaded ? "opacity-100" : "opacity-0",
				)}
			>
				<source src={"/static/videos/comingsoon.webm"} type="video/webm" />
				<source src={"/static/videos/comingsoon.mp4"} type="video/mp4" />
				Your browser does not support the video tag.
			</video>
			{/* </div> */}
			<div
				className="absolute inset-0 "
				// Needed to hide the video's black bars on lateral
				style={{
					background: `linear-gradient(90deg,
      #770205 0%,
      transparent 10%,
      transparent 84%,
      #770205 100%
    )`,
				}}
			/>
		</div>
	);
};

export default VideoBackground;
