const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

// Produces a CommonJS handler that the platform function simply requires. The
// bundle is built here rather than on the host so nothing has to compile
// decorators at deploy time.
module.exports = {
  output: {
    path: join(__dirname, 'dist-serverless'),
    clean: true,
    library: { type: 'commonjs2' },
  },
  externals: [
    {
      'class-validator': 'commonjs class-validator',
      'class-transformer': 'commonjs class-transformer',
      'class-transformer/cjs/storage': 'commonjs class-transformer/cjs/storage',
    },
  ],
  resolve: {
    alias: {
      'class-transformer/storage': false,
    },
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/serverless.ts',
      tsConfig: './tsconfig.app.json',
      assets: [],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMap: false,
      mergeExternals: true,
    }),
  ],
};
