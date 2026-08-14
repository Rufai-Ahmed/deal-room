const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  // Nest reaches for these through a dynamic require, so webpack bundles a
  // second copy alongside the one our decorators wrote to. Two copies means two
  // metadata stores: @Type stops applying and every nested DTO then validates as
  // though it declared no properties. Nx's own nodeExternals only scans the
  // workspace root node_modules, which pnpm leaves almost empty, so these have
  // to be named explicitly. mergeExternals keeps Nx's list as well as this one.
  externals: [
    {
      'class-validator': 'commonjs class-validator',
      'class-transformer': 'commonjs class-transformer',
      'class-transformer/cjs/storage': 'commonjs class-transformer/cjs/storage',
    },
  ],
  resolve: {
    alias: {
      // @nestjs/mapped-types probes two paths for that storage inside a
      // try/catch. Only the cjs one exists in v0.5 and webpack fails the build
      // on the other unless it is stubbed.
      'class-transformer/storage': false,
    },
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMap: true,
      mergeExternals: true,
    }),
  ],
};
