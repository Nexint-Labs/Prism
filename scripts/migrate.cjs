
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

const directories = [
    'config',
    'functions',
    'preload',
    'console'
];

const rootAliases = {
    'config.js': '#app-config',
    'bot.js': '#bot',
    'index.js': '#index'
};

const ignored = new Set([
    'node_modules',
    '.git',
    'coverage',
    'dist',
    'build'
]);

// Usage:
// node scripts/migrate.cjs          Preview
// node scripts/migrate.cjs --write  Apply
const write = process.argv.includes('--write');

let changedFiles = 0;
let changedImports = 0;
let recoveredImports = 0;
let unresolved = 0;

const requireRegex =
    /\brequire\s*\(\s*(['"])(\.[^'"]+)\1\s*\)/g;

function toPosix(value) {
    return value.split(path.sep).join('/');
}

function isFile(file) {
    try {
        return fs.statSync(file).isFile();
    } catch {
        return false;
    }
}

function existingJS(file) {
    const candidates = path.extname(file)
        ? [file]
        : [
            file + '.js',
            path.join(file, 'index.js')
        ];

    return candidates.find(isFile) || null;
}

function getAlias(target) {
    const relative = toPosix(path.relative(root, target));

    // Explicit aliases for root-level files.
    if (Object.hasOwn(rootAliases, relative)) {
        return rootAliases[relative];
    }

    // Wildcard aliases for root directories.
    const parts = relative.split('/');

    if (!directories.includes(parts[0])) {
        return null;
    }

    if (!relative.endsWith('.js')) {
        return null;
    }

    return '#' + relative.slice(0, -3);
}

function resolveImport(file, specifier) {
    // First try the original relative path.
    const absolute = path.resolve(
        path.dirname(file),
        specifier
    );

    const valid = existingJS(absolute);

    if (valid) {
        return {
            target: valid,
            recovered: false
        };
    }

    // Try recovering broken paths after folder moves.
    const normalized = specifier.replace(/\\/g, '/');
    const parts = normalized.split('/');
    const matches = new Set();

    // Recover imports into known root directories.
    for (let i = 0; i < parts.length; i++) {
        if (!directories.includes(parts[i])) {
            continue;
        }

        const candidate = existingJS(
            path.join(root, ...parts.slice(i))
        );

        if (candidate && getAlias(candidate)) {
            matches.add(candidate);
        }
    }

    // Recover imports into root-level files.
    const basename = path.posix.basename(normalized);

    if (Object.hasOwn(rootAliases, basename)) {
        const candidate = path.join(root, basename);

        if (isFile(candidate)) {
            matches.add(candidate);
        }
    }

    // Never guess between multiple possible targets.
    if (matches.size !== 1) {
        return null;
    }

    return {
        target: [...matches][0],
        recovered: true
    };
}

function migrate(file) {
    const original = fs.readFileSync(file, 'utf8');
    let replacements = 0;

    const updated = original.replace(
        requireRegex,
        (match, quote, specifier) => {
            const result = resolveImport(file, specifier);

            if (!result) {
                unresolved++;

                console.warn(
                    `SKIPPED ${toPosix(path.relative(root, file))}: ${specifier}`
                );

                return match;
            }

            const alias = getAlias(result.target);

            if (!alias) {
                return match;
            }

            replacements++;

            if (result.recovered) {
                recoveredImports++;

                console.log(
                    `RECOVERED ${toPosix(path.relative(root, file))}: ` +
                    `${specifier} -> ${alias}`
                );
            }

            return `require(${quote}${alias}${quote})`;
        }
    );

    if (!replacements) {
        return;
    }

    changedFiles++;
    changedImports += replacements;

    console.log(
        `${toPosix(path.relative(root, file))}: ${replacements} imports`
    );

    if (write) {
        fs.writeFileSync(file, updated, 'utf8');
    }
}

function walk(directory) {
    for (const entry of fs.readdirSync(directory, {
        withFileTypes: true
    })) {
        if (ignored.has(entry.name)) {
            continue;
        }

        const file = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            walk(file);
            continue;
        }

        if (
            entry.isFile() &&
            /\.(js|cjs)$/.test(entry.name) &&
            path.resolve(file) !== path.resolve(__filename)
        ) {
            migrate(file);
        }
    }
}

walk(root);

console.log('\nMigration summary');
console.log('-----------------');
console.log(`Mode: ${write ? 'WRITE' : 'DRY RUN'}`);
console.log(`Imports: ${changedImports}`);
console.log(`Recovered: ${recoveredImports}`);
console.log(`Files: ${changedFiles}`);
console.log(`Unresolved: ${unresolved}`);
