// Live GitHub repo loader for the Projects district.
//
// fetchRepos(username) pulls a user's PUBLIC repos from the GitHub REST API,
// normalizes + filters + ranks them, and caches the result in localStorage with
// a 1-hour TTL. It NEVER throws: on any failure (no username, network error,
// rate-limit, 404, bad JSON) it returns null — and if a stale cache exists it
// serves that instead. The Projects district falls back to resume data when the
// return is null/empty, so the world is always populated.
//
// Normalized repo shape:
//   { name, description, language, stars, url, homepage, updated }

const TTL_MS = 60 * 60 * 1000;        // 1 hour
const MAX_REPOS = 30;
const cacheKey = (username) => `gh:repos:${username}`;

// Read a fresh-or-stale cache entry. Returns { repos, fresh } or null.
function readCache(username) {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(cacheKey(username));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.repos)) return null;
    const fresh = typeof parsed.ts === 'number' && Date.now() - parsed.ts < TTL_MS;
    return { repos: parsed.repos, fresh };
  } catch {
    return null;
  }
}

function writeCache(username, repos) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(cacheKey(username), JSON.stringify({ ts: Date.now(), repos }));
  } catch {
    // localStorage may be full or disabled (private mode) — non-fatal.
  }
}

// Map the raw GitHub API objects to our compact, filtered, sorted, capped list.
function normalize(rawList) {
  return rawList
    .filter((r) => r && !r.fork && !r.archived)
    .map((r) => ({
      name: r.name,
      description: r.description || '',
      language: r.language || '',
      stars: r.stargazers_count || 0,
      url: r.html_url,
      homepage: r.homepage || '',
      updated: r.pushed_at || r.updated_at || '',
    }))
    .sort((a, b) => {
      if (b.stars !== a.stars) return b.stars - a.stars;            // stars DESC
      return new Date(b.updated) - new Date(a.updated);             // then updated DESC
    })
    .slice(0, MAX_REPOS);
}

export async function fetchRepos(username) {
  try {
    if (!username) return null;

    // Serve a fresh cache without hitting the network.
    const cached = readCache(username);
    if (cached && cached.fresh) return cached.repos;

    const url =
      `https://api.github.com/users/${encodeURIComponent(username)}` +
      `/repos?per_page=100&sort=updated&type=owner`;

    const res = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json' },
    });

    // Rate-limit / 404 / any non-2xx → fall back to stale cache if we have it.
    if (!res.ok) {
      return cached ? cached.repos : null;
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      return cached ? cached.repos : null;
    }

    const repos = normalize(data);
    writeCache(username, repos);
    return repos;
  } catch {
    // Network failure or JSON parse error → stale cache if present, else null.
    const cached = readCache(username);
    return cached ? cached.repos : null;
  }
}
