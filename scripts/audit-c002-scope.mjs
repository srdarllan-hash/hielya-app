import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const base = process.env.C002_BASE_SHA ?? 'c2857afe538b2cf5ba44635edd56dbd422c0e2f0';
const changed = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { encoding: 'utf8' }).split('\n').map((value) => value.trim()).filter(Boolean);
const protectedPatterns = [
  /^packages\/ui\/src\/screens\/home\//,
  /^packages\/ui\/src\/screens\/splash\//,
  /^tests\/(unit|visual|accessibility|functional)\/(home|splash)/,
  /^manifests\/C-00[15](?:-|\.)/,
];
const protectedChanges = changed.filter((file) => protectedPatterns.some((pattern) => pattern.test(file)));
const blockedScreenFiles = changed.filter((file) => /screens\/(auth|otp)|C-00[34]/i.test(file));
const runtimeFiles = changed.filter((file) => /^(apps|packages)\/.+\.(ts|tsx)$/.test(file) && fs.existsSync(path.join(root, file)));
const runtimeSource = runtimeFiles.map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
const locationScreen = fs.readFileSync(path.join(root, 'packages/ui/src/screens/location/LocationScreen.tsx'), 'utf8');
const completionPort = fs.readFileSync(path.join(root, 'packages/location/src/ports/location.ports.ts'), 'utf8');
const result = {
  base,
  head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  changedFiles: changed,
  protectedChanges,
  blockedScreenFiles,
  checks: {
    baseIsAncestor: true,
    frozenScreenSourcesUntouched: protectedChanges.length === 0,
    blockedScreensAbsent: blockedScreenFiles.length === 0,
    routeExists: fs.existsSync(path.join(root, 'apps/ui-lab/app/location/page.tsx')),
    domainPackageExists: fs.existsSync(path.join(root, 'packages/location/src/domain/location.machine.ts')),
    portsExist: completionPort.includes('LocationCompletionPort') && completionPort.includes('ServiceAreaService'),
    typedOutcomeOnly: runtimeSource.includes('LOCATION_CONFIRMED'),
    noDirectScreenNavigation: !locationScreen.includes('C-003') && !locationScreen.includes('C-005'),
    noExternalSecrets: !/(api[_-]?key|secret|token\s*=)/i.test(runtimeSource),
    noCoordinateLogging: !/console\.(log|info|debug)\([^)]*(latitude|longitude|coordinates)/i.test(runtimeSource),
    noBackgroundTracking: !/(watchPosition|background.*location)/i.test(runtimeSource),
  },
};
try { execFileSync('git', ['merge-base', '--is-ancestor', base, 'HEAD']); }
catch { result.checks.baseIsAncestor = false; }
result.passed = Object.values(result.checks).every(Boolean);
const output = path.join(root, 'qa/c002');
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'scope-audit.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(result);
if (!result.passed) process.exit(1);
