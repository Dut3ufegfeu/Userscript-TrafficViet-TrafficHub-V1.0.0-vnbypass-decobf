/* Build TrafficViet.selfhost.user.js — same interceptor pattern as layma selfhost:
 * embed engine (pastefy sH0NUUgb) + intercept author URLs, run chain offline. */
const fs = require('fs');

const engine = fs.readFileSync('../dl/traffic/stage2_pastefy.js', 'utf8');
const EMBED = { traffic_engine: engine };
const MAP = [['pastefy.app/sH0NUUgb', 'traffic_engine']];

const header = `// ==UserScript==
// @name         TrafficViet & TrafficHub Bypasser (SELFHOST decobf)
// @namespace    https://github.com/Dut3ufegfeu/layma-vnbypass-decobf
// @version      1.0.0-selfhost.1
// @description  Bypass nhiệm vụ TrafficViet & TrafficHub — bản self-host: engine đã nhúng sẵn, không phụ thuộc link của tác giả (pastefy).
// @author       DuckXkurumi (nguyên bản) · decobf & selfhost: Dut3ufegfeu
// @icon         https://files.catbox.moe/8p9l8w.jpg
// @match        *://app.trafficviet.vn/*
// @match        *://system.traffichub.vn/*
// @connect      *
// @grant        GM_xmlhttpRequest
// @grant        GM_cookie
// @grant        unsafeWindow
// @run-at       document-idle
// @updateURL    https://github.com/Dut3ufegfeu/layma-vnbypass-decobf/raw/main/TrafficViet.selfhost.user.js
// @downloadURL  https://github.com/Dut3ufegfeu/layma-vnbypass-decobf/raw/main/TrafficViet.selfhost.user.js
// @license      MIT
// ==/UserScript==
`;

const body = `
/* SELF-HOSTED DECOfB BUILD — sinh tự động bởi tools/build_selfhost_traffic.js.
 * Engine (297 KB) nhúng sẵn; request tới pastefy.app/sH0NUUgb được phục vụ từ bản nhúng. */
(function () {
  var EMBED = {
${Object.entries(EMBED).map(([k, v]) => '    ' + JSON.stringify(k) + ': ' + JSON.stringify(v)).join(',\n')}
  };
  var MAP = ${JSON.stringify(MAP)};

  function matchKey(url) {
    var s = String(url || '');
    for (var i = 0; i < MAP.length; i++) if (s.indexOf(MAP[i][0]) !== -1) return MAP[i][1];
    return null;
  }
  function fakeResponse(src) {
    return {
      ok: true, status: 200, statusText: 'OK (selfhost)',
      headers: { get: function () { return null; } },
      text: function () { return Promise.resolve(src); },
      json: function () { return Promise.resolve(JSON.parse(src)); }
    };
  }

  var _fetch = typeof fetch === 'function' ? fetch : null;
  function patchedFetch(url, opts) {
    var key = matchKey(url);
    if (key && EMBED[key]) {
      try { console.info('[selfhost] phục vụ từ bản nhúng:', String(url).split('?')[0], '->', key); } catch (e) {}
      return Promise.resolve(fakeResponse(EMBED[key]));
    }
    if (_fetch) return _fetch.call(this, url, opts);
    return Promise.reject(new Error('selfhost: fetch unavailable'));
  }
  try { window.fetch = patchedFetch; } catch (e) {}

  var _gmxhr = typeof GM_xmlhttpRequest === 'function' ? GM_xmlhttpRequest : null;
  function patchedGM(details) {
    var key = details && matchKey(details.url);
    if (key && EMBED[key]) {
      try { console.info('[selfhost] GM_xhr phục vụ từ bản nhúng:', String(details.url).split('?')[0]); } catch (e) {}
      var src = EMBED[key];
      setTimeout(function () {
        (details.onload || function () {})({ status: 200, readyState: 4, responseText: src, response: src, responseHeaders: 'content-type: text/plain' });
      }, 0);
      return { abort: function () {} };
    }
    if (_gmxhr) return _gmxhr(details);
    throw new Error('selfhost: GM_xmlhttpRequest unavailable');
  }
  try { GM_xmlhttpRequest = patchedGM; } catch (e) {}
  try { window.GM_xmlhttpRequest = patchedGM; } catch (e) {}
  try { if (typeof unsafeWindow !== 'undefined') { unsafeWindow.GM_xmlhttpRequest = patchedGM; } } catch (e) {}

  /* Làm đúng việc mà funcion.js gốc làm (đã deobf): fetch paste -> eval */
  patchedFetch('https://pastefy.app/sH0NUUgb/raw?t=' + Date.now())
    .then(function (response) { return response.text(); })
    .then(function (code) {
      try { window.GM_xmlhttpRequest = patchedGM; } catch (e) {}
      try { if (typeof unsafeWindow !== 'undefined') { unsafeWindow.GM_xmlhttpRequest = patchedGM; } } catch (e) {}
      (0, eval)(code);
    })
    .catch(function (error) { console.error('[selfhost] Lỗi khi nạp payload:', error); });
})();
`;

fs.writeFileSync('../site/repo/TrafficViet.selfhost.user.js', header + body);
console.log('written:', (fs.statSync('../site/repo/TrafficViet.selfhost.user.js').size / 1024).toFixed(0) + ' KB');
