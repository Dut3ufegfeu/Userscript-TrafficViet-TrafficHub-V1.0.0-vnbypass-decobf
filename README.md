# Userscript TrafficViet & TrafficHub Bypasser (Deobfuscated)

Mã nguồn đã được phân tích, bẻ khóa và giải mã hoàn chỉnh từ Userscript:
**`TrafficViet & TrafficHub Bypasser - CUTTAY PROMAX` (v1.0.0)** của tác giả `DuckXkurumi`.

## 📌 Phân tích chuỗi nạp mã từ xa (Multi-stage Dropper)

Bản gốc trên website `duckxkurumi.xyz` được giấu qua nhiều tầng:
```
[traffichub.user.js]
         │ (@require)
         ▼
[Stage 1: traffichub-funcion.js] (228 KB - Bytecode VM Packer)
         │ (fetch + eval)
         ▼
[Stage 2: pastefy.app/sH0NUUgb/raw] (297 KB - UTF-8 String Decoder VM)
         │
         ▼
[Core Bypass Engine] (Bypass TrafficViet & TrafficHub qua Inertia.js API)
```

## ⚙️ Cơ chế hoạt động Bypass
Cả hai hệ thống `app.trafficviet.vn` và `system.traffichub.vn` đều được phát triển dựa trên **Laravel + Inertia.js**:
1. Script đọc dữ liệu trạng thái được nhúng sẵn trong DOM tại `<div id="app" data-page="...">`.
2. Trích xuất mã nhiệm vụ (`slug`), phiên bản Inertia (`version`), và token người dùng.
3. Gửi trực tiếp request bằng `GM_xmlhttpRequest` kèm các header đặc quyền:
   - `X-Inertia: true`
   - `X-Inertia-Version: <version>`
   - `X-Requested-With: XMLHttpRequest`
4. Đọc phản hồi từ header `x-inertia-location` hoặc JSON trả về để lấy thẳng URL đích (`done`, `redirect`, `target`, `download`) mà không cần chờ countdown đếm ngược hay tìm kiếm Google thủ công.

## 📁 Danh sách tệp tin trong repository
- `traffichub.deobf.user.js`: Bản Userscript độc lập, đã loại bỏ toàn bộ các tầng dropper từ xa, chạy an toàn trên Tampermonkey / Violentmonkey.
- `traffichub-funcion_deobfuscated.js`: Tầng 1 sau khi giải mã máy ảo Bytecode.
- `traffichub_core_extracted.js`: Toàn bộ các regex, headers, endpoints bóc tách được từ payload cuối cùng.

---
*Mục đích: Nghiên cứu bảo mật, phân tích mã độc và reverse engineering JavaScript.*
