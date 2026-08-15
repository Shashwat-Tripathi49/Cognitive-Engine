import { useAuth } from '@clerk/nextjs';
import { useCallback, useMemo } from 'react';
import type {
  CognitiveFragment,
  CognitiveFragmentModality,
  PaginatedResult,
  MemorySearchResult,
} from '@cognitive-engine/shared';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const DEFAULT_DEV_TOKEN =
  process.env.NEXT_PUBLIC_API_TOKEN || 'test_token_user_A';

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Internal fetch wrapper with Bearer token injection and error handling
 */
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const authToken = token || DEFAULT_DEV_TOKEN;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers || {}),
  };

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError) {
    throw new ApiClientError(
      'Unable to connect to Cognitive Engine API. Please check your connection.',
      0,
      'NETWORK_ERROR',
      networkError
    );
  }

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try {
      errorData = await response.json();
    } catch {
      // Non-JSON response
    }

    const message =
      errorData?.error?.message ||
      `API request failed with status ${response.status} (${response.statusText})`;
    const code = errorData?.error?.code || 'API_ERROR';
    const details = errorData?.error?.details;

    throw new ApiClientError(message, response.status, code, details);
  }

  return response.json() as Promise<T>;
}

/**
 * Direct API Methods (Accepts explicit Bearer token)
 */
export async function createCapture(
  text: string,
  modality: CognitiveFragmentModality = 'text',
  token?: string | null
): Promise<CognitiveFragment> {
  return fetchApi<CognitiveFragment>(
    '/capture',
    {
      method: 'POST',
      body: JSON.stringify({
        text,
        modality,
        metadata: {
          schemaVersion: 1,
          source: 'web',
        },
      }),
    },
    token
  );
}

export async function listCaptures(
  page = 1,
  limit = 20,
  token?: string | null
): Promise<PaginatedResult<CognitiveFragment>> {
  return fetchApi<PaginatedResult<CognitiveFragment>>(
    `/capture?page=${page}&limit=${limit}`,
    {
      method: 'GET',
    },
    token
  );
}

export interface MemorySearchApiResponse {
  data: MemorySearchResult[];
  query: {
    text: string;
    topK: number;
    minSimilarity: number;
  };
}

export async function searchMemories(
  query: string,
  topK = 10,
  token?: string | null
): Promise<MemorySearchApiResponse> {
  return fetchApi<MemorySearchApiResponse>(
    '/memory/search',
    {
      method: 'POST',
      body: JSON.stringify({
        query,
        topK,
        minSimilarity: 0.0,
      }),
    },
    token
  );
}

/**
 * React Hook that binds Clerk auth session token to API requests
 */
export function useApi() {
  const { getToken } = useAuth();

  const getAuthToken = useCallback(async () => {
    try {
      return await getToken();
    } catch {
      return null;
    }
  }, [getToken]);

  const capture = useCallback(
    async (text: string, modality: CognitiveFragmentModality = 'text') => {
      const token = await getAuthToken();
      return createCapture(text, modality, token);
    },
    [getAuthToken]
  );

  const getCaptures = useCallback(
    async (page = 1, limit = 20) => {
      const token = await getAuthToken();
      return listCaptures(page, limit, token);
    },
    [getAuthToken]
  );

  const search = useCallback(
    async (query: string, topK = 10) => {
      const token = await getAuthToken();
      return searchMemories(query, topK, token);
    },
    [getAuthToken]
  );

  return useMemo(
    () => ({
      createCapture: capture,
      listCaptures: getCaptures,
      searchMemories: search,
    }),
    [capture, getCaptures, search]
  );
}
