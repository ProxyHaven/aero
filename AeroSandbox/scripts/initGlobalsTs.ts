/**
 * @module
 */

// Neverthrow
import type { Result } from "neverthrow";
import { err as nErr, ok } from "neverthrow";
import { fmtNeverthrowErr } from "../tests/shared/fmtErrTest.ts";

import { accessSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { default as createDefaultFeatureFlags_AeroSandbox } from "../createDefaultFeatureFlags.ts";
import { default as createDefaultFeatureFlags_aero } from "../../aeroSW/createDefaultFeatureFlags.ts"
import { featureFlagsBuilderRaw } from "../featureFlagsBuilder.ts";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

/**
 * Inits the feature flags in the global scope for TS files, so that they won't error in your IDE 
 * @param output The TS types file to output to
 * @param createDefaultFeatureFlags The method to create the default feature flags from
 * @returns The result of the operation wrapped in a `Result` from *Neverthrow* for better error handling
 */
export default function initGlobalsTs(
	output = "../types/dist/biome/globals.d.ts",
	createDefaultFeatureFlags_AeroSandbox_ = createDefaultFeatureFlags_AeroSandbox,
	createDefaultFeatureFlags_aero_ = createDefaultFeatureFlags_aero,
): Result<void, Error> {
	const relOutput = path.resolve(__dirname, output);

	const debugMode = true;
	const featureFlags = featureFlagsBuilderRaw({
		...createDefaultFeatureFlags_AeroSandbox_({
			debugMode,
		}),
		// We inherit this because of the `SYNC_XHR` flag in the AeroSandbox feature flags
		...createDefaultFeatureFlags_aero_({
			debugMode,
		})
	});

	const lines: string[] = ["declare global {"];
	for (const [featureFlag, val] of Object.entries(featureFlags)) {
		try {
			// @ts-ignore: it could be anything. There is a try statement if something goes wrong anyways
			console.log(featureFlag, val);
			const jsonParsed = JSON.parse(val);
			const valType = typeof jsonParsed;
			if (valType === "number" || valType === "string" || Array.isArray(jsonParsed))
				lines.push(`\tvar ${featureFlag}: ${valType};`);
			else
				return nErr(
					new SyntaxError(
						`Unexpected type for feature flag, ${featureFlag}, ${valType}`,
					),
				);
		} catch (err) {
			return nErr(err);
		}
	}
	lines.push("}");

	const dirsLeading = path.dirname(relOutput);
	try {
		accessSync(dirsLeading);
	} catch (_err) {
		mkdirSync(dirsLeading, {
			recursive: true
		})
	}

	console.log(relOutput);
	try {
		writeFileSync(
			relOutput,
			`// Autogenerated by \`initGlobalsTs.ts\`\n${lines.join("\n")}`,
			{
				flag: "w",
			},
		);
	} catch (err) {
		return fmtNeverthrowErr("Failed to write the feature flags to the globals TS types file", err);
	}

	return nOk(undefined);
}

/**
 * Detect if the script is being ran as a CLI script and not as a module
 */
const isCLI =
	// For Deno
	// @ts-ignore: This is a Deno-only feature
	"Deno" in globalThis ? import.meta.main :
		// For Node (this does the same thing functionally as the above)
		import.meta.url === `file://${process.argv[1]}`;
if (isCLI) {
	const initGlobalsTsRes = initGlobalsTs();
	if (initGlobalsTsRes.isErr()) {
		throw initGlobalsTsRes.error;
	}
}