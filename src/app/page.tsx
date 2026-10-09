import { Hero } from "@/components/home/Hero";
import { Manifesto } from "@/components/home/Manifesto";
import { Cuts } from "@/components/work/Cuts";
import { Archive } from "@/components/home/Archive";
import { Capabilities } from "@/components/home/Capabilities";
import { About } from "@/components/home/About";
import { Contact } from "@/components/home/Contact";

/**
 * One continuous night (docs/18_CREATIVE_DIRECTION_V2.md):
 * Hero — dive into the moon → white frame collapses to a line → Manifesto
 * → strips streak away → Work (five cuts) → Capabilities (engineering)
 * → Archive tunnel (the eye) → iris closes to a point → About (stillness)
 * → Contact (final scene) → Footer (last frame).
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Manifesto />
      <Cuts />
      <Capabilities />
      <Archive />
      <About />
      <Contact />
    </>
  );
}
