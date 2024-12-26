import type { overwriteRecordsType } from "./generic";

/** @warning Basic Regexp is unsupported as of now and will never be recommended */
export type rewriterMode = "aerogel" | "aerojet";

export interface RewriteOptions {
	/** Whether the script is a module script */
	isModule: boolean;
	/** The code to insert */
	insertCode?: string;
	// TODO: Implement
	cspRestrictions: {
		mustHaveIntegrity: string;
		unsafeEval: boolean;
		wasmUnsafeEval: boolean;
	}
	/** This should only be used for external scripts like from a SW */
	integrityCheck: string;
}

export interface AeroGelConfigFull {
	aeroGelConfig: AeroGelConfig;
	keywordGenConfig: {
		supportStrings: boolean;
		supportTemplateLiterals: boolean;
		supportRegex: boolean;
	},
	trackers: {
		blockDepth: boolean;
		propertyChain: boolean;
		proxyApply: boolean;
	}
}
export interface AeroGelConfig extends GenericJSParserConfig {
	propTrees: {
		fakeLet: string;
		fakeConst: string;
	}
	proxified: {
		evalFunc: string;
		window: string;
		location: string;
	}
	checkFunc: string;
}
export interface AeroJetRewriterConfig extends GenericJSParserConfig {
	checkFuncPropTree: string;
}
export interface GenericJSParserConfig {
	proxyNamespace: string;
	escapeProxyNamespace: boolean
}
export interface AeroJSParserConfig {
	proxyNamespace: string;
	/** This isolates the references to those global namespaces, where it will return an escaped version */
	escapeProxyNamespace: boolean;
	/** EST parsing recommended */
	modeDefault: rewriterMode;
	/** AeroGel recommended */
	modeModule: rewriterMode;
	modeConfigs: {
		generic: GenericJSParserConfig;
	};
}