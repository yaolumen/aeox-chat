export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function md(src: string): string {
  const blocks: string[] = [];
  let s = src.replace(/```(\w*)\n([\s\S]*?)```/g, (_m: string, _lang: string, code: string) => {
    blocks.push('<pre class="code"><code>' + esc(code.replace(/\n$/, "")) + "</code></pre>");
    return "\u0000B" + (blocks.length - 1) + "\u0000";
  });
  s = esc(s);
  s = s.replace(/`([^`]+)`/g, '<code class="ic">$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  let out = "";
  for (const par of s.split(/\n{2,}/)) {
    const t = par.trim();
    if (!t) continue;
    if (/^[-*] /m.test(t)) {
      out += "<ul>" + t.split("\n").map((l) => l.replace(/^[-*] /, "<li>") + "</li>").join("") + "</ul>";
    } else if (/^\u0000B\d+\u0000$/.test(t)) {
      out += t;
    } else {
      out += "<p>" + t.replace(/\n/g, "<br>") + "</p>";
    }
  }
  return out.replace(/\u0000B(\d+)\u0000/g, (_m: string, i: string) => blocks[Number(i)]);
}
