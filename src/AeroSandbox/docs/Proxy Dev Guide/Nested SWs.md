# Nested SWs

There are multiple sandboxes involved in my Nested SW system. There is one "runner sandbox" where that evals the SW and grabs every event listener through binding proxies through its scope. I don't need to use ES6 proxies if I don't want to. There are fake event listeners, so when an event handler is registered for it, it adds the handler to an object of handlers for every event on the SW we want to intercept and proxify. This object is stored on a map's value, and the key for that map is the proxyOrigin for which the nested (emulated) SW was registered. Remember there can only be one proxyOrigin Anyways, aero has code in the SW in each of the handlers we want to intercept in proxify, and runs attaches a scope with .call like what was done to create the runner sandbox, but instead, the scope has proxified SW APIs like fetch, caches, etc... This is a secondary sandbox. Still, for the event handlers, Let's use the client API as an example. The site being proxied can use the Clients API to get the full URL of the site that the request originated from. The problem is that this would reveal the proxy, so we need to proxify this revealer by using afterPrefix to get the Proxy URL instead of the Real URL. Also, in the Sandbox, the fetch API is replaced with bare-mux.

When the "runner sandbox" evals the SW, it removes the imports and uses esbuild-wasm to make a bundle run. It does this by turning the SW into one file. We do this because we don't want imports because they would be coming from the real SW, and an SW can't intercept its requests as per the spec; otherwise, the fetch event handler would recurse. Esbuild-wasm lets you define the import source with their plugin system, so I fetch them with bare-mux.