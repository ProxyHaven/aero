import { debug } from "./shared/config";

import webpackShared from "./shared/webpackShared";

import { Configuration } from "webpack";

let webpackConfig: Configuration = webpackShared;

const debug = process.argv.includes("--debug");

webpackConfig = {
	...webpackConfig,
	module: {
		rules: [
			{
				// TODO: Somehow make it so that the template strings in val.ts files are formatted by prettier
				test: /\.val.ts/,
				use: [
					{
						loader: "val-loader",
					},
				],
			},
			{
				...webpackConfig.module.rules,
				loader: debug ? "ts-loader" : "swc-loader",
			},
		],
	},
	plugins: [
		// @ts-ignore
		...webpackConfig.plugins,
		// @ts-ignore
		require("unplugin-resolve-esm-ts-paths/webpack")(),
	],
};

export default webpackConfig;
