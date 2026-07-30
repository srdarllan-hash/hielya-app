from pathlib import Path
import json,sys
root=Path(__file__).resolve().parents[1]
m=json.loads((root/'manifests/C-005.json').read_text())
checks={'screen':m.get('screenId')=='C-005','tokens':m.get('designTokens')=='1.1.0','minimum':m.get('rules',{}).get('minimumOrderEur')==25,'radius':m.get('rules',{}).get('deliveryRadiusKm')==4,'states':len(m.get('states',[]))==8}
(root/'qa/source').mkdir(parents=True,exist_ok=True)
(root/'qa/source/manifest-audit.json').write_text(json.dumps(checks,indent=2))
print(checks)
sys.exit(0 if all(checks.values()) else 1)
