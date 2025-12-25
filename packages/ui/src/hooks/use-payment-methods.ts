import * as React from "react";

/**
 * Detects if the current device is an Apple device (iPhone/iPad)
 */
function isAppleDevice(): boolean {
  if (typeof window === "undefined" || !window.navigator) {
    return false;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform?.toLowerCase() || "";

  return (
    /iphone|ipad|ipod/.test(userAgent) ||
    (platform.includes("mac") && "ontouchend" in document) ||
    platform.includes("iphone") ||
    platform.includes("ipad")
  );
}

/**
 * Checks if Apple Pay is available on the device
 * Uses the Payment Request API to detect Apple Pay support
 */
async function isApplePayAvailable(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  // First check if it's an Apple device
  if (!isAppleDevice()) {
    return false;
  }

  // Check if Payment Request API is supported
  if (!window.PaymentRequest) {
    return false;
  }

  try {
    // Create a minimal payment request to check for Apple Pay
    // Note: This will only work if the page is served over HTTPS
    const supportedMethods = [
      {
        supportedMethods: "https://apple.com/apple-pay",
        data: {
          version: 3,
          merchantIdentifier: "merchant.test",
          countryCode: "US",
          currencyCode: "USD",
          supportedNetworks: ["visa", "masterCard", "amex", "discover"],
          merchantCapabilities: ["supports3DS", "supportsCredit", "supportsDebit"],
        },
      },
    ];

    const paymentRequest = new PaymentRequest(supportedMethods, {
      total: {
        label: "Test",
        amount: { currency: "USD", value: "0.01" },
      },
    });

    // Check if Apple Pay method is available
    // This will return true if:
    // 1. Device is Apple (iPhone/iPad)
    // 2. User has Apple Pay set up
    // 3. Page is served over HTTPS (or localhost)
    const canMakePayment = await paymentRequest.canMakePayment();
    return canMakePayment === true;
  } catch (error) {
    // If there's an error, assume Apple Pay is not available
    // This can happen if:
    // - Page is not served over HTTPS (except localhost)
    // - Payment Request API is not fully supported
    console.debug("Apple Pay availability check failed:", error);
    return false;
  }
}

/**
 * Checks if Google Pay is available
 * Google Pay works on both mobile and desktop (via Chrome)
 */
async function isGooglePayAvailable(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  // Check if Payment Request API is supported
  if (!window.PaymentRequest) {
    return false;
  }

  try {
    const supportedMethods = [
      {
        supportedMethods: "https://google.com/pay",
        data: {
          environment: "TEST",
          apiVersion: 2,
          apiVersionMinor: 0,
          merchantInfo: {
            merchantId: "test",
            merchantName: "Test",
          },
          allowedPaymentMethods: [
            {
              type: "CARD",
              parameters: {
                allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                allowedCardNetworks: ["VISA", "MASTERCARD"],
              },
            },
          ],
        },
      },
    ];

    const paymentRequest = new PaymentRequest(supportedMethods, {
      total: {
        label: "Test",
        amount: { currency: "USD", value: "0.01" },
      },
    });

    const canMakePayment = await paymentRequest.canMakePayment();
    return canMakePayment === true;
  } catch (error) {
    console.debug("Google Pay availability check failed:", error);
    return false;
  }
}

interface PaymentMethodAvailability {
  applePay: boolean;
  googlePay: boolean;
  isLoading: boolean;
}

/**
 * Hook to detect payment method availability
 * - Apple Pay: Only available on Apple devices (iPhone/iPad) with Apple Pay enabled
 * - Google Pay: Available on both mobile and desktop (Chrome supports it)
 */
export function usePaymentMethods(): PaymentMethodAvailability {
  const [availability, setAvailability] = React.useState<PaymentMethodAvailability>({
    applePay: false,
    googlePay: false,
    isLoading: true,
  });

  React.useEffect(() => {
    let isMounted = true;

    const checkAvailability = async () => {
      const [applePay, googlePay] = await Promise.all([
        isApplePayAvailable(),
        isGooglePayAvailable(),
      ]);

      if (isMounted) {
        setAvailability({
          applePay,
          googlePay,
          isLoading: false,
        });
      }
    };

    checkAvailability();

    return () => {
      isMounted = false;
    };
  }, []);

  return availability;
}

