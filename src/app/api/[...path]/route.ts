import { requestBackend } from "@/lib/server/backend-client";
import { logger } from "@/lib/server/logger";

const proxyRequest = async (request: Request): Promise<Response> => {
  const requestUrl = new URL(request.url);
  const path = `${requestUrl.pathname}${requestUrl.search}`;

  logger.info({
    message: "Browser → Next BFF",
    detail: `${request.method} ${path}`,
  });

  try {
    const canHaveBody = request.method !== "GET" && request.method !== "HEAD";
    const body = canHaveBody ? await request.text() : undefined;

    return await requestBackend({
      body,
      contentType: request.headers.get("content-type") ?? undefined,
      cookie: request.headers.get("cookie") ?? undefined,
      method: request.method,
      path,
      signal: request.signal,
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.fail({
        message: "BFF could not forward to Express",
        detail: `${request.method} ${path}`,
        error,
      });
    } else {
      logger.fail({
        message: "BFF could not forward to Express",
        detail: `${request.method} ${path}`,
      });
    }

    const message =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "Backend service is unavailable";

    return Response.json({ message }, { status: 502 });
  }
};

export const DELETE = proxyRequest;
export const GET = proxyRequest;
export const HEAD = proxyRequest;
export const PATCH = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;

/*
 * Learning notes
 *
 * Dynamic Route Handler
 * - `[...path]` matches every nested URL below `/api`.
 * - The browser path and query string are forwarded to the fixed Express
 *   origin; the browser never supplies a destination origin.
 *
 * Request forwarding
 * - GET and HEAD requests cannot contain a request body.
 * - Other methods forward the original text, content type, cookie, and abort
 *   signal. User media will use direct signed CDN uploads instead of this path.
 * - The Express response is returned unchanged, including status and cookies.
 *
 * Failure handling
 * - Express HTTP errors such as 401 and 422 are returned unchanged.
 * - Transport error details are visible only during local development.
 *   Production returns a generic message to avoid leaking internal details.
 *
 * Production architecture
 * - Next.js 14.1 and 16.3 both support App Router Route Handlers.
 * - Nginx routes `/api/*` to Next.js so this BFF keeps browser API traffic
 *   same-origin and forwards it to the private Express listener.
 */
