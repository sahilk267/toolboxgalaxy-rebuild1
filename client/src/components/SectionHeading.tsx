// Orbital Workbench: left-aligned editorial headings with blueprint metadata.
export default function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <div className="section-heading">
      <p className="mono-label text-[#c7f36b]">{eyebrow}</p>
      <h2 className="font-display mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.055em] text-[#f4f2ea] md:text-5xl">{title}</h2>
      <p className="mt-4 max-w-xl text-base leading-7 text-white/62">{copy}</p>
    </div>
  );
}
