// Builds the files the page actually loads, so the game also runs on older
// browsers — Samsung / LG smart-TV browsers are often several years behind
// desktop Chrome and can't read modern JavaScript or CSS.
//
//   npm i -D esbuild@0.24   then   node tools/build.mjs
//
// Source stays in js/*.js and css/style.css. Output:
//   js/app.js                  everything in js/ bundled, down-levelled to Chrome 56
//   css/app.css                style.css down-levelled (e.g. `inset`)
//   js/vendor/peerjs.legacy.js PeerJS down-levelled the same way
import { build, transform } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';

const target = ['chrome56', 'safari11', 'firefox60', 'edge79'];
const root = new URL('../', import.meta.url);
const polyfills = await readFile(new URL('js/polyfills.js', root), 'utf8');

await build({
  entryPoints: [new URL('js/main.js', root).pathname],
  bundle: true, format: 'iife', target, minify: true, legalComments: 'none',
  banner: { js: polyfills },
  outfile: new URL('js/app.js', root).pathname,
});
await build({
  entryPoints: [new URL('css/style.css', root).pathname],
  bundle: true, target, minify: true, external: ['*.woff2', '*.png', '*.svg'],
  outfile: new URL('css/app.css', root).pathname,
});
const peer = await readFile(new URL('js/vendor/peerjs.min.js', root), 'utf8');
const out = await transform(peer, { target, minify: true, legalComments: 'none' });
await writeFile(new URL('js/vendor/peerjs.legacy.js', root), out.code);
console.log('built js/app.js, css/app.css, js/vendor/peerjs.legacy.js');
