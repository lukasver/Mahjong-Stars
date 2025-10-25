"use client";

import { useEffect, useState } from "react";

/**
 * Hook to check if the browser/device has camera capabilities
 * 
 * This hook performs several checks:
 * 1. Verifies if getUserMedia API is supported
 * 2. Enumerates available devices to check for video inputs
 * 3. Attempts to access the camera with minimal constraints
 * 
 * @returns Object containing:
 * - hasCamera: boolean | null - true if camera is available, false if not, null while checking
 * - isLoading: boolean - true while checking camera capabilities
 * - isCameraOnly: boolean - true if camera is available (for camera-only mode)
 * - isCameraFallback: boolean - true if camera is not available (for fallback mode)
 * - permissionState: 'unknown' | 'granted' | 'denied' | 'prompt' - camera permission state
 */
export function useCameraCapabilities() {
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');

  useEffect(() => {
    const checkCameraCapabilities = async () => {
      // Detect if we're on a mobile device
      const isMobile = typeof window !== 'undefined' && (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (window.innerWidth <= 768) ||
        ('ontouchstart' in window)
      );


      try {
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setHasCamera(false);
          setIsLoading(false);
          return;
        }

        // Check camera permission first (if supported)
        if (navigator.permissions) {
          try {
            const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
            setPermissionState(permission.state);

            if (permission.state === 'denied') {
              setHasCamera(false);
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.debug('Permission API not supported:', error);
          }
        }

        // Try to get video devices
        const devices = await navigator.mediaDevices.enumerateDevices();


        const hasVideoDevices = devices.some(device => device.kind === 'videoinput');

        if (!hasVideoDevices) {
          setHasCamera(false);
          setIsLoading(false);
          return;
        }

        // Mobile-optimized camera constraints
        // Use more flexible constraints for mobile devices
        const constraints = {
          video: isMobile ? {
            // Mobile-optimized constraints
            width: { ideal: 480, max: 1280 },
            height: { ideal: 640, max: 720 },
            facingMode: { ideal: 'user' }, // Prefer front camera for selfies
            frameRate: { ideal: 15, max: 30 },
            // Mobile-specific optimizations
            aspectRatio: { ideal: 3 / 4 } // Common mobile aspect ratio
          } : {
            // Desktop constraints
            width: { ideal: 320, max: 1280 },
            height: { ideal: 240, max: 720 },
            frameRate: { ideal: 15, max: 30 }
          }
        };

        // Try to access camera with mobile-optimized constraints
        const stream = await navigator.mediaDevices.getUserMedia(constraints);



        // If we get here, camera is available
        setHasCamera(true);

        // Stop the stream immediately to free up the camera
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.debug('Camera access failed:', error);

        // Check if it's a permission error
        if (error instanceof DOMException) {
          if (error.name === 'NotAllowedError') {
            setPermissionState('denied');
          } else if (error.name === 'NotFoundError') {
            setPermissionState('denied');
          }
        }

        setHasCamera(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkCameraCapabilities();
  }, []);

  return {
    hasCamera,
    isLoading,
    isCameraOnly: hasCamera === true,
    isCameraFallback: hasCamera === false,
    permissionState
  };
}
