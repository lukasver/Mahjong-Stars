import ErrorBoundary from "@mjs/ui/components/error-boundary";
import { FormError } from "@/components/form-error";

export const WithErrorHandler = <P extends object>(
  Component: React.ComponentType<P>,
) => {
  return (props: P) => {
    return (
      <ErrorBoundary
        fallback={
          <FormError
            type="custom"
            title="Error"
            message="An error occurred while processing your request"
          />
        }
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};
