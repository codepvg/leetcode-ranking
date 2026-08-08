"use strict";

const axios = require("axios");

/** Maximum number of retry attempts for a failed request. */
const MAX_RETRIES = 3;

/** Base delay (ms) before the first retry; doubles with each attempt. */
const INITIAL_DELAY_MS = 1000;

/** Jitter window (ms) added to each retry to de-correlate concurrent retries. */
const JITTER_MS = 1000;

/**
 * Parses a `Retry-After` header (RFC 7231: delay-seconds or an HTTP-date) into
 * milliseconds. Returns 0 when the header is absent or unparseable.
 */
function parseRetryAfter(headers) {
  const value = headers && (headers["retry-after"] || headers["Retry-After"]);
  if (!value) return 0;

  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

  const dateMs = Date.parse(value);
  if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now());

  return 0;
}

/** Global flag to ensure the interceptor is only registered once per process. */
let interceptorRegistered = false;

/**
 * Registers an axios response interceptor that automatically retries failed
 * requests caused by rate-limiting (429), server errors (5xx), or network
 * failures (timeout / connection errors).
 *
 * Retries use exponential backoff with jitter up to {@link MAX_RETRIES} times.
 *
 * Safe to call multiple times — the interceptor is only attached on the first
 * invocation.
 */
function setupRetryInterceptor() {
  if (interceptorRegistered) {
    return;
  }

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { config } = error;

      if (!config) {
        return Promise.reject(error);
      }

      config.__retryCount = config.__retryCount || 0;

      const isRateLimited = error.response && error.response.status === 429;
      const isServerError =
        error.response &&
        error.response.status >= 500 &&
        error.response.status <= 599;
      const isNetworkError =
        !error.response ||
        error.code === "ECONNABORTED" ||
        error.message.includes("timeout");

      const shouldRetry =
        (isRateLimited || isServerError || isNetworkError) &&
        config.__retryCount < MAX_RETRIES;

      if (shouldRetry) {
        config.__retryCount += 1;

        // Exponential backoff, but never retry sooner than the server's
        // Retry-After (sent on 429s). Without this, a batch of concurrent 429s
        // all back off by the same ~exponential amount and re-hammer the API in
        // lockstep (thundering herd). A full-second jitter window de-correlates
        // the batch so retries spread out.
        const backoffDelay =
          INITIAL_DELAY_MS * Math.pow(2, config.__retryCount - 1);
        const retryAfter = error.response
          ? parseRetryAfter(error.response.headers)
          : 0;
        const jitter = Math.random() * JITTER_MS;
        const delay = Math.max(backoffDelay, retryAfter) + jitter;

        console.warn(
          `[Retry ${config.__retryCount}/${MAX_RETRIES}] Request failed for ${config.url} (${error.message}). Retrying in ${Math.round(delay)}ms...`,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        return axios(config);
      }

      return Promise.reject(error);
    },
  );

  interceptorRegistered = true;
}

module.exports = {
  setupRetryInterceptor,
  parseRetryAfter,
  MAX_RETRIES,
  INITIAL_DELAY_MS,
};
