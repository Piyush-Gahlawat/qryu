export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;

        // 1. Block sensitive paths immediately
        const blocked = [
            '/.git',
            '/.gitignore',
            '/.gitattributes',
            '/.env',
            '/.env.local',
            '/.dev.vars',
            '/.assetsignore',
            '/.wrangler',
            '/.github',
            '/.DS_Store',
            '/wrangler.jsonc',
            '/wrangler.toml',
            '/worker.js',
            '/package.json',
            '/package-lock.json',
            '/yarn.lock',
            '/pnpm-lock.yaml',
            '/README.md',
            '/LICENSE',
            '/CHANGELOG.md',
            '/Thumbs.db'
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