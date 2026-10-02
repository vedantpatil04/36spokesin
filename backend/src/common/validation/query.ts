import type { TransformFnParams } from "class-transformer";

/** Query strings carry "true"/"false"; anything else is left for @IsBoolean to reject. */
export const queryBoolean = ({ value }: TransformFnParams): unknown =>
  value === "true" ? true : value === "false" ? false : value;
