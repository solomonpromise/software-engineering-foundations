import type { XSection } from "@/content/extras";

export function Para({ text }: { text: string }) {
  if (text.startsWith("```")) {
    const code = text.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "");
    return <pre className="lesson-code"><code>{code}</code></pre>;
  }
  return <p>{text}</p>;
}

export function SectionBlock({ s }: { s: XSection }) {
  return (
    <section>
      <h2>{s.heading}</h2>
      {s.paragraphs?.map((p, i) => <Para key={i} text={p} />)}
      {s.bullets && s.bullets.length > 0 && <ul>{s.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
      {s.table && (
        <div className="lesson-table">
          <table>
            <thead><tr>{s.table.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>{s.table.rows.map((r, i) => <tr key={i}>{r.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function FigureBlock({ url, caption }: { url: string; caption: string }) {
  return (
    <figure className="my-10">
      <img src={url} alt={caption || "Lesson illustration"} loading="lazy" className="w-full rounded-lg" />
      {caption && <figcaption className="mt-2 text-sm text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}
