// worker.js
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;

        // 1. Block sensitive paths immediately
        const blocked = [
            '/.git',
            '/wrangler.jsonc',
            '/worker.js',
            '/package.json',
            '/package-lock.json',
            '/.env',
            '/.dev.vars'
        ];

        if (blocked.some(p => path === p || path.startsWith(p + '/'))) {
            return new Response('Not Found', { status: 404 });
        }

        // 2. Serve the root index.html for the homepage
        if (path === '/') {
            return env.ASSETS.fetch(new URL('/index.html', request.url));
        }

        // 3. Everything else falls through to static assets
        return env.ASSETS.fetch(request);
    }
};