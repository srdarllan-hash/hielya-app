import json
import hashlib
from pathlib import Path

root = Path.cwd()
manifest = json.loads((root / 'manifests/C-002.json').read_text())
assets = json.loads((root / 'manifests/C-002-assets.json').read_text())
components = json.loads((root / 'manifests/components.json').read_text())
screens = json.loads((root / 'manifests/screens.json').read_text())
baseline = json.loads((root / 'manifests/C-002-visual-baseline.json').read_text())
baseline_dir = root / 'tests/visual/location.visual.spec.ts-snapshots'
baseline_files = sorted(baseline_dir.glob('*.png'))
baseline_mismatches = [
    file.name for file in baseline_files
    if baseline.get('hashes', {}).get(file.name) != hashlib.sha256(file.read_bytes()).hexdigest()
]
checks = {
    'screen_id': manifest.get('screenId') == 'C-002',
    'authorized': manifest.get('authorization') == 'AUTHORIZED_FOR_IMPLEMENTATION',
    'approved_frozen': manifest.get('status') == 'APPROVED_FROZEN' and manifest.get('approval', {}).get('approvedFrozen') is True,
    'work_integrated': manifest.get('approval', {}).get('workIntegrated') is True,
    'ready_for_c003_planning': manifest.get('approval', {}).get('readyForC003Planning') is True,
    'gate_validation': manifest.get('baselineMode') == 'GATE_VALIDATION',
    'typed_outcome': manifest.get('navigationContract', {}).get('outcome') == 'LOCATION_CONFIRMED',
    'no_direct_destination': manifest.get('navigationContract', {}).get('directDestinations') == [],
    'service_area_port': manifest.get('serviceAreaContract', {}).get('clientCalculatesCoverage') is False,
    'privacy_defaults': all(manifest.get('privacy', {}).get(key) is expected for key, expected in {
        'backgroundTracking': False,
        'explicitUserActionRequired': True,
        'unconfirmedCoordinatesPersisted': False,
        'exactCoordinatesLogged': False,
    }.items()),
    'viewports': set(manifest.get('requiredViewports', [])) == {'360x800','390x844','1170x2532'},
    'button_canonical': any(item.get('name') == 'Button' for item in components.get('canonical', [])),
    'screen_registry': next(item for item in screens['screens'] if item['screenId'] == 'C-002')['sourceStatus'] == 'APPROVED_FROZEN',
    'blocked_auth_screens': all(next(item for item in screens['screens'] if item['screenId'] == screen_id)['sourceStatus'] == 'BLOCKED' for screen_id in ('C-003', 'C-004')),
    'baseline_count': len(baseline_files) == 63 and baseline.get('baselineCount') == 63 and len(baseline.get('hashes', {})) == 63,
    'baseline_hashes': not baseline_mismatches,
    'no_placeholder_assets': assets.get('placeholdersPromoted') is False,
}
result = {'checks': checks, 'baselineMismatches': baseline_mismatches, 'passed': all(checks.values())}
output = root / 'qa/c002'
output.mkdir(parents=True, exist_ok=True)
(output / 'manifest-audit.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
if not result['passed']:
    raise SystemExit(1)
