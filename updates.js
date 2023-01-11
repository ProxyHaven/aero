import handleStore from "./util/handleStore.js";

import { dynamicConfig, flags } from "./config.js";

const { dbName, id } = dynamicConfig;

// For dynamic config updates
export default () => {
	if (flags.dynamicConfig)
		handleStore(dbName, store => {
			self.addEventListener("message", event => {
				const config = event.data;

				if (typeof config === "object" && config.id === id)
					store.add(config);
			});
		});
};
