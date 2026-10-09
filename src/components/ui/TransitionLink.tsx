"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { useTransition } from "@/components/shell/TransitionProvider";

type Props = React.ComponentPropsWithoutRef<typeof Link> & {
  href: string;
  /** Element to expand from (project takeover). Defaults to a slash wipe. */
  takeover?: { index: string; title: string };
};

/**
 * Internal link that routes through the transition layer. Real <a href> so it
 * still works with modifier-clicks, middle-click, and without JS.
 */
export const TransitionLink = forwardRef<HTMLAnchorElement, Props>(function TransitionLink(
  { href, takeover, onClick, children, ...rest },
  ref,
) {
  const { go } = useTransition();
  return (
    <Link
      ref={ref}
      href={href}
      scroll={false}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        go(href, { from: takeover ? (e.currentTarget as HTMLElement) : null, label: takeover });
      }}
      {...rest}
    >
      {children}
    </Link>
  );
});
