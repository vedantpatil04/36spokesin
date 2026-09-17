import { createLink } from "@tanstack/react-router";
import { forwardRef, type ComponentProps } from "react";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./button-styles";

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}

type ButtonAnchorProps = ComponentProps<"a"> & { variant?: ButtonVariant; size?: ButtonSize };

const ButtonAnchor = forwardRef<HTMLAnchorElement, ButtonAnchorProps>(function ButtonAnchor(
  { variant = "primary", size = "md", className, ...props },
  ref,
) {
  return <a ref={ref} className={buttonClasses({ variant, size, className })} {...props} />;
});

/** A router link styled as a button. Fully typed: `to`, `params` and `search` are checked. */
export const ButtonLink = createLink(ButtonAnchor);
