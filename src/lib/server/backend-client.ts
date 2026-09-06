import "server-only";

import { logger } from "@/lib/server/logger";

interface BackendRequestInput {
  body?: string;
  contentType?: string;
  cookie?: string;
  method: string;
  path: string;
  signal?: AbortSignal;
}

interface DescribeRequestInput {
  cookiePresent: boolean;
  method: string;
  url: URL;
}

interface DescribeResponseInput extends DescribeRequestInput {
  status: number;
}

const getBackendOrigin = (): string => {
  const backendOrigin = process.env["BACKEND_API_ORIGIN"];

  if (!backendOrigin) {
    logger.fail({
      message: "BACKEND_API_ORIGIN is missing",
      detail:
        "Set BACKEND_API_ORIGIN=http://127.0.0.1:4000 on the Next.js process, then restart it.",
    });
    throw new Error("BACKEND_API_ORIGIN is required");
  }

  return backendOrigin;
};

const describeRequest = ({
  method,
  url,
  cookiePresent,
}: DescribeRequestInput): string => {
  return `${method} ${url.toString()} cookie=${cookiePresent ? "yes" : "no"}`;
};

const describeResponse = ({
  method,
  url,
  cookiePresent,
  status,
}: DescribeResponseInput): string => {
  return `${describeRequest({ method, url, cookiePresent })} → ${String(status)}`;
};

export const requestBackend = async ({
  path,
  method,
  body,
  contentType,
  cookie,
  signal,
}: BackendRequestInput): Promise<Response> => {
  const url = new URL(path, getBackendOrigin());
  const cookiePresent = Boolean(cookie);
  const requestDetail = describeRequest({ method, url, cookiePresent });

  logger.info({
    message: "Next → Express",
    detail: requestDetail,
  });

  const headers = new Headers();

  if (contentType) {
    headers.set("content-type", contentType);
  } else if (body) {
    headers.set("content-type", "application/json");
  }

  if (cookie) {
    headers.set("cookie", cookie);
  }

  try {
    const response = await fetch(url, {
      method,
      body,
      headers,
      cache: "no-store",
      signal,
    });

    const responseDetail = describeResponse({
      method,
      url,
      cookiePresent,
      status: response.status,
    });

    if (!response.ok) {
      logger.warn({
        message: "Express returned an error status",
        detail: responseDetail,
      });
      return response;
    }

    logger.success({
      message: "Express responded",
      detail: responseDetail,
    });

    return response;
  } catch (error) {
    if (error instanceof Error) {
      logger.fail({
        message: "Next could not reach Express",
        detail: requestDetail,
        error,
      });
      throw error;
    }

    logger.fail({
      message: "Next could not reach Express",
      detail: requestDetail,
    });
    throw new Error("Backend request failed");
  }
};

/*
 * Learning notes
 *
 * Server boundary
 * - `server-only` makes the build fail if browser code imports this file.
 * - Only environment variables prefixed with `NEXT_PUBLIC_` are included in
 *   browser JavaScript. `BACKEND_API_ORIGIN` therefore stays on the server.
 *
 *
 * URL construction
 * - `new URL(path, origin)` safely combines the Express origin and route path.
 *
 *   Local:
 *   origin = `http://localhost:4000`
 *   path   = `/api/v1/auth/login`
 *   result = `http://localhost:4000/api/v1/auth/login`
 *
 *   Production:
 *   origin = `http://127.0.0.1:4000`
 *   path   = `/api/v1/auth/login`
 *   result = `http://127.0.0.1:4000/api/v1/auth/login`
 *
 * Request content type
 * - An incoming content type is forwarded unchanged.
 * - A request with a body but no content type defaults to `application/json`,
 *   which matches the current Express API contract.
 *
 * Fetch caching
 * - Next.js extends server-side `fetch`. `cache: "no-store"` makes every
 *   request reach Express instead of entering Next.js's persistent data cache.
 * - Passing the browser request signal cancels the Express request when the
 *   browser disconnects before the response completes.
 */
