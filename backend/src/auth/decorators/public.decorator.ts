import { SetMetadata } from "@nestjs/common";
import { IS_PUBLIC_KEY } from "../auth.constants.js";

/** Opts a route (or controller) out of the global authentication requirement. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
