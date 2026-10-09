import { TransitionLink } from "@/components/ui/TransitionLink";

/* The previous portfolio's line, finally in its natural habitat. */
export default function NotFound() {
  return (
    <section className="flex min-h-[100svh] flex-col justify-end px-pad pb-[8vh] pt-[calc(var(--header-h)+4vh)]">
      <p className="meta text-ash">(404)</p>
      <h1 className="font-display mt-3 text-[clamp(4rem,16vw,18rem)]">No bugs found</h1>
      <p className="lede mt-6 max-w-[40ch] text-ash">This page doesn&rsquo;t exist — the rest of the site does.</p>
      <TransitionLink href="/" className="meta ulink mt-10 self-start text-bone">
        ← Back home
      </TransitionLink>
    </section>
  );
}
