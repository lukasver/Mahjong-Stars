"use client";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// You can log the error to an error reporting service here
		console.error("Error caught by boundary:", error);
		console.error("Error info:", errorInfo);
	}

	render() {
		if (this.state.hasError) {
			// You can render any custom fallback UI
			return this.props.fallback === null
				? null
				: (this.props.fallback ?? (
					<div className="error-boundary-fallback">
						<h2>Something went wrong</h2>
						<details>
							<summary>Error Details</summary>
							<pre>{this.state.error?.message}</pre>
						</details>
					</div>
				));
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
