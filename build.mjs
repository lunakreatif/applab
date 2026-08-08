#!/usr/bin/env node
/**
 * AppLab site üreticisi. Bağımlılık YOK — yalnızca Node yerleşikleri.
 *
 * Neden üretici: her uygulama için tanıtım + gizlilik + destek olmak üzere üç
 * sayfa gerekiyor. Elle HTML çoğaltmak, ikinci uygulamada gizlilik metnini bir
 * yerde güncelleyip diğerini unutmakla biter. Tek kaynak `data/apps.json`.
 *
 * Neden üretilen HTML depoya giriyor: GitHub Pages Actions olmadan da yayınlasın.
 * Kurulum kırılganlığı, kazanılan birkaç kilobayta değmez.
 *
 *   node build.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const data = JSON.parse(readFileSync('data/apps.json', 'utf8'));
const { site, categories, apps } = data;

/** HTML'e gömülen düz metin. `body`/`after` alanları BİLEREK kaçırılmaz — orada
 *  kasıtlı işaretleme var (bkz. apps.json). Kullanıcı girdisi değil, bizim metnimiz. */
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Alt klasördeki sayfalardan köke dönüş yolu. */
const rel = (depth) => (depth === 0 ? '' : '../'.repeat(depth));

function layout({ title, description, depth, accent, body, active }) {
  const r = rel(depth);
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<link rel="icon" href="${r}assets/favicon.svg">
<link rel="stylesheet" href="${r}assets/style.css">
${accent ? `<style>:root{--accent:${accent}}</style>` : ''}
</head>
<body>
<header class="ust">
  <a class="marka" href="${r}index.html">
    <span class="marka-ad">${esc(site.name)}</span>
    <span class="marka-alt">${esc(site.studio)}</span>
  </a>
  <nav>
    <a href="${r}index.html"${active === 'home' ? ' class="secili"' : ''}>Uygulamalar</a>
    <a href="mailto:${esc(site.contactEmail)}">İletişim</a>
  </nav>
</header>
<main>
${body}
</main>
<footer class="alt">
  <p>© ${site.year} ${esc(site.studio)} · <a href="mailto:${esc(site.contactEmail)}">${esc(site.contactEmail)}</a></p>
</footer>
</body>
</html>
`;
}

function anaSayfa() {
  const bolumler = categories
    .map((kat) => {
      const liste = apps.filter((a) => a.category === kat.slug);
      if (!liste.length) return '';
      return `
  <section class="kategori" id="${esc(kat.slug)}">
    <h2>${esc(kat.name)}</h2>
    <p class="kategori-not">${esc(kat.description)}</p>
    <div class="izgara">
      ${liste.map(kart).join('\n      ')}
    </div>
  </section>`;
    })
    .join('\n');

  return layout({
    title: `${site.name} — ${site.studio}`,
    description: site.intro,
    depth: 0,
    active: 'home',
    body: `
  <section class="giris">
    <h1>${esc(site.tagline)}</h1>
    <p>${esc(site.intro)}</p>
  </section>
${bolumler}`,
  });
}

function kart(app) {
  const rozet = app.statusLabel ? `<span class="rozet rozet-${esc(app.status)}">${esc(app.statusLabel)}</span>` : '';
  return `<a class="kart" href="${esc(app.slug)}/index.html" style="--accent:${esc(app.accent)}">
        <img class="kart-ikon" src="${esc(app.icon)}" alt="${esc(app.name)} simgesi" width="72" height="72">
        <div class="kart-metin">
          <h3>${esc(app.name)}</h3>
          <p>${esc(app.tagline)}</p>
          ${rozet}
        </div>
      </a>`;
}

function uygulamaSayfasi(app) {
  const magaza = [
    app.links.appStore ? `<a class="dugme" href="${esc(app.links.appStore)}">App Store</a>` : '',
    app.links.googlePlay ? `<a class="dugme" href="${esc(app.links.googlePlay)}">Google Play</a>` : '',
  ]
    .filter(Boolean)
    .join('\n        ');

  return layout({
    title: `${app.name} — ${site.name}`,
    description: app.tagline,
    depth: 1,
    accent: app.accent,
    body: `
  <article class="uygulama">
    <header class="uygulama-ust">
      <img class="uygulama-ikon" src="../${esc(app.icon)}" alt="${esc(app.name)} simgesi" width="112" height="112">
      <div>
        <h1>${esc(app.name)}</h1>
        <p class="slogan">${esc(app.tagline)}</p>
        <p class="kunye">
          ${app.platforms.map(esc).join(' · ')} · ${esc(app.price)} · ${app.languages.map(esc).join(', ')}
        </p>
        ${magaza || `<p class="rozet rozet-${esc(app.status)}">${esc(app.statusLabel)}</p>`}
      </div>
    </header>

    <p class="lead">${esc(app.lead)}</p>

    <section class="vitrin">
      ${app.screenshots
        .map(
          (s) => `<figure>
        <img src="../${esc(s.src)}" alt="${esc(s.caption)}" loading="lazy">
        <figcaption>${esc(s.caption)}</figcaption>
      </figure>`,
        )
        .join('\n      ')}
    </section>

    <section class="ozellikler">
      ${app.features
        .map(
          (f) => `<div class="ozellik">
        <h3>${esc(f.title)}</h3>
        <p>${esc(f.body)}</p>
      </div>`,
        )
        .join('\n      ')}
    </section>

    <nav class="alt-baglantilar">
      <a href="gizlilik/index.html">Gizlilik Politikası</a>
      <a href="destek/index.html">Destek</a>
    </nav>
  </article>`,
  });
}

function gizlilikSayfasi(app) {
  const bolumler = app.privacy.sections
    .map((b) => {
      const liste = b.list ? `<ul>${b.list.map((x) => `<li>${x}</li>`).join('')}</ul>` : '';
      const sonra = b.after ? `<p>${b.after}</p>` : '';
      return `
    <h2>${esc(b.title)}</h2>
    ${b.body ? `<p>${b.body}</p>` : ''}
    ${liste}
    ${sonra}`;
    })
    .join('\n');

  return layout({
    title: `${app.name} — Gizlilik Politikası`,
    description: `${app.name} gizlilik politikası`,
    depth: 2,
    accent: app.accent,
    body: `
  <article class="metin">
    <p class="firari"><a href="../index.html">← ${esc(app.name)}</a></p>
    <h1>${esc(app.name)} — Gizlilik Politikası</h1>
    <p class="kunye">Son güncelleme: ${esc(app.privacy.updated)}</p>

    <div class="ozet"><p>${esc(app.privacy.summary)}</p></div>
${bolumler}

    <h2>İletişim</h2>
    <p>${esc(site.studio)}<br>E-posta: <a href="mailto:${esc(site.contactEmail)}">${esc(site.contactEmail)}</a></p>
  </article>`,
  });
}

function destekSayfasi(app) {
  const sss = app.support.faq
    .map(
      (f) => `<details>
      <summary>${esc(f.q)}</summary>
      <p>${esc(f.a)}</p>
    </details>`,
    )
    .join('\n    ');

  return layout({
    title: `${app.name} — Destek`,
    description: `${app.name} destek ve sık sorulan sorular`,
    depth: 2,
    accent: app.accent,
    body: `
  <article class="metin">
    <p class="firari"><a href="../index.html">← ${esc(app.name)}</a></p>
    <h1>${esc(app.name)} — Destek</h1>
    <p>${esc(app.support.intro)}</p>

    <div class="ozet">
      <p><strong>E-posta:</strong> <a href="mailto:${esc(site.contactEmail)}?subject=${encodeURIComponent(app.name + ' — destek')}">${esc(site.contactEmail)}</a></p>
    </div>

    <h2>Sık sorulan sorular</h2>
    ${sss}

    <h2>Gizlilik</h2>
    <p>Hangi verilerin toplandığını <a href="../gizlilik/index.html">gizlilik politikasında</a> bulabilirsin.</p>
  </article>`,
  });
}

function yaz(yol, icerik) {
  mkdirSync(dirname(yol), { recursive: true });
  writeFileSync(yol, icerik);
  console.log('  ✓', yol);
}

// Üretilen sayfalar temizlenip yeniden yazılır; silinen bir uygulamanın sayfası
// depoda kalmasın.
for (const app of apps) if (existsSync(app.slug)) rmSync(app.slug, { recursive: true });

console.log('AppLab üretiliyor…');
yaz('index.html', anaSayfa());
for (const app of apps) {
  yaz(join(app.slug, 'index.html'), uygulamaSayfasi(app));
  yaz(join(app.slug, 'gizlilik', 'index.html'), gizlilikSayfasi(app));
  yaz(join(app.slug, 'destek', 'index.html'), destekSayfasi(app));
}
// Jekyll kapalı: alt çizgiyle başlayan klasörleri yutuyor ve bize gereksiz.
writeFileSync('.nojekyll', '');
writeFileSync('CNAME', `${new URL(site.url).host}\n`);
console.log(`${apps.length} uygulama, ${1 + apps.length * 3} sayfa.`);
