module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Find and modify source-map-loader to ignore missing source maps
      const sourceMapLoaderRule = webpackConfig.module.rules.find(
        rule => rule.enforce === 'pre' && rule.use && rule.use.some(
          use => use.loader && use.loader.includes('source-map-loader')
        )
      );

      if (sourceMapLoaderRule) {
        // Exclude zustand from source-map-loader
        sourceMapLoaderRule.exclude = /node_modules\/zustand/;
      }

      return webpackConfig;
    },
  },
};
