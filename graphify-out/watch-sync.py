"""Watch a project for graph changes and auto-sync the Graphify dashboard.

Runs `graphify watch` and re-runs sync-dashboard.py whenever graph.json or
GRAPH_REPORT.md change. Project-agnostic and cross-platform.
"""
from __future__ import annotations

import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "graphify-out"
GRAPH = OUT / "graph.json"
REPORT = OUT / "GRAPH_REPORT.md"
SYNC = OUT / "sync-dashboard.py"

DEBOUNCE = 3.0
POLL = 1.5


def find_python() -> str:
    f = OUT / ".graphify_python"
    if f.exists():
        p = f.read_text(encoding="utf-8-sig").strip()
        if p and Path(p).exists():
            return p
    return sys.executable


PY = find_python()


def graphify_watch_cmd() -> list[str]:
    # Prefer the graphify CLI; fall back to running the module with the
    # detected interpreter (works for uv/pipx tool installs).
    g = shutil.which("graphify")
    if g:
        return [g, "watch", str(ROOT), "--debounce", "3"]
    return [PY, "-m", "graphify.watch", str(ROOT), "--debounce", "3"]


def mtime(path: Path) -> float:
    return path.stat().st_mtime if path.exists() else 0.0


def run_sync() -> None:
    print(f"[watch-sync] Running sync at {time.strftime('%H:%M:%S')}")
    subprocess.run([PY, str(SYNC)], cwd=ROOT, check=True)


def watch_graphify() -> subprocess.Popen:
    print(f"[watch-sync] Starting graphify watch on {ROOT}")
    return subprocess.Popen(graphify_watch_cmd(), cwd=ROOT)


def main() -> None:
    run_sync()
    proc = watch_graphify()
    last_graph, last_report = mtime(GRAPH), mtime(REPORT)
    pending = 0.0
    print("[watch-sync] Watching graph.json + GRAPH_REPORT.md (Ctrl+C to stop)")

    try:
        while True:
            time.sleep(POLL)
            g, r = mtime(GRAPH), mtime(REPORT)
            if g != last_graph or r != last_report:
                pending = time.time()
                last_graph, last_report = g, r
            if pending and (time.time() - pending) >= DEBOUNCE:
                pending = 0.0
                try:
                    run_sync()
                except subprocess.CalledProcessError as e:
                    print(f"[watch-sync] Sync failed: {e}", file=sys.stderr)
            if proc.poll() is not None:
                print("[watch-sync] graphify watch exited, restarting...")
                proc = watch_graphify()
    except KeyboardInterrupt:
        print("\n[watch-sync] Stopping...")
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except Exception:
            proc.kill()


if __name__ == "__main__":
    main()
