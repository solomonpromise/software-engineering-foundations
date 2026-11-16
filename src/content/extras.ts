import data from "./extras.json";
import figs from "./figures.json";

export type Table = { columns: string[]; rows: string[][] };
export type XSection = { heading: string; paragraphs?: string[]; bullets?: string[]; table?: Table };
export type IntroPage = { slug: string; title: string; sections: XSection[] };
export type Appendix = { letter: string; slug: string; title: string; intro?: string; sections: XSection[] };
export type Figure = { url: string; caption: string; hero: boolean };

export const introPages = data.intro as IntroPage[];
export const appendices = data.appendices as Appendix[];
export const bibliography = data.bibliography as { group?: string; entries: string[] }[];
/** Lesson images live in public/figures; prefix them with the site's base path (e.g. GitHub Pages sub-path). */
export const figuresFor = (slug: string): Figure[] =>
  ((figs as Record<string, Figure[]>)[slug] ?? []).map((f) => ({ ...f, url: `${import.meta.env.BASE_URL}${f.url}` }));
