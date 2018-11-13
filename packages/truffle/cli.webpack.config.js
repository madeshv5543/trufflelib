var path = require("path");
var CopyWebpackPlugin = require("copy-webpack-plugin");
var CleanWebpackPlugin = require("clean-webpack-plugin");
var webpack = require("webpack");
var pkg = require("./package.json");

var rootDir = path.join(__dirname, "../..");
var outputDir = path.join(__dirname, "build");
var outputFilename = "cli.bundled.js";

module.exports = {
  entry: {
    cli: path.join(
      __dirname,
      "../..",
      "node_modules",
      "truffle-core",
      "cli.js"
    ),
    chain: path.join(
      __dirname,
      "../..",
      "node_modules",
      "truffle-core",
      "chain.js"
    ),
    analytics: path.join(
      __dirname,
      "../..",
      "node_modules",
      "truffle-core",
      "lib",
      "services",
      "analytics",
      "main.js"
    )
  },
  target: "node",
  node: {
    // For this option, see here: https://github.com/webpack/webpack/issues/1599
    __dirname: false,
    __filename: false
  },
  context: rootDir,
  output: {
    path: outputDir,
    filename: "[name].bundled.js"
  },
  devtool: "source-map",
  module: {
    rules: [
      { test: /\.js$/, use: "shebang-loader" },
      { test: /rx\.lite\.aggregates\.js/, use: "imports-loader?define=>false" }
    ]
  },
  externals: [
    // If you look at webpack's docs, `externals` doesn't need to be a function.
    // But I never got it to work otherwise, so this is a function because "it works".
    function(context, request, callback) {
      // truffle-config uses the original-require module.
      // Here, we leave it as an external, and use the original-require
      // module that's a dependency of Truffle instead.
      if (/^original-require$/.test(request)) {
        return callback(null, "commonjs original-require");
      }

      // We want to leave solc as an eternal dependency as well (for now)
      if (/^solc$/.test(request)) {
        return callback(null, "commonjs solc");
      }

      // Mocha doesn't seem to bundle well either. This is a stop-gap until
      // I can look into it further.
      if (/^mocha$/.test(request)) {
        return callback(null, "commonjs mocha");
      }

      callback();
    }
  ],
  plugins: [
    new webpack.DefinePlugin({
      BUNDLE_VERSION: JSON.stringify(pkg.version),
      BUNDLE_CHAIN_FILENAME: JSON.stringify("chain.bundled.js"),
      BUNDLE_ANALYTICS_FILENAME: JSON.stringify("analytics.bundled.js")
    }),

    // Put the shebang back on.
    new webpack.BannerPlugin({ banner: "#!/usr/bin/env node\n", raw: true }),

    // `truffle test`
    new CopyWebpackPlugin([
      {
        from: path.join(
          __dirname,
          "../..",
          "node_modules",
          "truffle-core",
          "lib",
          "testing",
          "Assert.sol"
        )
      },
      {
        from: path.join(
          __dirname,
          "../..",
          "node_modules",
          "truffle-core",
          "lib",
          "testing",
          "SafeSend.sol"
        )
      },
      {
        from: path.join(
          __dirname,
          "../..",
          "node_modules",
          "truffle-core",
          "lib",
          "templates/"
        ),
        to: "templates",
        flatten: true
      }
    ]),

    new CleanWebpackPlugin(["build"]),

    // Make web3 1.0 packable
    new webpack.IgnorePlugin(/^electron$/)
  ],
  resolve: {
    alias: {
      // fsevents is used by chokidar and is an optional requirement
      // It doesn't pack well, and is OS X specific, so let's get rid of it.
      "fsevents": path.join(__dirname, "./nil.js"),
      "ws": path.join(__dirname, "./nil.js"),
      "original-fs": path.join(__dirname, "./nil.js"),
      "scrypt": "js-scrypt"
    }
  },
  stats: {
    warnings: false
  }
};