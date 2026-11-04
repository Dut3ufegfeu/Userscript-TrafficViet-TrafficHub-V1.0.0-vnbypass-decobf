/**
 * traffichub_core_extracted.js
 * 
 * Toàn bộ các chuỗi, Regular Expressions và Headers giải mã từ
 * payload JSVMP 297 KB của Pastefy sH0NUUgb.
 */

// 1. Các Regular Expression được giải mã
const REGEX_PATTERNS = {
    INERTIA_APP_DIV: /<div[^>]*id=["']app["'][^>]*data-page=["']([^"']+)["']/i,
    INERTIA_LOCATION_HEADER: /x-inertia-location:\s*(.+)/i,
    SLUG_ROUTE: /\/s\/([^/?#]+)/,
    TARGET_KEYWORDS: /done|redirect|target|link|download|result/i,
    LINK_TAGS: /<a[^>]+href=["']([^"'#\s>]+)["']/gi,
    STATIC_FILES_FILTER: /\.(jpg|png|gif|css|js|svg|webp|pdf|zip)$/i,
    TRAILING_SLASH: /\/+$/
};

// 2. Các HTTP Headers chuyên dụng để tương tác với Inertia.js
const INERTIA_HEADERS = {
    INERTIA: "X-Inertia",
    INERTIA_VERSION: "X-Inertia-Version",
    REQUESTED_WITH: "X-Requested-With",
    CONTENT_TYPE: "Content-Type",
    ACCEPT: "Accept",
    COOKIE: "Cookie",
    REFERER: "Referer"
};

// 3. Các thuộc tính đối tượng trích xuất
const EXTRACTED_PROPERTIES = [
    "status",
    "body",
    "headers",
    "raw",
    "method",
    "url",
    "data",
    "timeout",
    "onload",
    "onerror",
    "ontimeout",
    "origin",
    "slug",
    "page",
    "cookie",
    "code",
    "useContext",
    "renderSection",
    "harmony"
];
