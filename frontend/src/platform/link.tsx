import { forwardRef } from "react";
import { Link } from "react-router-dom";
export default forwardRef<HTMLAnchorElement, any>(function AppLink(
  { href, prefetch, replace, scroll, ...props },
  ref,
) {
  const to =
    typeof href === "string"
      ? href
      : `${href.pathname || ""}${href.query ? "?" + new URLSearchParams(href.query) : ""}`;
  return /^(https?:|mailto:|tel:|#)/.test(to) ? (
    <a ref={ref} href={to} {...props} />
  ) : (
    <Link ref={ref} to={to} replace={replace} {...props} />
  );
});
