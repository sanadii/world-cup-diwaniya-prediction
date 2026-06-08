"""Regenerate callflow + graph HTML and sync dashboard-data.json from graphify outputs."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "graphify-out"
CALLFLOW = OUT / "world-cup-predictions-callflow.html"
REPORT = OUT / "GRAPH_REPORT.md"
DATA = OUT / "dashboard-data.json"
LABELS = OUT / ".graphify_labels.json"
ANALYSIS = OUT / ".graphify_analysis.json"

ARCH_IDS = {
    "overview", "build-graph", "outputs-docs", "cli-skills",
    "ingest-cache-update", "tests-fixtures",
}
REF_IDS = {"hyperedges", "stats"}


def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd))
    subprocess.run(cmd, cwd=ROOT, check=True)


def git_commit() -> str:
    try:
        r = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=ROOT, capture_output=True, text=True, check=True,
        )
        return r.stdout.strip()
    except Exception:
        return "unknown"


def patch_callflow(html: str) -> str:
    # Remove duplicate title/subtitle/nav (dashboard owns those)
    html = re.sub(
        r"<h1>world-cup-predictions.*?</h1>\s*"
        r"<p class=\"subtitle\">.*?</p>\s*"
        r"<div class=\"nav\">.*?</div>\s*",
        "",
        html,
        count=1,
        flags=re.DOTALL,
    )
    html = html.replace(
        ".container { max-width: 1200px; margin: 0 auto; padding: 40px 24px; }",
        ".container { max-width: 1200px; margin: 0 auto; padding: 20px 24px 40px; }\n"
        ".container > h2:first-of-type { margin-top: 0; }",
    )
    return html


def parse_callflow_sections(html: str) -> list[dict]:
    sections = []
    for m in re.finditer(r'<h2 id="([^"]+)">(?:\d+\.\s*)?([^<]+)</h2>', html):
        sid, title = m.group(1), m.group(2).strip()
        title = title.replace("&amp;", "&")
        if sid in ARCH_IDS:
            group = "architecture"
        elif sid in REF_IDS:
            group = "reference"
        else:
            group = "modules"
        sections.append({"id": sid, "title": title, "group": group})
    return sections


def parse_report(text: str) -> dict:
    data: dict = {}
    m = re.search(r"- (\d+) files · ~([\d,]+) words", text)
    if m:
        data["files"] = int(m.group(1))
        data["words"] = int(m.group(2).replace(",", ""))

    m = re.search(
        r"- (\d+) nodes · (\d+) edges · (\d+) communities \((\d+) shown, (\d+) thin omitted\)",
        text,
    )
    if m:
        data.update({
            "nodes": int(m.group(1)),
            "edges": int(m.group(2)),
            "communities": int(m.group(3)),
            "communities_shown": int(m.group(4)),
            "communities_thin": int(m.group(5)),
        })

    m = re.search(
        r"Extraction: (\d+)% EXTRACTED · (\d+)% INFERRED · (\d+)% AMBIGUOUS"
        r" · INFERRED: (\d+) edges \(avg confidence: ([\d.]+)\)",
        text,
    )
    if m:
        data.update({
            "extracted_pct": int(m.group(1)),
            "inferred_pct": int(m.group(2)),
            "ambiguous_pct": int(m.group(3)),
            "inferred_edges": int(m.group(4)),
            "inferred_conf": float(m.group(5)),
        })

    gods = []
    in_gods = False
    for line in text.splitlines():
        if line.startswith("## God Nodes"):
            in_gods = True
            continue
        if in_gods:
            if line.startswith("## "):
                break
            gm = re.match(r"\d+\.\s+`([^`]+)` - (\d+) edges", line)
            if gm:
                gods.append({"n": gm.group(1), "e": int(gm.group(2))})
    data["gods"] = gods[:10]

    surp = []
    in_surp = False
    cur = None
    for line in text.splitlines():
        if line.startswith("## Surprising Connections"):
            in_surp = True
            continue
        if in_surp:
            if line.startswith("## "):
                break
            sm = re.match(
                r"- `([^`]+)` --(\w+)--> `([^`]+)`\s+\[(\w+)\]",
                line,
            )
            if sm:
                cur = {
                    "f": sm.group(1), "r": sm.group(2), "t": sm.group(3),
                    "k": sm.group(4), "p": "",
                }
                surp.append(cur)
            elif cur and line.strip() and not line.startswith("-"):
                cur["p"] = line.strip()
                cur = None
    data["surprises"] = surp[:5]

    hyper = []
    in_hyper = False
    for line in text.splitlines():
        if line.startswith("## Hyperedges"):
            in_hyper = True
            continue
        if in_hyper:
            if line.startswith("## "):
                break
            hm = re.match(r"- \*\*([^*]+)\*\*.*\[(\w+)", line)
            if hm:
                nodes_m = re.search(r"— ([^[]+)\[", line)
                n = 3
                if nodes_m:
                    n = len([x for x in nodes_m.group(1).split(",") if x.strip()])
                hyper.append({"l": hm.group(1).strip(), "n": n, "k": hm.group(2)})
    data["hyperedges"] = hyper[:12]

    gaps = []
    in_gaps = False
    for line in text.splitlines():
        if line.startswith("## Knowledge Gaps"):
            in_gaps = True
            continue
        if in_gaps:
            if line.startswith("## "):
                break
            gm = re.match(r"- \*\*(\d+) isolated", line)
            if gm:
                gaps.append({
                    "n": gm.group(1), "t": "isolated nodes",
                    "d": line.split(":", 1)[-1].strip(),
                })
            gm2 = re.match(r"- \*\*(\d+) thin communities", line)
            if gm2:
                gaps.append({
                    "n": gm2.group(1), "t": "thin communities",
                    "d": "fewer than 3 nodes — omitted from the detailed report",
                })
    data["gaps"] = gaps

    questions = []
    in_q = False
    for line in text.splitlines():
        if line.startswith("## Suggested Questions"):
            in_q = True
            continue
        if in_q:
            if line.startswith("## "):
                break
            qm = re.match(r"- \*\*(.+?)\*\*", line)
            if qm:
                questions.append({"q": qm.group(1), "w": ""})
            elif questions and line.strip().startswith("_") and line.strip().endswith("_"):
                questions[-1]["w"] = line.strip().strip("_")
    data["questions"] = questions

    comm = []
    for m in re.finditer(
        r'### Community (\d+) - "([^"]+)"\nCohesion: ([\d.]+)\nNodes \((\d+)\): ([^\n]+)',
        text,
    ):
        comm.append({
            "id": int(m.group(1)),
            "n": m.group(2),
            "h": float(m.group(3)),
            "c": int(m.group(4)),
            "s": m.group(5).split("(+")[0].strip()[:80],
        })
    data["communities"] = comm

    return data


def sync() -> None:
    run(["graphify", "export", "callflow-html"])
    run(["graphify", "export", "html"])

    html = CALLFLOW.read_text(encoding="utf-8")
    sections = parse_callflow_sections(html)
    html = patch_callflow(html)
    CALLFLOW.write_text(html, encoding="utf-8")

    report = REPORT.read_text(encoding="utf-8") if REPORT.exists() else ""
    parsed = parse_report(report)

    # Prefer live graph.json counts (watch updates this before report may catch up)
    graph_path = OUT / "graph.json"
    if graph_path.exists():
        g = json.loads(graph_path.read_text(encoding="utf-8"))
        nodes = g.get("nodes", [])
        links = g.get("links") or g.get("edges") or []
        parsed["nodes"] = len(nodes)
        parsed["edges"] = len(links) if links else parsed.get("edges")
        comm_ids = {n.get("community") for n in nodes if n.get("community") is not None}
        if comm_ids:
            parsed["communities"] = len(comm_ids)

    commit = git_commit()
    subtitle = (
        f"Generated from graphify knowledge graph: "
        f"{parsed.get('nodes', '?')} nodes, "
        f"{parsed.get('edges', '?'):,} edges, "
        f"{parsed.get('communities', '?')} communities. "
        f"Commit: {commit}"
    )

    payload = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "commit": commit,
        "subtitle": subtitle,
        "stats": parsed,
        "callflow_sections": sections,
    }
    DATA.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    patch_dashboard(payload, sections)
    print(f"Synced dashboard-data.json ({parsed.get('nodes')} nodes, {len(sections)} callflow sections)")


GROUP_LABELS = {
    "architecture": "Architecture",
    "modules": "Code Modules",
    "reference": "Reference",
}


def build_cf_menu_html(sections: list[dict]) -> str:
    html = ""
    for group in ("architecture", "modules", "reference"):
        items = [s for s in sections if s.get("group") == group]
        if not items:
            continue
        html += f'<div class="cf-menu-h">{GROUP_LABELS[group]}</div>\n'
        for s in items:
            html += (
                f'<a href="world-cup-predictions-callflow.html#{s["id"]}" '
                f'target="cf-frame" class="cf-link">{s["title"]}</a>\n'
            )
    return html


def patch_dashboard(payload: dict, sections: list[dict]) -> None:
    dash = OUT / "dashboard.html"
    text = dash.read_text(encoding="utf-8")
    json_blob = json.dumps(payload, ensure_ascii=False)

    # Inline JSON — works when opened via file:// (fetch is blocked)
    marker = '<script type="application/json" id="dash-data">'
    if marker in text:
        text = re.sub(
            r'<script type="application/json" id="dash-data">.*?</script>',
            f'<script type="application/json" id="dash-data">{json_blob}</script>',
            text,
            count=1,
            flags=re.DOTALL,
        )
    else:
        text = text.replace(
            "<script>\nlet lastUpdatedAt",
            f'<script type="application/json" id="dash-data">{json_blob}</script>\n<script>\nlet lastUpdatedAt',
        )

    # Static call-flow menu (visible even before JS runs)
    menu_html = build_cf_menu_html(sections)
    text = re.sub(
        r'<aside class="cf-menu" id="cf-menu">.*?</aside>',
        f'<aside class="cf-menu" id="cf-menu">\n{menu_html}</aside>',
        text,
        count=1,
        flags=re.DOTALL,
    )

    # Update subtitle placeholder
    text = re.sub(
        r'(<div class="cf-subtitle" id="cf-subtitle">)[^<]*(</div>)',
        rf'\1{payload.get("subtitle", "")}\2',
        text,
        count=1,
    )

    dash.write_text(text, encoding="utf-8")


if __name__ == "__main__":
    sync()
