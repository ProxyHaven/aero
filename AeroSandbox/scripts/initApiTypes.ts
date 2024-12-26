import path from "node:path";
import { access, mkdir } from "node:fs/promises";
import { writeFileSync } from "node:fs";

import type { Result } from "neverthrow";
import { ok as ok as nOk.err as nErr } from "neverthrow";

/**
 * For WebIDL -> TS conversion
 * I shouldn't have to do this, but they forgot to include the "exports" definition inside their package.json, and I don't want to maintain a fork. They also defined exports for these modules in their index.js, which should be enough by itself, but they invoked the CLI, making this useless since that action throws an error.
 */
const fetchIDLModPath = path.resolve(
	__dirname,
	"..",
	"node_modules",
	"@milkshakeio",
	"webidl2ts",
	"dist",
	"fetch-idl.js",
);
const fetchIDLMod = require(fetchIDLModPath);
const fetchIDL = fetchIDLMod.fetchIDL;
const parseIDLModPath = path.resolve(
	__dirname,
	"..",
	"node_modules",
	"@milkshakeio",
	"webidl2ts",
	"dist",
	"parse-idl.js",
);
const parseIDLMod = require(parseIDLModPath);
const parseIDL = parseIDLMod.parseIDL;
const convertIDLModPath = path.resolve(
	__dirname,
	"..",
	"node_modules",
	"@milkshakeio",
	"webidl2ts",
	"dist",
	"convert-idl.js",
);
const convertIDLMod = require(convertIDLModPath);
const convertIDL = convertIDLMod.convertIDL;
const printTsModPath = path.resolve(
	__dirname,
	"..",
	"node_modules",
	"@milkshakeio",
	"webidl2ts",
	"dist",
	"print-ts.js",
);
const printTsMod = require(printTsModPath);
const printTs = printTsMod.printTs;

const webIDLOutputDir = path.resolve(__dirname, "types/webidlDist");

type webIDLDescs = { [key: string]: string };
const webIDLUsedInAero: webIDLDescs = {
	"cookie-store": "https://wicg.github.io/cookie-store/",
	// fedcm: "https://fedidcg.github.io/FedCM/", FIXME: Broken
	"shared-storage": "https://wicg.github.io/shared-storage/",
	"web-app-launch": "https://wicg.github.io/web-app-launch/",
	"web-otp": "https://wicg.github.io/web-otp/",
};

// Gens to types/webidlDist
export default function genWebIDL(
	logStatus: boolean,
	webIDL = webIDLUsedInAero,
): Result<void, Error> {
	if (logStatus) {
		console.log(
			"\nGenerating the WebIDL -> TS conversions required in aero",
		);
	}
	access(webIDLOutputDir).catch(() => mkdir(webIDLOutputDir));
	for (const [apiName, apiDocURL] of Object.entries(webIDL)) {
		if (logStatus) {
			console.log(
				`Fetching the WebIDL for ${apiName} with URL ${apiDocURL}`,
			);
		}
		fetchIDL(apiDocURL).then((rawIdl) => {
			if (logStatus) console.log(`Parsing the WebIDL for ${apiName}`);
			parseIDL(rawIdl).then((idl) => {
				if (logStatus) {
					console.log(`Converting the WebIDL -> TS for ${apiName}`);
				}
				const ts = convertIDL(idl, {
					emscripten: false,
				});

				if (logStatus) {
					console.log(`Applying the final touches to ${apiName}`);
				}
				const tsString = printTs(ts);

				// Parity check: if the string is blank
				if (tsString === "")
					return nErr(new Error("The ts string is invalid"));

				if (logStatus) console.log(`Writing the WebIDL for ${apiName}`);
				writeFileSync(
					path.resolve(webIDLOutputDir, `${apiName}.d.ts`),
					`// Auto-generated by webidl2ts - ${apiDocURL}\n${tsString}`,
				);
			});
		});
	}
	// @ts-ignore
	return nOk();
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
	// TODO: Import the error handler from `buildTools.ts` and use that for all of these CLI scripts
	genWebIDL(webIDLUsedInAero, true);
}