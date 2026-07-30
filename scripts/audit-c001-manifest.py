import json
import pathlib
import sys

root = pathlib.Path.cwd()
manifest_path = root / "manifests" / "C-001.json"
assets_path = root / "manifests" / "C-001-assets.json"
baseline_path = root / "manifests" / "C-001-visual-baseline.json"

manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
assets = json.loads(assets_path.read_text(encoding="utf-8"))
required_states = {
    "initial",
    "loading",
    "transition",
    "offline",
    "error",
    "timeout",
    "maintenance",
    "ready-location",
    "ready-home",
    "reduced-motion",
}

checks = {
    "screen_id": manifest.get("screenId") == "C-001",
    "base_commit": manifest.get("baseFrozenCommit") == "be61e1168b93d973101496cc66cb54d006aba9cc",
    "tokens": manifest.get("designTokens") == "1.1.0",
    "components": manifest.get("componentLibrary") == "1.1.1",
    "states": set(manifest.get("states", [])) == required_states,
    "no_endpoints": manifest.get("endpoints") == [],
    "no_events": manifest.get("events") == [],
    "location_destination": manifest.get("navigationContract", {}).get("withoutValidLocationContext") == "C-002",
    "home_destination": manifest.get("navigationContract", {}).get("withValidLocationContext") == "C-005",
    "no_auth_destinations": manifest.get("navigationContract", {}).get("authenticationDestinations") == [],
    "no_timer_redirect": manifest.get("navigationContract", {}).get("automaticTimerRedirect") is False,
    "c005_protected": manifest.get("protectedScope", {}).get("c005Modified") is False,
    "no_blocked_screens": manifest.get("protectedScope", {}).get("blockedScreensImplemented") == [],
    "no_placeholder_assets": assets.get("generatedPlaceholders") == [],
}

baseline = None
if baseline_path.exists():
    baseline = json.loads(baseline_path.read_text(encoding="utf-8"))
    checks["baseline_screen_id"] = baseline.get("screenId") == "C-001"
    checks["baseline_hash_count"] = len(baseline.get("hashes", {})) == 30

result = {
    "checks": checks,
    "baselineMode": "gate" if baseline_path.exists() else "candidate",
    "passed": all(checks.values()),
}

out = root / "qa" / "c001" / "source"
out.mkdir(parents=True, exist_ok=True)
(out / "manifest-audit.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(json.dumps(result, indent=2))
sys.exit(0 if result["passed"] else 1)
