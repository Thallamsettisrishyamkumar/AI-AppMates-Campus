import { Fragment } from "react";

// Small Markdown reader for AI answers: headings, lists, tables, code blocks, bold, inline code.
function inline(text, key) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <b key={key + i}>{p.slice(2, -2)}</b>;
    if (p.startsWith("`") && p.endsWith("`")) return <code key={key + i} className="md-inline">{p.slice(1, -1)}</code>;
    return <Fragment key={key + i}>{p}</Fragment>;
  });
}

function CodeBlock({ lang, code }) {
  const copy = () => navigator.clipboard && navigator.clipboard.writeText(code);
  return (
    <div className="md-code">
      <div className="md-code-bar"><span>{lang || "code"}</span><button type="button" onClick={copy}>Copy</button></div>
      <pre><code>{code}</code></pre>
    </div>
  );
}

export default function Markdown({ text }) {
  const lines = String(text || "").replace(/\r/g, "").split("\n");
  const out = [];
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const code = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) code.push(lines[i++]);
      i++;
      out.push(<CodeBlock key={k++} lang={lang} code={code.join("\n")} />);
      continue;
    }

    if (/^\s*\|.*\|\s*$/.test(line) && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] || "")) {
      const cells = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(cells(lines[i++]));
      out.push(
        <div className="md-table" key={k++}>
          <table>
            <thead><tr>{head.map((h, c) => <th key={c}>{inline(h, c)}</th>)}</tr></thead>
            <tbody>{rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci}>{inline(c, ci)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      continue;
    }

    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) { out.push(<div key={k++} className={`md-h md-h${h[1].length}`}>{inline(h[2], k)}</div>); i++; continue; }

    if (/^\s*([-*•])\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items = [];
      while (i < lines.length && (ordered ? /^\s*\d+[.)]\s+/.test(lines[i]) : /^\s*([-*•])\s+/.test(lines[i]))) {
        items.push(lines[i].replace(ordered ? /^\s*\d+[.)]\s+/ : /^\s*([-*•])\s+/, ""));
        i++;
      }
      const L = ordered ? "ol" : "ul";
      out.push(<L key={k++} className="md-list">{items.map((t, n) => <li key={n}>{inline(t, n)}</li>)}</L>);
      continue;
    }

    if (/^\s*---+\s*$/.test(line)) { out.push(<hr key={k++} />); i++; continue; }
    if (!line.trim()) { i++; continue; }

    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|\s*\|)/.test(lines[i]) && !/^\s*([-*•]|\d+[.)])\s+/.test(lines[i])) para.push(lines[i++]);
    if (!para.length) { para.push(lines[i++]); }
    out.push(<p key={k++} className="md-p">{inline(para.join(" "), k)}</p>);
  }
  return <div className="md">{out}</div>;
}
