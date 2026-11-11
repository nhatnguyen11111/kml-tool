# Công cụ chuyển đổi KML bản web

Mở [index.html](./index.html) bằng trình duyệt trên macOS hoặc Windows, sau đó kéo thả file `.kml` vào vùng làm việc. Bản web không cần cài Python hay thư viện ngoài và không tải dữ liệu KML lên máy chủ.

Các thao tác trong file `Keo_Tha_KML_Vao_Day.bat` đã được giữ trong giao diện web:

- chuyển tất cả hoặc từng nhóm giữa `Polygon` và `LineString`, đảo kiểu, khóa/mở khóa nhóm;
- gán mã loại đất và màu chuẩn Việt Nam;
- đánh dấu xóa theo mã đất, hình học, màu, tên, số đỉnh hoặc từng dòng;
- tìm kiếm tối đa theo 5.000 dòng hiển thị, chọn nhiều dòng và menu chuột phải;
- cập nhật `ExtendedData`, tọa độ, `altitudeMode`, `Style`, màu KML BGR và xóa `lantypr`/`linetype` khi lưu;
- **Điều chỉnh Tọa độ XYZ** trực tiếp trên file đã mở (không cần import lại file): hỗ trợ dịch chuyển Kinh độ (`DICH_X`), Vĩ độ (`DICH_Y`) theo **Mét (`met`)** (bán kính Trái Đất $R = 6{,}378{,}137\text{ m}$) hoặc **Độ thập phân (`do`)**, dịch chuyển Độ cao (`DICH_Z`) theo mét, xem trước tọa độ trực tiếp và xuất file `chinh_XYZ_<tên_file>.kml`.

Trình duyệt không cho trang web tự ghi vào đường dẫn gốc của file người dùng. Vì vậy nút **Áp dụng & Ghi đè file KML** tải xuống hai file: bản sao gốc có đuôi `.bak` và file kết quả với tên gốc; nút **Lưu thành file KML mới** tải xuống tên mặc định `<tên>_chuyen_doi.kml`. Người dùng chọn thư mục lưu từ trình duyệt hoặc di chuyển các file tải xuống vào thư mục mong muốn.

Khác với bản `.bat` (tự đóng sau khi lưu), bản web giữ nguyên cấu hình sau khi lưu. Mỗi lần lưu đều áp dụng lên nội dung gốc của file vừa mở, nên có thể chỉnh lại cấu hình và lưu nhiều lần mà không bị chuyển đổi chồng lên kết quả trước. Có thể kéo thả file `.kml` khác vào bất kỳ đâu trên trang để mở file mới.

`app.js`, `styles.css` và `index.html` là ứng dụng tĩnh, nên có thể chạy bằng cách mở trực tiếp `index.html` hoặc phục vụ thư mục này bằng máy chủ tĩnh nếu trình duyệt được cấu hình chặn file cục bộ.
