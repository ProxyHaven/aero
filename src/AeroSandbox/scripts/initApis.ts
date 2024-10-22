/**
 * @module
 * This script generates a typescript file that exports an enum of all the API interceptors in AeroSandbox
 * It is automatically ran when AeroSandbox is built with `npm run build`
 * This script can be used as an individual CLI app with `npm run initApis`
 */

import path from "node:path";
import { access, mkdir } from "node:fs/promises";
import { writeFileSync } from "node:fs";

import { createApiInterceptorIteratorNodeSync } from "../build/createApiInterceptorIteratorNode";

const apiGlobalProps: string[] = Array.from(
	createApiInterceptorIteratorNodeSync(),
).map((aI) => aI.globalProp);

export { apiGlobalProps };

/**
 * Creates a types file that exports an enum of all the API interceptors in AeroSandbox
 * @param output Where to place the file
 * @param distDir Where the dist dir should be created
 * @param logStatus Should messages be logged?
 */
export default function initApis(
	output = "../types/dist/apis.d.ts",
	distDir: string | null | undefined = path.resolve(
		__dirname,
		"..",
		"types",
		"dist",
	),
	logStatus = true,
) {
	if (distDir) initDist(distDir, logStatus);
	const contents =
		`// Autogenerated by \`initApis.ts\`\nexport enum APIBitwiseEnum {\n${
			apiGlobalProps.join(",\n")
		}\n};`;
	writeFileSync(output, contents, {
		flag: "w",
	});
	if (logStatus) {
		console.log(
			`Successfully wrote the API Bitwise Enum to ${output} with contents: \n${contents}`,
		);
	}
}

function initDist(distDir: string, logStatus: boolean) {
	if (logStatus) console.log("Initializing the dist folder");
	access(distDir)
		// If dir doesn't exist
		.catch(() => createDistDir(distDir, logStatus));
}
function createDistDir(distDir: string, logStatus: boolean) {
	if (logStatus) console.log("Creating the dist folder");
	mkdir(distDir);
}

// If the file is being ran as a CLI script
if (require.main === module) {
	const output = process.env.OUTPUT;
	const distDir = process.env.DIST_DIR;
	const logStatus =
		process.env.LOG_STATUS !== "true" && process.env.LOG_STATUS !== "false"
			? undefined
			: process.env.LOG_STATUS === "true";
	initGlobalsTs(output, distDir, logStatus);
}
