import path from "path";
import { fileURLToPath } from "url";
import CopyPlugin from "copy-webpack-plugin";
import { VueLoaderPlugin } from "vue-loader";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: "development",
  devtool: "source-map",
  entry: {
    background: "./src/background.js",
    content: "./src/content.js",
    app: "./src/app.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: "vue-loader",
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.s(c|a)ss$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
      },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({
      filename: "styles.css",
    }),
    new CopyPlugin({
      patterns: [
        { from: "./src/manifest.json" },
        { from: "./src/app.html" },
        { from: "./src/content.css" },
        { from: "./src/icons", to: "icons" },
      ],
    }),
  ],
  resolve: {
    extensions: [".js", ".vue"],
    alias: {
      "@": path.resolve(__dirname, "src"),
      vue$: "vue/dist/vue.js",
    },
  },
};
