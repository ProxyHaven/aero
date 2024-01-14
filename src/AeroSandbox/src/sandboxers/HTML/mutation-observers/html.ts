import * as config from "$aero_config";

import rewriteSrc from "$aero/shared/hared/src";
import rewriteHtmlSrc from "../shared/htmlSrc";
import scope from "$aero/shared/hared/scope";
import rewriteScript from "$aero/shared/hared/script";

import checkCsp from "../csp";
import Cloner from "../Cloner";

import { proxyLocation } from "$aero_browser/misc/proxyLocation";

import block from "$aero_browser/misc/policy";

// Rules
import * as defaultRules from "$aero_browser/rewriters/shared/rules";

// @ts-ignore
const rulesArr: any = Object.values(defaultRules).map(rule => [...rule]);
// What the rules for what we need to proxy in the scope of this module
const defaultRulesCollection: Map<any, AeroSandboxTypes.Rule[]> = new Map(rulesArr);

const elContainer = new Map<HTMLElement, HTMLElement>();
function set(el: HTMLElement, attr: string, val = "", backup = true) {
	const elBak = el.cloneNode(true);
	if (elBak instanceof HTMLElement) {
		el.setAttribute(attr, val);

		// Backup element (for Element hooks)
		if (backup)
			elContainer.set(el, elBak);
	}
}

const observedElements = new Set<HTMLElement>();

// TODO: Use the element rewriting rules and html rewriters
/**
 * Rewrite an element
 * @param - The element to rewrite
 * @param - If it is an attribute that is being rewritten
 */
export default (el: HTMLElement, attr?: String) => {
	// Don't exclusively rewrite attributes or check for already observed elements
	const isNew = typeof attr === "undefined";

	// TODO: Instead of doing this keep track with a WeakMap
	if (isNew && observedElements.has(el)) return;

	// Ensure that there is something to rewrite
	if (!defaultRulesCollection.has(el.constructor)) return;

	const rules = defaultRulesCollection.get(el.constructor)

	// HTML Middleware
	const ctx = require.context("../middleware/", true, /html.(\.js|\.ts)$/);
	ctx.keys().forEach(path => {
		ctx(path).then(mod => {
			const cmd = mod.default(el);

			if (cmd === "skip") {
				return;
			} else if (cmd === "delete") {
				if (el instanceof HTMLScriptElement) Cloner.deleteScript(el);
				else el.remove();
				return;
			}
		});
	});

	// CSP Testing
	function allow(dir: string) {
		if (!config.flags.corsEmulation && checkCsp(dir)) {
			el.remove();
			return false;
		}

		return true;
	}

	// I might start using as instead of the instanceof keyword here
	if (
		isNew &&
		el instanceof HTMLScriptElement &&
		!el.hasAttribute("rewritten")
	) {
		if (el.src) {
			if (allow("script-src")) {
				let url = new URL(el.src);

				const isMod = el.type === "module";

				const params = url.searchParams;

				params.getAll("isMod").forEach(v => {
					params.append("_isMod", v);
				});
				params.delete("isMod");
				params.append("isMod", isMod.toString());

				// TODO: Handle integrity in the sw. This would require external libraries to check hashes.
				if (isMod && el.integrity) {
					params
						.getAll("integrity")
						.forEach(v => url.searchParams.append("_integrity", v));

					params.set("integrity", el.integrity);
				}

				set(el, "src", url.href);
			} else set(el, "src", "");
		}

		if (
			!el.src &&
			!el.classList.contains(config.ignoreClass) &&
			typeof el.innerHTML === "string" &&
			el.innerHTML !== "" &&
			// Ensure the script has a JS type
			(el.type === "" ||
				el.type === "module" ||
				el.type === "text/javascript" ||
				el.type === "application/javascript")
		) {
			// FIXME: Fix safeText so that it could be used here
			el.innerHTML = rewriteScript(el.innerText, el.type === "module");

			// The inline code is read-only, so the element must be cloned
			const cloner = new Cloner(el);

			cloner.clone();
			cloner.cleanup();
		}
	} else if (el instanceof SVGAElement) {
		if (el.href) set(el, "href", rewriteHtmlSrc(el.href.baseVal));
		else if (el.hasAttribute("xlink:href"))
			set(
				el,
				"xlink:href",
				rewriteHtmlSrc(el.getAttribute("xlink:href"))
			);
	} else if (
		el instanceof HTMLAnchorElement ||
		el instanceof HTMLAreaElement ||
		el instanceof HTMLBaseElement
	) {
		if (el.href) {
			set(el, "href", rewriteHtmlSrc(el.href));
		} else if (el.hasAttribute("xlink:href"))
			set(
				el,
				"xlink:href",
				rewriteHtmlSrc(el.getAttribute("xlink:href"))
			);
	} else if (
		el instanceof HTMLFormElement &&
		// Don't rewrite again
		!el._action &&
		// Action is automatically created
		el.action !== null
	)
		set(el, "action", rewriteHtmlSrc(el.action));
	else if (el instanceof HTMLIFrameElement) {
		if (el.src && allow("frame-src")) {
			// Embed the origin as an attribute, so that the frame can reference it to do its checks
			el["parentProxyOrigin"] = proxyLocation().origin;
			set(el, "src");

			// Inject aero imports if applicable then rewrite the Src
			set(el, "src", el.src);
		}
		if (el.srcdoc)
			// Inject aero imports
			set(el, "srcdoc", $aero.init + el.srcdoc);

		// Emulate CSP
		// Delete
		if (el.hasAttribute("csp")) set(el, "csp", "");
		// Emulate
		let sec: {
			csp?: string;
			perms?: string;
			pr?: boolean;
		} = {};
		if (el["csp"]) {
			sec.csp = el["csp"];
			set(el, "csp", "");
		}
		if (el.allow) {
			sec.perms = el.allow;
			set(el, "allow", "");
		}
		if (el["allowPaymentRequest"]) {
			sec.pr = el["allowPaymentRequest"];
			set(el, "allowpaymentrequest", "");
		}
		el.addEventListener(
			"load",
			() => (el.contentWindow["sec"] = JSON.stringify(sec))
		);
	} else if (el instanceof HTMLPortalElement && el["src"])
		set(el, "src", rewriteHtmlSrc(el["src"]));
	else if (el instanceof HTMLImageElement && el.src && !allow("img-src"))
		set(el, "src", "");
	else if (
		el instanceof HTMLAudioElement ||
		(el instanceof HTMLVideoElement && el.autoplay && block("autoplay"))
	)
		set(el, "autoplay");
	else if (el instanceof HTMLMetaElement) {
		switch (el.httpEquiv) {
			case "content-security-policy":
				// TODO: Enforce the CSP instead of deleting it
				set(el, "content", "");
				break;
			case "refresh":
				set(
					el,
					"content",
					el.content.replace(
						/^([0-9]+)(;)(\s+)?(url=)(.*)/g,
						(_match, g1, g2, g3, g4, g5) =>
							g1 +
							g2 +
							g3 +
							g4 +
							rewriteSrc(g5, proxyLocation().href)
					)
				);
		}
	}
	/*
	} else if (el instanceof HTMLLinkElement && el.rel === "manifest") {
		set(el, "href", rewriteSrc(el.url, proxyLocation().href));
	} else if (config.flags.legacy && tag instanceof HTMLHtmlElement) {
		// Cache manifests
		set(el, "manifest", rewriteSrc(el.url, proxyLocation().href.manifest));
	}
	*/

	if (isNew && el.integrity !== "") {
		const cloner = new Cloner(el);

		cloner.clone();
		cloner.cleanup();
	}

	if (typeof el.onload === "string")
		set(el, "onload", scope(el.getAttribute("onload")));
	if (typeof el.error === "string")
		set(el, "onerror", scope(el.getAttribute("onload")));
};

function setupHTMLMiddlewareRewriters(el: HTMLElement) {

}