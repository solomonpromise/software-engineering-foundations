import a from "./parts12.json";
import b from "./parts34.json";
import c from "./parts56.json";

export type Section = { heading: string; paragraphs: string[]; bullets?: string[] };
export type Chapter = {
  number: number; slug: string; title: string; question: string; summary: string;
  sections: Section[]; keyIdea: string; taskboard: string;
  walkthrough: { title: string; steps: string[] };
  mistakes: string[]; aiMistakes: string[]; tryIt: string[]; check: { q: string; a: string }[];
};
export type Part = {
  number: number; title: string; question: string; intro: string;
  project: { title: string; summary: string; steps: string[] };
  glossary: { term: string; definition: string }[]; chapters: Chapter[];
};

export const parts: Part[] = ([...a.parts, ...b.parts, ...c.parts] as Part[]).sort((x, y) => x.number - y.number);
export const chapters = parts.flatMap((p) => p.chapters.map((ch) => ({ ...ch, part: p })));
export const findChapter = (slug: string) => {
  const i = chapters.findIndex((c) => c.slug === slug);
  return i < 0 ? null : { chapter: chapters[i]!, prev: chapters[i - 1], next: chapters[i + 1] };
};
