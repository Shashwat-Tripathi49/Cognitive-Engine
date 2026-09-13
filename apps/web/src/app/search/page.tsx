import { redirect } from 'next/navigation';

/**
 * SearchRedirectPage
 *
 * Architectural Decision:
 * In accordance with our product mental model (RECORD ➔ ARCHIVES), Search is a
 * capability directly inside Archives (/archives?q=...), not a separate top-level destination.
 * Any incoming links or bookmarks to /search are cleanly redirected to /archives.
 */
export default async function SearchRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const queryString = params?.q ? `?q=${encodeURIComponent(params.q)}` : '';
  redirect(`/archives${queryString}`);
}
