module.exports = {
    root: true,
    extends: [require.resolve('@boozingeorge/config/eslint')],
    parserOptions: {
        project: 'tsconfig.eslint.json',
    },
    rules: {
        'node/no-missing-import': [
            'error',
            {
                allowModules: [],
                resolvePaths: ['/path/to/a/modules/directory'],
                tryExtensions: ['.js', '.ts', '.json', '.node'],
            },
        ],
        'import/prefer-default-export': 0,
    },
    ignorePatterns: ['**/*.d.ts'],
};
