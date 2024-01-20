declare var $aero: AeroTypes.GlobalAeroCTX;

import { handleFetchEvent } from "$aero_browser/util/swlessUtils";

window.fetch = new Proxy(fetch, {
	apply(target: Function, that: any, args: any[]) {
		let [, opts]: [any?, RequestInit?] = args;
		opts ??= {};

		opts =
			args[0] instanceof Request
				? {
						...args[0],
						...opts,
				  }
				: opts;

		let headers: Record<string, string> = {};

		if (
			opts.cache &&
			// only-if-cached requires the mode to be same origin
			!(opts.mode !== "same-origin" && opts.cache === "only-if-cached")
		) {
			// Emulate cache mode
			if (headers instanceof Headers)
				headers.append("x-aero-cache", opts.cache);
			else headers["x-aero-cache"] = opts.cache;
		}

		if ($aero.sandbox.swlessEnabled) {
			const request = createRequest(opts, headers);
			const nonDefaultResp = handleFetchEvent({ request });
			if (nonDefaultResp) return nonDefaultResp;
		}

		return Reflect.apply(target, that, args).then((resp: Response) => {
			const pass = resp.headers.get("x-headers");

			if (pass !== null) resp.headers = new Headers(JSON.parse(pass));

			// Conceal the site's origin if it is revealed
			const respUrl = new URL(resp.url);
			if (respUrl.origin === location.origin) return new Response();

			return resp;
		});
	},
});

function createRequest(opts: RequestInit, headers: Record<string, string>) {
	return new Request(opts, { headers });
}