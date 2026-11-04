// ==UserScript==
// @name         TrafficViet & TrafficHub Bypasser (Deobfuscated)
// @version      1.0.0
// @description  Bản giải mã sạch logic bypass TrafficViet & TrafficHub tự động siêu tốc qua Inertia.js API
// @author       DuckXkurumi (Deobfuscated by Community)
// @match        *://app.trafficviet.vn/*
// @match        *://system.traffichub.vn/*
// @grant        GM_xmlhttpRequest
// @grant        GM_cookie
// @connect      *
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
    console.log('[TrafficHub Bypass] Script đã được giải mã và nạp thành công');

    // 1. Phân tích trạng thái trang Inertia.js
    function getInertiaData() {
        const appElem = document.querySelector('#app[data-page], div[data-page]');
        if (!appElem) return null;
        try {
            const raw = appElem.getAttribute('data-page');
            return JSON.parse(raw);
        } catch (e) {
            console.error('[TrafficHub Bypass] Lỗi giải mã data-page:', e);
            return null;
        }
    }

    // 2. Tự động gửi request hoàn thành nhiệm vụ và lấy link đích
    function triggerInertiaBypass(targetUrl, inertiaVersion) {
        console.log('[TrafficHub Bypass] Đang bypass URL:', targetUrl);

        GM_xmlhttpRequest({
            method: 'GET',
            url: targetUrl,
            headers: {
                'X-Inertia': 'true',
                'X-Inertia-Version': inertiaVersion || '',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'text/html, application/xhtml+xml',
                'Content-Type': 'application/json'
            },
            onload: function(response) {
                console.log('[TrafficHub Bypass] Phản hồi nhận được:', response.status);

                // Kiểm tra header chuyển hướng của Inertia
                const headers = response.responseHeaders || '';
                const locMatch = headers.match(/x-inertia-location:\s*(.+)/i);
                if (locMatch && locMatch[1]) {
                    const redirectUrl = locMatch[1].trim();
                    console.log('[TrafficHub Bypass] Phát hiện link đích từ x-inertia-location:', redirectUrl);
                    window.location.href = redirectUrl;
                    return;
                }

                // Kiểm tra nội dung JSON phản hồi
                try {
                    const data = JSON.parse(response.responseText);
                    const url = data.url || (data.props && data.props.target) || (data.props && data.props.redirect);
                    if (url && /^https?:\/\//i.test(url)) {
                        console.log('[TrafficHub Bypass] Phát hiện link đích từ JSON:', url);
                        window.location.href = url;
                        return;
                    }
                } catch (e) {}

                // Quét link đích theo từ khóa: done | redirect | target | link | download | result
                const linkMatch = response.responseText.match(/<a[^>]+href=["']([^"'#\s>]+)["'][^>]*>(?:done|redirect|target|link|download|result)/i);
                if (linkMatch && linkMatch[1]) {
                    console.log('[TrafficHub Bypass] Phát hiện link từ thẻ A:', linkMatch[1]);
                    window.location.href = linkMatch[1];
                }
            },
            onerror: function(err) {
                console.error('[TrafficHub Bypass] Lỗi khi gửi request:', err);
            }
        });
    }

    // 3. Khởi chạy
    const pageData = getInertiaData();
    if (pageData) {
        console.log('[TrafficHub Bypass] Inertia page data:', pageData);
        const version = pageData.version || '';
        const currentUrl = window.location.href;
        
        // Bắt router dạng /s/{slug}
        const slugMatch = currentUrl.match(/\/s\/([^/?#]+)/);
        if (slugMatch) {
            triggerInertiaBypass(currentUrl, version);
        }
    }
})();
