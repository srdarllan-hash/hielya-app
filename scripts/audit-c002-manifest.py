import json
from pathlib import Path

root = Path.cwd()
manifest = json.loads((root / 'manifests/C-002.json').read_text())
assets = json.loads((root / 'manifests/C-002-assets.json').read_text())
components = json.loads((root / 'manifests/components.json').read_text())
screens = json.loads((root / 'manifests/screens.json').read_text())
checks = {
    'screen_id': manifest.get('screenId') == 'C-002',
    'authorized': manifest.get('authorization') == 'AUTHORIZED_FOR_IMPLEMENTATION',
    'not_frozen': manifest.get('approval', {}).get('approvedFrozen') is False,
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
    'screen_registry': next(item for item in screens['screens'] if item['screenId'] == 'C-002')['sourceStatus'] == 'AUTHORIZED_FOR_IMPLEMENTATION',
    'no_placeholder_assets': assets.get('placeholdersPromoted') is False,
}
result = {'checks': checks, 'passed': all(checks.values())}
output = root / 'qa/c002'
output.mkdir(parents=True, exist_ok=True)
(output / 'manifest-audit.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
if not result['passed']:
    raise SystemExit(1)
