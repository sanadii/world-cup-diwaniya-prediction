"""Regenerate callflow + graph HTML and sync the Graphify dashboard.

Project-agnostic: derives the project name, path, and call-flow filename at
runtime, so the same script works in any repo that has a graphify-out/ graph.
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "graphify-out"
REPORT = OUT / "GRAPH_REPORT.md"
DATA = OUT / "dashboard-data.json"
DASH = OUT / "dashboard.html"

REF_IDS = {"hyperedges", "stats"}
ARCH_IDS = {"overview", "architecture", "entry-points", "data-flow", "build-graph"}

GROUP_LABELS = {
    "architecture": "Architecture",
    "modules": "Code Modules",
    "reference": "Reference",
}


def project_name() -> str:
    import os
    env = os.environ.get("GRAPHIFY_DASHBOARD_NAME")
    if env:
        return env.strip()
    name_file = OUT / ".dashboard_name"
    if name_file.exists():
        n = name_file.read_text(encoding="utf-8-sig").strip().lstrip("\ufeff")
        if n:
            return n
    return ROOT.name


def find_python() -> str:
    f = OUT / ".graphify_python"
    if f.exists():
        p = f.read_text(encoding="utf-8-sig").strip()
        if p and Path(p).exists():
            return p
    return sys.executable


def graphify_prefix() -> list[str]:
    g = shutil.which("graphify")
    if g:
        return [g]
    return [find_python(), "-m", "graphify"]


def callflow_path() -> Path:
    candidates = sorted(
        OUT.glob("*-callflow.html"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    if candidates:
        return candidates[0]
    return OUT / f"{ROOT.name}-callflow.html"


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
    # Remove the doc's own title/subtitle/nav (the dashboard provides those)
    html = re.sub(
        r"<h1>[^<]*</h1>\s*"
        r"<p class=\"subtitle\">.*?</p>\s*"
        r"<div class=\"nav\">.*?</div>\s*",
        "",
        html,
        count=1,
        flags=re.DOTALL,
    )
    html = re.sub(
        r"\.container \{ max-width: 1200px; margin: 0 auto; padding: 40px 24px; \}",
        ".container { max-width: 1200px; margin: 0 auto; padding: 20px 24px 40px; }\n"
        ".container > h2:first-of-type { margin-top: 0; }",
        html,
        count=1,
    )
    return html


def classify(sid: str, title: str) -> str:
    t = title.lower()
    if sid in REF_IDS or "statistic" in t or "hyperedge" in t:
        return "reference"
    if sid in ARCH_IDS or "overview" in t or "architecture" in t:
        return "architecture"
    return "modules"


def parse_callflow_sections(html: str) -> list[dict]:
    sections = []
    for m in re.finditer(r'<h2 id="([^"]+)">(?:\d+\.\s*)?([^<]+)</h2>', html):
        sid, title = m.group(1), m.group(2).strip().replace("&amp;", "&")
        sections.append({"id": sid, "title": title, "group": classify(sid, title)})
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
            "nodes": int(m.group(1)), "edges": int(m.group(2)),
            "communities": int(m.group(3)), "communities_shown": int(m.group(4)),
            "communities_thin": int(m.group(5)),
        })

    m = re.search(
        r"Extraction: (\d+)% EXTRACTED · (\d+)% INFERRED · (\d+)% AMBIGUOUS"
        r" · INFERRED: (\d+) edges \(avg confidence: ([\d.]+)\)",
        text,
    )
    if m:
        data.update({
            "extracted_pct": int(m.group(1)), "inferred_pct": int(m.group(2)),
            "ambiguous_pct": int(m.group(3)), "inferred_edges": int(m.group(4)),
            "inferred_conf": float(m.group(5)),
        })

    gods, in_gods = [], False
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

    surp, in_surp, cur = [], False, None
    for line in text.splitlines():
        if line.startswith("## Surprising Connections"):
            in_surp = True
            continue
        if in_surp:
            if line.startswith("## "):
                break
            sm = re.match(r"- `([^`]+)` --(\w+)--> `([^`]+)`\s+\[(\w+)\]", line)
            if sm:
                cur = {"f": sm.group(1), "r": sm.group(2), "t": sm.group(3),
                       "k": sm.group(4), "p": ""}
                surp.append(cur)
            elif cur and line.strip() and not line.startswith("-"):
                cur["p"] = line.strip()
                cur = None
    data["surprises"] = surp[:5]

    hyper, in_hyper = [], False
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
                n = len([x for x in nodes_m.group(1).split(",") if x.strip()]) if nodes_m else 3
                hyper.append({"l": hm.group(1).strip(), "n": n, "k": hm.group(2)})
    data["hyperedges"] = hyper[:12]

    gaps, in_gaps = [], False
    for line in text.splitlines():
        if line.startswith("## Knowledge Gaps"):
            in_gaps = True
            continue
        if in_gaps:
            if line.startswith("## "):
                break
            gm = re.match(r"- \*\*(\d+) isolated", line)
            if gm:
                gaps.append({"n": gm.group(1), "t": "isolated nodes",
                             "d": line.split(":", 1)[-1].strip()})
            gm2 = re.match(r"- \*\*(\d+) thin communities", line)
            if gm2:
                gaps.append({"n": gm2.group(1), "t": "thin communities",
                             "d": "fewer than 3 nodes — omitted from the detailed report"})
    data["gaps"] = gaps

    questions, in_q = [], False
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
            "id": int(m.group(1)), "n": m.group(2), "h": float(m.group(3)),
            "c": int(m.group(4)), "s": m.group(5).split("(+")[0].strip()[:80],
        })
    # Keep the detailed list separate from the community COUNT (which the
    # graph.json branch in sync() may overwrite with an integer).
    data["communities_list"] = comm
    return data


def patch_dashboard(payload: dict) -> None:
    if not DASH.exists():
        print(f"! dashboard.html not found at {DASH} - skipping inline patch")
        return
    text = DASH.read_text(encoding="utf-8")
    blob = json.dumps(payload, ensure_ascii=False)
    # Inline the data so the dashboard works over file:// (fetch is blocked there).
    # The template's JS fills title/nav/hero/cf-menu/subtitle from this blob.
    if '<script type="application/json" id="dash-data">' in text:
        # Use a function replacement: a string replacement would let re.sub
        # interpret backslashes in the blob (e.g. JSON-escaped Windows paths).
        repl = f'<script type="application/json" id="dash-data">{blob}</script>'
        text = re.sub(
            r'<script type="application/json" id="dash-data">.*?</script>',
            lambda _m: repl,
            text, count=1, flags=re.DOTALL,
        )
        DASH.write_text(text, encoding="utf-8")


def sync() -> None:
    gx = graphify_prefix()
    run(gx + ["export", "callflow-html"])
    run(gx + ["export", "html"])

    cf = callflow_path()
    if cf.exists():
        html = cf.read_text(encoding="utf-8")
        sections = parse_callflow_sections(html)
        cf.write_text(patch_callflow(html), encoding="utf-8")
    else:
        sections = []

    report = REPORT.read_text(encoding="utf-8") if REPORT.exists() else ""
    parsed = parse_report(report)

    graph_path = OUT / "graph.json"
    if graph_path.exists():
        g = json.loads(graph_path.read_text(encoding="utf-8"))
        nodes = g.get("nodes", [])
        links = g.get("links") or g.get("edges") or []
        parsed["nodes"] = len(nodes)
        if links:
            parsed["edges"] = len(links)
        comm_ids = {n.get("community") for n in nodes if n.get("community") is not None}
        if comm_ids:
            parsed["communities"] = len(comm_ids)

    proj = project_name()
    commit = git_commit()
    subtitle = (
        f"Generated from graphify knowledge graph: "
        f"{parsed.get('nodes', '?')} nodes, "
        f"{parsed.get('edges', 0):,} edges, "
        f"{parsed.get('communities', '?')} communities. Commit: {commit}"
    )

    payload = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "project": proj,
        "path": str(ROOT),
        "callflow_file": cf.name,
        "commit": commit,
        "subtitle": subtitle,
        "stats": parsed,
        "callflow_sections": sections,
    }
    DATA.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    patch_dashboard(payload)
    print(f"Synced {proj}: {parsed.get('nodes')} nodes, {len(sections)} callflow sections")


if __name__ == "__main__":
    sync()
