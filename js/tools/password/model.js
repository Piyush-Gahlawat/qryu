// js/tools/password/model.js — pure logic. No DOM access.

const SETS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

const AMBIGUOUS = /[0O1lI|`'"]/g;

/* Unbiased random int using crypto (NOT Math.random) */
function randInt(max) {
    const limit = Math.floor(0xFFFFFFFF / max) * max;
    const arr = new Uint32Array(1);
    let x;
    do {
        crypto.getRandomValues(arr);
        x = arr[0];
    } while (x >= limit);
    return x % max;
}

function poolFor(set, excludeAmbiguous) {
    return excludeAmbiguous ? set.replace(AMBIGUOUS, '') : set;
}

/**
 * Generate a password.
 * options = { length, upper, lower, numbers, symbols, excludeAmbiguous }
 * Returns { ok: true, password } or { ok: false, error }
 */
export function generate(options) {
    const length = Math.max(8, Math.min(64, parseInt(options.length, 10) || 16));

    const pools = [];
    if (options.upper) pools.push(poolFor(SETS.upper, options.excludeAmbiguous));
    if (options.lower) pools.push(poolFor(SETS.lower, options.excludeAmbiguous));
    if (options.numbers) pools.push(poolFor(SETS.numbers, options.excludeAmbiguous));
    if (options.symbols) pools.push(poolFor(SETS.symbols, options.excludeAmbiguous));

    if (pools.length === 0) {
        return { ok: false, error: 'Select at least one character type.' };
    }

    const pool = pools.join('');
    const chars = [];

    // Guarantee one char from each selected set
    for (const set of pools) {
        chars.push(set[randInt(set.length)]);
    }

    // Fill the rest
    while (chars.length < length) {
        chars.push(pool[randInt(pool.length)]);
    }

    // Fisher–Yates shuffle so guaranteed chars aren't always at the front
    for (let i = chars.length - 1; i > 0; i--) {
        const j = randInt(i + 1);
        const tmp = chars[i];
        chars[i] = chars[j];
        chars[j] = tmp;
    }

    return { ok: true, password: chars.slice(0, length).join('') };
}

/**
 * Estimate password strength.
 * Returns { label: 'Weak'|'Good'|'Strong', cls: 'weak'|'good'|'strong', bits }
 */
export function strength(password) {
    if (!password) return { label: '', cls: '', bits: 0 };

    let poolSize = 0;
    if (/[a-z]/.test(password)) poolSize += 26;
    if (/[A-Z]/.test(password)) poolSize += 26;
    if (/[0-9]/.test(password)) poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) poolSize += 30;

    const bits = Math.round(password.length * Math.log2(poolSize || 1));

    if (bits < 50) return { label: 'Weak', cls: 'weak', bits };
    if (bits < 80) return { label: 'Good', cls: 'good', bits };
    return { label: 'Strong', cls: 'strong', bits };
}