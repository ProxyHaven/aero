import {
    type APIInterceptor,
    ExposedContextsEnum
} from "$types/apiInterceptors.d.ts";

import { proxyLocation } from "$util/proxyLocation";

export default {
    modifyObjectProperty() {
        Object.defineProperty(window, "isSecureContext", {
            get: () =>
                //flags.emulateSecureContext ||
                proxyLocation($aero.config.prefix, $aero.logger).protocol === "https:"
        });
    },
    globalProp: "isSecureContext",
    exposedContexts: ExposedContextsEnum.window
} as APIInterceptor;
