import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = process.cwd();
const publicRoot = resolve(root, 'public', 'assets');

const wrap = (body, viewBox = '0 0 240 240') => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-hidden="true">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#F6B800"/><stop offset="1" stop-color="#9A6E09"/></linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8A4E20"/><stop offset="1" stop-color="#2A1308"/></linearGradient>
    <linearGradient id="ice" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FFFFFF" stop-opacity=".95"/><stop offset="1" stop-color="#9EE7FF" stop-opacity=".65"/></linearGradient>
    <filter id="shadow"><feDropShadow dx="0" dy="9" stdDeviation="8" flood-color="#000" flood-opacity=".4"/></filter>
  </defs>
  ${body}
</svg>`;

const bottle = (body = '#7A3E16', label = '#D4A017') => wrap(`
  <ellipse cx="120" cy="214" rx="50" ry="13" fill="#000" opacity=".28"/>
  <g filter="url(#shadow)">
    <rect x="102" y="22" width="36" height="43" rx="8" fill="${body}"/>
    <path d="M96 58h48l12 31v98c0 19-13 29-36 29s-36-10-36-29V89z" fill="${body}"/>
    <rect x="89" y="106" width="62" height="58" rx="10" fill="#111" stroke="${label}" stroke-width="3"/>
    <circle cx="120" cy="135" r="16" fill="none" stroke="${label}" stroke-width="4"/>
    <path d="M112 135h16M120 127v16" stroke="${label}" stroke-width="3" stroke-linecap="round"/>
    <path d="M105 31h30" stroke="#E7C37A" stroke-width="4" opacity=".7"/>
  </g>`);

const can = (base = '#CDD7E0', accent = '#D4A017') => wrap(`
  <ellipse cx="120" cy="213" rx="49" ry="12" fill="#000" opacity=".28"/>
  <g filter="url(#shadow)">
    <rect x="78" y="30" width="84" height="176" rx="19" fill="${base}"/>
    <ellipse cx="120" cy="31" rx="42" ry="9" fill="#F7F7F7"/>
    <ellipse cx="120" cy="205" rx="42" ry="9" fill="#8E979F"/>
    <path d="M82 86 158 55v55L82 141z" fill="${accent}"/>
    <path d="M82 146 158 115v35l-76 31z" fill="#121212" opacity=".86"/>
    <path d="M99 48h42" stroke="#727C84" stroke-width="5" stroke-linecap="round"/>
  </g>`);

const iceBag = () => wrap(`
  <ellipse cx="120" cy="213" rx="64" ry="13" fill="#000" opacity=".25"/>
  <g filter="url(#shadow)">
    <path d="M56 58 75 30h90l19 28-11 150H67z" fill="#F3FBFF" stroke="#A5DCEB" stroke-width="4"/>
    <path d="M75 30h90l-12 24H87z" fill="#D8F4FF"/>
    <circle cx="120" cy="126" r="42" fill="#0A0A0A"/>
    <path d="M120 92v68M91 109l58 34M149 109l-58 34" stroke="#F6B800" stroke-width="6" stroke-linecap="round"/>
    <g fill="url(#ice)" opacity=".8"><rect x="73" y="65" width="30" height="28" rx="7"/><rect x="139" y="69" width="27" height="25" rx="7"/><rect x="83" y="170" width="27" height="25" rx="7"/><rect x="137" y="168" width="30" height="28" rx="7"/></g>
  </g>`);

const snackBag = () => wrap(`
  <ellipse cx="120" cy="214" rx="60" ry="12" fill="#000" opacity=".25"/>
  <g filter="url(#shadow)">
    <path d="M66 35h108l-9 175H75z" fill="url(#gold)"/>
    <path d="M76 53h88M75 190h90" stroke="#FFF1B8" stroke-width="5" opacity=".7"/>
    <circle cx="120" cy="121" r="39" fill="#111"/>
    <path d="M93 127c16-31 40-37 57-15-17 31-40 36-57 15Z" fill="#F6B800"/>
  </g>`);

const whiskey = () => wrap(`
  <ellipse cx="120" cy="214" rx="52" ry="12" fill="#000" opacity=".25"/>
  <g filter="url(#shadow)">
    <rect x="102" y="23" width="36" height="38" rx="5" fill="#2B160A"/>
    <path d="M78 63h84l10 139H68z" fill="#9A5419"/>
    <path d="M80 118h80v58H80z" fill="#111" stroke="#D4A017" stroke-width="3"/>
    <path d="M96 147h48" stroke="#D4A017" stroke-width="5"/>
    <path d="M91 78h58" stroke="#F2C36A" stroke-width="5" opacity=".55"/>
  </g>`);

const cola = () => wrap(`
  <ellipse cx="120" cy="214" rx="48" ry="12" fill="#000" opacity=".25"/>
  <g filter="url(#shadow)">
    <rect x="103" y="22" width="34" height="34" rx="6" fill="#A50812"/>
    <path d="M96 53h48l14 34v104c0 17-13 25-38 25s-38-8-38-25V87z" fill="#3A120B"/>
    <path d="M84 105h72v56H84z" fill="#C9141E"/>
    <path d="M96 137c14-23 39-24 49-7-15 20-36 23-49 7Z" fill="#FFF" opacity=".95"/>
  </g>`);

const pack = (energy = false) => wrap(`
  <ellipse cx="120" cy="214" rx="88" ry="13" fill="#000" opacity=".28"/>
  <g filter="url(#shadow)">
    <path d="M38 106h164l-19 96H57z" fill="#161616" stroke="#D4A017" stroke-width="4"/>
    <path d="M60 105C70 63 95 45 120 45s50 18 60 60" fill="none" stroke="#D4A017" stroke-width="8"/>
    ${energy ? '<rect x="70" y="50" width="42" height="105" rx="11" fill="#C9D4DD"/><path d="M72 92 110 73v30L72 122z" fill="#D4A017"/><rect x="127" y="44" width="40" height="111" rx="10" fill="#821018"/><path d="M130 92h34v34h-34z" fill="#F4EDE4"/>' : '<rect x="75" y="42" width="30" height="119" rx="12" fill="#6C3514"/><rect x="115" y="35" width="30" height="126" rx="12" fill="#6C3514"/><rect x="155" y="48" width="28" height="113" rx="12" fill="#6C3514"/><path d="M70 138h118" stroke="#E6F8FF" stroke-width="13" opacity=".8"/>'}
  </g>`);

const hero = () => wrap(`
  <rect width="720" height="260" fill="#070707"/>
  <circle cx="590" cy="130" r="150" fill="#D4A017" opacity=".09"/>
  <g opacity=".9" fill="url(#ice)"><rect x="400" y="40" width="80" height="70" rx="16" transform="rotate(-16 440 75)"/><rect x="580" y="28" width="90" height="82" rx="17" transform="rotate(12 625 69)"/><rect x="495" y="165" width="95" height="75" rx="17" transform="rotate(-8 542 202)"/><rect x="635" y="158" width="65" height="60" rx="14" transform="rotate(21 668 188)"/></g>
  <g filter="url(#shadow)"><rect x="510" y="35" width="38" height="50" rx="8" fill="#6C3514"/><path d="M497 78h64l16 42v116h-96V120z" fill="url(#glass)"/><rect x="487" y="128" width="84" height="68" rx="12" fill="#111" stroke="#D4A017" stroke-width="4"/><circle cx="529" cy="162" r="21" fill="none" stroke="#D4A017" stroke-width="5"/></g>
  <g opacity=".8" fill="#FFF"><circle cx="473" cy="77" r="4"/><circle cx="468" cy="98" r="3"/><circle cx="567" cy="96" r="4"/><circle cx="582" cy="121" r="3"/></g>`, '0 0 720 260');

const assets = {
  'categories/victoria.svg': bottle('#7A3E16', '#F6B800'),
  'categories/whiskey.svg': whiskey(),
  'categories/redbull.svg': can('#D7E0E8', '#D4A017'),
  'categories/ice-bag.svg': iceBag(),
  'categories/cocacola.svg': cola(),
  'categories/lays.svg': snackBag(),
  'products/victoria.svg': bottle('#7A3E16', '#F6B800'),
  'products/estrella.svg': bottle('#4A220D', '#D4A017'),
  'products/redbull.svg': can('#D7E0E8', '#D4A017'),
  'products/ice-bag.svg': iceBag(),
  'products/pack-cervecero.svg': pack(false),
  'products/mix-energia.svg': pack(true),
  'hero/cold-beer-hero.svg': hero(),
};

for (const [relativePath, content] of Object.entries(assets)) {
  const destination = resolve(publicRoot, relativePath);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, content, 'utf8');
}

console.log(`Materialized ${Object.keys(assets).length} deterministic SVG assets in ${publicRoot}`);
