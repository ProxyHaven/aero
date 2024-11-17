/**
 * @module
 * This module can create methods that format error in a consistent way.
 * It is intended to be used in the `fmtErr.ts` files for aero and AeroSandbox and is simplify an abstraction for them
 */

import { Err, err as errr, errAsync as errrAsync } from "neverthrow";

/**
 * I could've used a class for this, but I felt it would be overkill for its intended use case.
 * @param featureFlags 
 * @returns The methods for formatting errors
 * 
 * @example
 * export const { fmtErr, fmtNeverthrowErr } = createErrorFmters(ERROR_LOG_AFTER_COLON);
 */
const createErrorFmters = (errorLogAfterColon: string) => ({
	/**
	 * Formats an error in a consistent way
	 * @param explanation The concise explanation of the `originalErr`
	 * @param originalErr The original error that was caught
	 * @returns The formatted error
	 */
	fmtErr: (explanation: string, originalErr: string): Error => new Error(`${explanation}${errorLogAfterColon}${originalErr}`),
	/**
	 * Formats a *Neverthrow* error in a consistent way
	 * @param explanation The concise explanation of the `originalErr`
	 * @param originalErr The original error that was caught
	 * @returns The formatted *Neverthrow* error
	 */
	// @ts-ignore I want to do this method switching, and it doesn't matter what the first template type is in `Err` from *Neverthrow*, because this method is meant to be generic
	fmtNeverthrowErr: (explanation: string, originalErr: string, async = false): Err<any, Error> => (async ? errrAsync : errr)(this.fmtErr(explanation, originalErr))
});
export default createErrorFmters;