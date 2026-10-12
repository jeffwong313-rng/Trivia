/* Small polyfills for older smart-TV browsers (prepended to js/app.js by tools/build.mjs). */
(function () {
  if (!Object.fromEntries) Object.fromEntries = function (it) { var o = {}; Array.from(it).forEach(function (p) { o[p[0]] = p[1]; }); return o; };
  if (!Array.prototype.flat) Object.defineProperty(Array.prototype, 'flat', { configurable: true, writable: true, value: function (d) { d = d === undefined ? 1 : d; return d < 1 ? this.slice() : this.reduce(function (a, v) { return a.concat(Array.isArray(v) ? v.flat(d - 1) : v); }, []); } });
  if (!Array.prototype.flatMap) Object.defineProperty(Array.prototype, 'flatMap', { configurable: true, writable: true, value: function (f, t) { return this.map(f, t).flat(); } });
  if (!String.prototype.padStart) String.prototype.padStart = function (n, s) { var t = String(this); s = s === undefined ? ' ' : String(s); while (t.length < n) t = s + t; return t.slice(-Math.max(n, String(this).length)); };
  if (window.NodeList && !NodeList.prototype.forEach) NodeList.prototype.forEach = Array.prototype.forEach;
})();
