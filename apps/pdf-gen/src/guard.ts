/**
 * Checks if the provided API key matches the expected secret from environment variables.
 * @param secret - The API key provided in the request header.
 * @returns True if authorized, false otherwise.
 */
export const checkAuth = (secret: string): boolean => {
  const expectedSecret = process.env.PDF_GEN_API_KEY;
  if (!secret || !expectedSecret) return false;
  return secret === expectedSecret;
};
