import ErrorBoundary from "@mjs/ui/components/error-boundary";
import { FormError } from "@/components/form-error";
import { SwitchNetworkButton } from '@/components/switch-network-button';

export const WithErrorHandler = <P extends object>(
  Component: React.ComponentType<P>,
) => {
  return (props: P) => {
    console.debug('WithErrorHandler', props);
    return (
      <ErrorBoundary
        fallback={
          <FormError
            type="switch-network"
            title="Error"
            message="Payment with this token not supported on this network, please try a different network"
          >
            <div className="w-full flex justify-center">
              <SwitchNetworkButton />
            </div>
          </FormError>
        }
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

/**
 * Recursively converts all BigInt instances in an object to strings for safe serialization.
 * This allows objects containing BigInt values to be logged or stringified.
 * @param value - The input object or value to process.
 * @returns The object with all BigInt instances converted to strings.
 */
export function bigIntToString<T>(value: T): T {
  function isPlainObject(val: unknown): val is Record<string, unknown> {
    return (
      typeof val === "object" &&
      val !== null &&
      Object.getPrototypeOf(val) === Object.prototype
    );
  }
  function convert(val: unknown): unknown {
    if (typeof val === "bigint") {
      return val.toString();
    }
    if (Array.isArray(val)) {
      return val.map(convert);
    }
    if (isPlainObject(val)) {
      const obj = val as Record<string, unknown>;
      const result: Record<string, unknown> = {};
      for (const key in obj) {
        if (Object.hasOwn(obj, key)) {
          result[key] = convert(obj[key]);
        }
      }
      return result;
    }
    return val;
  }
  return convert(value) as T;
}

/**
 * Safely logs an object that may contain BigInt values by converting them to strings.
 * @param label - The label to use for the log message.
 * @param data - The data object to log (may contain BigInt values).
 */
export function logWithBigInt(label: string, data: unknown): void {
  const serialized = bigIntToString(data);
  console.debug(label, JSON.stringify(serialized, null, 2));
}
