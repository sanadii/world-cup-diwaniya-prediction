"""Watch project for graph changes and auto-sync dashboard + callflow."""
from __future__ import annotations

import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "graphify-out"
GRAPH = OUT / "graph.json"
REPORT = OUT / "GRAPH_REPORT.md"
SYNC = OUT / "sync-dashboard.py"
_py_file = OUT / ".graphify_python"
PY = _py_file.read_text(encoding="utf-8-sig").strip() if _py_file.exists() else sys.executable
if not Path(PY).exists():
    PY = r"C:\Users\User\AppData\Roaming\uv\tools\graphifyy\Scripts\python.exe"

DEBOUNCE = 3.0
POLL = 1.5


def mtime(path: Path) -> float:
    return path.stat().st_mtime if path.exists() else 0.0


def run_sync() -> None:
    print(f"[watch-sync] Running sync at {time.strftime('%H:%M:%S')}")
    subprocess.run([PY, str(SYNC)], cwd=ROOT, check=True)


def watch_graphify() -> subprocess.Popen:
    print(f"[watch-sync] Starting graphify watch on {ROOT}")
    return subprocess.Popen(
        [PY, "-m", "graphify.watch", str(ROOT), "--debounce", "3"],
        cwd=ROOT,
    )


def main() -> None:
    # Initial sync
    run_sync()

    proc = watch_graphify()
    last_graph = mtime(GRAPH)
    last_report = mtime(REPORT)
    pending = 0.0

    print("[watch-sync] Watching graph.json + GRAPH_REPORT.md for changes (Ctrl+C to stop)")

    try:
        while True:
            time.sleep(POLL)
            g = mtime(GRAPH)
            r = mtime(REPORT)
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
        proc.wait(timeout=5)


if __name__ == "__main__":
    main()
