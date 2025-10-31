/**
 * Gets the current deployment ID.
 * Prefers Vercel's VERCEL_GIT_COMMIT_SHA, falls back to package.json version.
 * This is used at build time to inject the deployment ID into the client bundle.
 *
 * @returns The deployment ID string
 */
export function getDeploymentId(): string {
	if (process.env.VERCEL_GIT_COMMIT_SHA) {
		return process.env.VERCEL_GIT_COMMIT_SHA;
	}
	if (typeof process.env.PACKAGE_VERSION !== "undefined") {
		return process.env.PACKAGE_VERSION;
	}
	return "unknown";
}
