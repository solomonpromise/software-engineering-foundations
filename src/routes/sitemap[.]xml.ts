import { createFileRoute } from "@tanstack/react-router";
import { chapters } from "@/content/lessons";
import { introPages, appendices } from "@/content/extras";
import projects from "@/content/projects.json";

const BASE_URL = "https://softwareengineeringfoundations.lovable.app";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const paths = [
          "/", "/curriculum", "/reference", "/glossary", "/bibliography", "/taskboard", "/certificate", "/about", "/about/maintainer", "/roadmap", "/contribute",
          ...introPages.map((p) => `/start/${p.slug}`),
          ...chapters.map((c) => `/learn/${c.slug}`),
          ...appendices.map((a) => `/reference/${a.slug}`),
          ...Object.values(projects as Record<string, { slug: string }>).map((p) => `/projects/${p.slug}`),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((p) => `  <url><loc>${BASE_URL}${p}</loc></url>`).join("\n")}\n</urlset>\n`;
        return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
      },
    },
  },
});
