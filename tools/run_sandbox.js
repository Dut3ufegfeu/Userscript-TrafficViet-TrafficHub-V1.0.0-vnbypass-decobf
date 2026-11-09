/* Dynamic analysis sandbox for the layma loader chain stages. Heavy stubs, everything logged,
 * zero real side effects, Node globals denied. NOT run against any real site. */
const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync(process.argv[2] || '../dl/layma/stage4_patched.js', 'utf8');

const log = [];
const L = (kind, args) => {
  const line = kind + ' :: ' + args.map(a => {
    try { return typeof a === 'object' && a !== null ? JSON.stringify(a).slice(0, 200) : String(a).slice(0, 200); }
    catch (e) { return '[unserializable]'; }
  }).join(' | ');
  if (log.length < 20000) log.push(line);
};

/* universal absorber: callable, self-returning, coercible — lets unknown chains continue */
const universal = new Proxy(function () { }, {
  get(t, p) {
    if (p === Symbol.toPrimitive) return () => '';
    if (p === 'toString') return () => '';
    if (p === 'then' || p === 'catch' || p === 'finally') return undefined;
    return universal;
  },
  apply() { return universal; },
  construct() { return universal; },
});

const DENY = new Set(['process', 'require', 'module', '__dirname', '__filename', 'global', 'Buffer', 'child_process', 'fs', 'os', 'net', 'http', 'https', 'worker_threads', 'v8', 'vm']);
const SKIP_GT = new Set(['fetch', 'performance', 'crypto', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'queueMicrotask', 'console', 'document', 'navigator', 'location']);
function healingProxy(target, label) {
  return new Proxy(target, {
    get(t, p, r) {
      if (typeof p === 'symbol') return Reflect.get(t, p, r);
      if (p in t) return Reflect.get(t, p, r);
      if (DENY.has(p)) { L('DENIED.' + label, [p]); return undefined; }
      if (p in globalThis && !SKIP_GT.has(p)) return globalThis[p];
      L('MISSING.' + label, [String(p)]);
      return universal;
    },
    has(t, p) { return true; },
  });
}

function stubEl(tag) {
  const el = healingProxy({
    tagName: (tag || 'div').toUpperCase(), style: {}, dataset: {}, children: [], attributes: {},
    classList: { add() {}, remove() {}, contains() { return false; }, toggle() {} },
    setAttribute(k, v) { this.attributes[k] = v; }, getAttribute(k) { return this.attributes[k] ?? null; },
    appendChild(c) { this.children.push(c); return c; }, removeChild(c) { return c; }, remove() {},
    addEventListener(type, fn) { L('el.addEventListener', [this.tagName, type]); },
    removeEventListener() {}, click() { L('el.click', [this.tagName]); },
    querySelector() { return stubEl('q'); }, querySelectorAll() { return []; },
    closest() { return null; }, contains() { return false; },
    insertBefore(c) { return c; }, focus() {}, blur() {}, select() {}, submit() {},
    getBoundingClientRect() { return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }; },
    value: '', textContent: '', innerHTML: '', innerText: '', src: '', href: '', id: '', className: '',
    disabled: false, checked: false, parentNode: null, parentElement: null, offsetParent: null,
    offsetWidth: 100, offsetHeight: 30, scrollIntoView() {}, attachShadow() { return stubEl('shadow'); },
    getRootNode() { return elRoot; }, dispatchEvent() { return true; },
    scrollTo() {}, scrollBy() {}, animate: () => ({ finished: Promise.resolve(), cancel() {} }),
    matches: () => false, requestSubmit() {}, reportValidity() {}, checkValidity: () => true,
    setSelectionRange() {}, getAnimations: () => [], after() {}, before() {}, replaceWith() {}, prepend() {}, append() {},
    scrollWidth: 100, scrollHeight: 100, clientWidth: 100, clientHeight: 30,
  }, 'el');
  return el;
}
const elRoot = stubEl('html');
elRoot.body = stubEl('body');
elRoot.head = stubEl('head');
elRoot.documentElement = elRoot;

const documentStub = healingProxy({
  documentElement: elRoot, body: elRoot.body, head: elRoot.head,
  cookie: '', title: 'layma', referrer: '', readyState: 'complete', hidden: false, visibilityState: 'visible',
  querySelector(sel) { L('document.querySelector', [sel]); return stubEl('qs:' + sel); },
  querySelectorAll(sel) { L('document.querySelectorAll', [sel]); return []; },
  getElementById(id) { L('document.getElementById', [id]); return stubEl('#' + id); },
  getElementsByClassName(c) { L('document.getElementsByClassName', [c]); return []; },
  getElementsByTagName(t) { L('document.getElementsByTagName', [t]); return []; },
  createElement(t) { L('document.createElement', [t]); return stubEl(t); },
  createTextNode(t) { return { textContent: t }; },
  addEventListener(type, fn) { L('document.addEventListener', [type]); },
  removeEventListener() {}, createEvent() { return { initEvent() {} }; },
  write() { L('document.write', [...arguments]); }, writeln() {},
  execCommand() { return false; }, exitFullscreen() {},
  hasFocus() { return true; }, activeElement: stubEl('active'),
  fonts: { ready: Promise.resolve(), check: () => true },
  adoptNode: n => n, importNode: n => n, timeline: { play() {} },
  pictureinpicture: { enabled: false },
  elementFromPoint: () => stubEl('efp'),
  caretPositionFromPoint: () => null,
  createRange: () => ({ selectNode() {}, selectNodeContents() {}, collapse() {}, getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 }; }, setStart() {}, setEnd() {}, cloneRange() { return this; }, commonAncestorContainer: elRoot }),
  getSelection: () => ({ addRange() {}, removeAllRanges() {}, rangeCount: 0, toString: () => '', getRangeAt: () => documentStub.createRange() }),
  caretRangeFromPoint: () => null,
  queryCommandSupported: () => true, hasStorageAccess: () => Promise.resolve(false), requestStorageAccess: () => Promise.resolve(),
}, 'document');

const timers = [];
function mkTimer(kind) {
  return function (fn, ms, ...rest) {
    timers.push({ kind, ms, fn });
    L(kind, [typeof fn === 'function' ? '[fn]' : fn, ms]);
    if (kind === 'setTimeout') { try { fn(...rest); } catch (e) { L('timer.err', [e.message]); } }
    return timers.length;
  };
}

const GM_xmlhttpRequest = function (details) {
  L('GM_xmlhttpRequest', [details.method, details.url]);
  setTimeout(() => { try { details.onerror && details.onerror({ error: 'sandbox' }); details.onload && details.onload({ status: 0, responseText: '', readyState: 4 }); } catch (e) {} }, 0);
  return { abort() {} };
};

const fetchStub = function (url, opts) {
  L('fetch', [String(url), opts && opts.method]);
  return Promise.resolve({ ok: true, status: 200, statusText: 'OK', text: () => Promise.resolve('/*sandbox-empty*/'), json: () => Promise.resolve({}), headers: { get() { return null; } } });
};

const sandbox = { /*plain: vm.createContext(Proxy) làm hỏng indirect eval*/
  console: {
    log: (...a) => L('console.log', a), warn: (...a) => L('console.warn', a),
    error: (...a) => {
      const errs = a.filter(x => x instanceof Error);
      L('console.error', a);
      errs.forEach(e => L('console.error.stack', [String(e.stack).split('\n').slice(0, 14).join(' || ')]));
    },
    info: () => {}, debug: () => {}, table: () => {},
    trace: () => {}, dir: () => {}, exception: (...a) => L('console.error', a),
  },
  document: documentStub,
  location: healingProxy({ href: 'https://layma.net/', origin: 'https://layma.net', host: 'layma.net', hostname: 'layma.net', pathname: '/', protocol: 'https:', search: '', hash: '', assign() {}, replace() {}, reload() { L('location.reload', []); } }, 'location'),
  navigator: healingProxy({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Sandbox', language: 'vi-VN', languages: ['vi-VN', 'en'],
    platform: 'Win32', webdriver: false, hardwareConcurrency: 8, deviceMemory: 8, maxTouchPoints: 0, vendor: 'Google Inc.',
    clipboard: { writeText: t => { L('clipboard.writeText', [t]); return Promise.resolve(); }, readText: () => Promise.resolve('') },
    sendBeacon: () => true,
    connection: { effectiveType: '4g', downlink: 10, rtt: 50, saveData: false },
    mediaDevices: { enumerateDevices: () => Promise.resolve([]), getUserMedia: () => Promise.reject(new Error('sbx')) },
    serviceWorker: { register: () => Promise.reject(new Error('sbx')), getRegistration: () => Promise.resolve() },
    permissions: { query: () => Promise.resolve({ state: 'denied', onchange: null }) },
    storage: { estimate: () => Promise.resolve({ quota: 1, usage: 0 }), persisted: () => Promise.resolve(false) },
    getGamepads: () => [], vibrate: () => false, getBattery: () => Promise.resolve({ level: 1, charging: true, addEventListener() {} }),
  }, 'navigator'),
  history: healingProxy({ pushState() { L('history.pushState', [...arguments]); }, replaceState() {}, back() {} }, 'history'),
  fetch: fetchStub,
  XMLHttpRequest: function () { this.open = (m, u) => L('xhr.open', [m, u]); this.send = () => {}; this.setRequestHeader = () => {}; this.addEventListener = () => {}; },
  GM_xmlhttpRequest, GM_setValue: (k, v) => L('GM_setValue', [k, v]), GM_getValue: (k, d) => { L('GM_getValue', [k]); return d; },
  GM_deleteValue: k => L('GM_deleteValue', [k]), GM_listValues: () => [], GM_setClipboard: t => L('GM_setClipboard', [t]),
  GM_addStyle: c => L('GM_addStyle', [String(c).slice(0, 100)]), GM_openInTab: u => L('GM_openInTab', [u]), GM_notification: d => L('GM_notification', [JSON.stringify(d).slice(0, 120)]),
  GM_registerMenuCommand: (n, f) => L('GM_registerMenuCommand', [n]), GM_download: d => L('GM_download', [JSON.stringify(d).slice(0, 120)]),
  GM: healingProxy({
    setValue: (k, v) => L('GM.setValue', [k]), getValue: (k, d) => { L('GM.getValue', [k]); return d; },
    deleteValue: k => L('GM.deleteValue', [k]), listValues: () => [],
    xmlHttpRequest: GM_xmlhttpRequest, setClipboard: t => L('GM.setClipboard', [t]),
    addStyle: c => L('GM.addStyle', [String(c).slice(0, 80)]), openInTab: u => L('GM.openInTab', [u]),
    notification: d => L('GM.notification', [JSON.stringify(d).slice(0, 100)]),
    registerMenuCommand: (n, f) => L('GM.registerMenuCommand', [n]), download: d => L('GM.download', []),
    addValueChangeListener: () => 0, removeValueChangeListener() {},
  }, 'GM'),
  GM_info: healingProxy({ script: healingProxy({ name: 'x', version: '1.1.4', namespace: 'tm', description: 'd' }, 'GM_info.script') }, 'GM_info'),
  setInterval: mkTimer('setInterval'), setTimeout: mkTimer('setTimeout'), clearInterval() {}, clearTimeout() {},
  requestAnimationFrame: fn => { try { fn(Date.now()); } catch (e) { L('raf.err', [e.message]); } return 1; },
  addEventListener: (t, f) => L('window.addEventListener', [t]), removeEventListener() {},
  alert: m => L('alert', [m]), confirm: m => { L('confirm', [m]); return true; }, prompt: m => { L('prompt', [m]); return ''; },
  open: u => L('window.open', [u]), close() {}, focus() {}, print() {},
  Notification: { requestPermission: () => Promise.resolve('granted'), permission: 'granted' },
  MutationObserver: function (cb) { this.observe = (t, o) => L('MutationObserver.observe', [t && t.tagName, JSON.stringify(o).slice(0, 80)]); this.disconnect = () => {}; },
  IntersectionObserver: function (cb) { this.observe = () => {}; this.disconnect = () => {}; },
  PerformanceObserver: function (cb) { this.observe = () => {}; this.disconnect = () => {}; },
  getComputedStyle: () => ({ getPropertyValue: () => '' }),
  matchMedia: () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {} }),
  atob, btoa, TextEncoder, TextDecoder, URL, URLSearchParams, Blob: function () {}, File: function () {},
  FormData: function () { this.append = () => {}; }, Headers: function () {},
  AbortController: class { constructor() { this.signal = {}; } abort() {} },
  crypto: require('crypto').webcrypto, CustomEvent: function (t, o) { this.type = t; }, Event: function (t) { this.type = t; },
  MouseEvent: function (t) { this.type = t; }, KeyboardEvent: function (t) { this.type = t; },
  HTMLElement: class {}, Element: class {}, Node: class {},
  localStorage: healingProxy({ getItem: () => null, setItem: (k, v) => L('localStorage.set', [k]), removeItem: () => {} }, 'localStorage'),
  sessionStorage: healingProxy({ getItem: () => null, setItem: () => {}, removeItem: () => {} }, 'sessionStorage'),
  screen: { width: 1920, height: 1080 }, innerWidth: 1920, innerHeight: 1080,
  devicePixelRatio: 1, origin: 'https://layma.net',
  Image: function () { this.src = ''; }, Audio: function () {}, Option: function () {},
  performance: { now: () => Date.now(), timeOrigin: Date.now(), getEntriesByType: () => [], mark() {}, measure() {} },
  queueMicrotask: fn => { try { fn(); } catch (e) { L('qmt.err', [e.message]); } },
  structuredClone: o => { try { return JSON.parse(JSON.stringify(o)); } catch (e) { return o; } },
  requestIdleCallback: fn => { try { fn({ didTimeout: false, timeRemaining: () => 50 }); } catch (e) { L('ric.err', [e.message]); } return 1; },
  cancelIdleCallback() {}, getSelection: () => documentStub.getSelection(), find: () => false,
  scroll() {}, scrollTo() {}, scrollBy() {}, moveTo() {}, resizeTo() {},
  customElements: { define: (...a) => L('customElements.define', a), get: () => undefined, whenDefined: () => Promise.resolve() },
};
sandbox.window = sandbox; sandbox.self = sandbox; sandbox.top = sandbox; sandbox.parent = sandbox; sandbox.frames = sandbox;
sandbox.unsafeWindow = sandbox;
const ctx = vm.createContext(sandbox);

/* neutralize the self-defending catastrophic-regex lock so the sandbox can't wedge */
try {
  vm.runInContext('const _origSearch = String.prototype.search; String.prototype.search = function (r) { try { const s = String(r); if (s.includes("(((.+)+)+)+")) return -1; } catch (e) {} return _origSearch.call(this, r); };', ctx);
} catch (e) { console.error('patch err', e.message); }

function dump(reason) {
  console.log('===', reason, '===');
  console.log('=== ACTIVITY LOG (first 400) ===');
  log.slice(0, 400).forEach(l => console.log(l));
  console.log('=== total events:', log.length, 'timers queued:', timers.length);
  fs.writeFileSync('../dl/layma/out2/sandbox_activity.log', log.join('\n'));
  process.exit(0);
}
process.on('unhandledRejection', e => dump('unhandledRejection: ' + (e && e.message)));
process.on('uncaughtException', e => dump('uncaughtException: ' + (e && e.message)));

try {
  vm.runInContext(code, ctx, { timeout: 60000, filename: 'stage.js' });
  console.log('[*] top-level executed');
} catch (e) {
  console.log('[!] threw:', e.constructor.name, e.message.slice(0, 300));
}
setTimeout(() => dump('completed'), 4000);
