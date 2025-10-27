// frontend/src/offline/executors/httpExecutors.ts

import type { AxiosInstance, AxiosRequestConfig, Method } from 'axios';
import { OfflineJobExecutor } from '../offlineQueueService';
import { OfflineRequestConfig } from '../offlineJob.types';

// Defines possible types for query parameter values
type QueryValue = string | number | boolean | null | undefined;

/**
 * Converts an object of query parameters into a URLSearchParams instance,
 * removing any undefined or null values.
 */
function sanitizeParams(params?: Record<string, QueryValue>): URLSearchParams | undefined {
    if (!params) return undefined;
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        searchParams.append(key, String(value));
    });

    return searchParams;
}

/**
 * Resolves a complete URL string, appending query parameters if provided.
 * - Supports relative and absolute URLs.
 * - Falls back to concatenation if no `window` or `baseUrl` is available (e.g., Node.js environment).
 */
function resolveUrl(url: string, params?: Record<string, QueryValue>, baseUrl?: string): string {
    const searchParams = sanitizeParams(params);

    if (baseUrl) {
        const target = new URL(url, baseUrl);
        if (searchParams) {
            searchParams.forEach((value, key) => target.searchParams.append(key, value));
        }
        return target.toString();
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
        if (!searchParams) return url;
        const target = new URL(url);
        searchParams.forEach((value, key) => target.searchParams.append(key, value));
        return target.toString();
    }

    // If running in a browser, resolve relative URLs using the current origin
    if (typeof window !== 'undefined') {
        const target = new URL(url, window.location.origin);
        if (searchParams) {
            searchParams.forEach((value, key) => target.searchParams.append(key, value));
        }
        return target.toString();
    }

    // Fallback for non-browser environments (e.g., Node)
    const queryString = searchParams ? `?${searchParams.toString()}` : '';
    return `${url}${queryString}`;
}

/**
 * Normalizes a request body into a format suitable for Fetch API.
 * Converts objects into JSON strings and preserves FormData, Blob, etc.
 */
function normaliseBody(body: OfflineRequestConfig['body']): BodyInit | undefined {
    if (body === undefined || body === null) return undefined;
    if (typeof body === 'string') return body;
    if (body instanceof Blob || body instanceof FormData || body instanceof ArrayBuffer) return body as BodyInit;
    return JSON.stringify(body);
}

/**
 * Creates an executor that replays queued offline requests using Axios.
 * This allows the offline queue to send stored jobs through Axios once back online.
 */
export function createAxiosExecutor<TBody = any, TMeta = Record<string, unknown>>(
    client: AxiosInstance
): OfflineJobExecutor<TBody, TMeta> {
    return async (job) => {
        const { url, method, body, headers, params } = job.request;
        const config: AxiosRequestConfig = {
            url,
            method: method.toLowerCase() as Method,
            data: body,
            headers,
            params,
        };
        await client.request(config);
    };
}

/**
 * Optional configuration for the Fetch-based executor.
 */
export interface FetchExecutorOptions {
    baseUrl?: string;
    /**
     * Optional callback to modify or extend the RequestInit before the fetch call.
     */
    prepareInit?: (job: OfflineRequestConfig) => Partial<RequestInit>;
}

/**
 * Creates an executor that replays queued offline requests using the Fetch API.
 * Useful in environments where Axios is not needed or desired.
 */
export function createFetchExecutor<TBody = any, TMeta = Record<string, unknown>>(
    options: FetchExecutorOptions = {}
): OfflineJobExecutor<TBody, TMeta> {
    return async (job) => {
        const { url, method, body, headers, params } = job.request;
        const targetUrl = resolveUrl(url, params, options.baseUrl);

        const requestInit: RequestInit = {
            method,
            headers,
            body: normaliseBody(body),
        };

        // Allow the user to modify the request before sending it
        if (options.prepareInit) {
            Object.assign(requestInit, options.prepareInit(job.request));
        }

        // Execute the request and throw an error if the response is not successful
        const response = await fetch(targetUrl, requestInit);
        if (!response.ok) {
            throw new Error(`Failed to replay offline request: ${response.status} ${response.statusText}`);
        }
    };
}
