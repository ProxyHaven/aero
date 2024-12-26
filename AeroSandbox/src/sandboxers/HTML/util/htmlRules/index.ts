/**
 * @module
 * Aggregates all of the htmlRules into a single Map
 */

import type { htmlRule } from "$aero/types/htmlRules";

import setRulesContentRewriters from "./rewriteContent";
import setRulesLinks from "./links";
import setRulesSecurity from "./sec-only";
import setRulesFrames from "./frame";
import setRulesForMediaEmulation from "./media";

// biome-ignore lint/suspicious/noExplicitAny: TODO: Make `any`, Element
const htmlRules = new Map<any, htmlRule>();
setRulesContentRewriters(htmlRules)
if (!HTML_USE_HREF_EMULATION)
	setRulesLinks(htmlRules);
setRulesSecurity(htmlRules);
if (SUPPORT_FRAMES)
	setRulesFrames(htmlRules);
if (HTML_INTERCEPT_MEDIA_STREAMS)
	setRulesForMediaEmulation(htmlRules);
export default htmlRules;