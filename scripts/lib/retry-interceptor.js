"use strict";

const axios = require("axios");

/** Maximum number of retry attempts for a failed request. */
const MAX_RETRIES = 3;

/** Base delay (ms) before the first retry; doubles with each attempt. */
const INITIAL_DELAY_MS = 1000;

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

        // Exponential backoff with jitter
        const backoffDelay =
          INITIAL_DELAY_MS * Math.pow(2, config.__retryCount - 1);
        const jitter = Math.random() * 200;
        const delay = backoffDelay + jitter;

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

module.exports = { setupRetryInterceptor, MAX_RETRIES, INITIAL_DELAY_MS };
