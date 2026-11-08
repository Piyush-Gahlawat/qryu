export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;

        // ---- Block sensitive paths ----
        const blocked = [
            '/.git', '/.gitignore', '/.gitattributes',
            '/.env', '/.env.local', '/.dev.vars',
            '/.assetsignore', '/.wrangler', '/.github',
            '/.DS_Store', '/Thumbs.db',
            '/wrangler.jsonc', '/wrangler.toml', '/worker.js',
            '/package.json', '/package-lock.json',
            '/yarn.lock', '/pnpm-lock.yaml',
            '/README.md', '/LICENSE', '/CHANGELOG.md'
        ];

        if (blocked.some(p => path === p || path.startsWith(p + '/'))) {
            return new Response('Not Found', { status: 404 });
        }

        // ---- Rate limiting (fail-open) ----
        // If the binding is missing, throws, or takes too long, we serve the
        // request rather than break the site. A broken rate limiter is worse
        // than no rate limiter.
        if (env.GLOBAL_LIMITER) {
            try {
                const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
                const result = await Promise.race([
                    env.GLOBAL_LIMITER.limit({ key: ip }),
                    new Promise((resolve) => setTimeout(() => resolve({ success: true }), 500))
                ]);
                if (result && result.success === false) {
                    return new Response('Too Many Requests', {
                        status: 429,
                        headers: { 'Retry-After': '60' }
                    });
                }
            } catch (err) {
                console.error('Rate limiter error (failing open):', err && err.message ? err.message : err);
            }
        }

        // ---- Serve root index.html for / ----
        if (path === '/') {
            return env.ASSETS.fetch(new URL('/index.html', request.url));
        }

        // ---- Fall through to static assets ----
        return env.ASSETS.fetch(request);
    }
};