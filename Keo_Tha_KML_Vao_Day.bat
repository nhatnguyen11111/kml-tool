@echo off & chcp 65001 >nul & TITLE Chuyen Doi Duong Vung va Thuoc Tinh KML & python -x "%~f0" %* & pause & exit /b
# -*- coding: utf-8 -*-
"""
Công cụ chuyên dụng: Chuyển đổi thuộc tính và hình học (Đường <-> Vùng) trên file KML
Được tối ưu hóa hiệu năng cao (High Performance) cho file KML nặng (hàng nghìn đến hàng vạn đối tượng).
Tác giả: Antigravity AI - Hỗ trợ người dùng Geomatic / Cadastral GIS
"""

import sys
import os

if sys.platform == 'win32':
    try:
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        if hasattr(sys.stderr, 'reconfigure'):
            sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

import shutil
import time
import xml.etree.ElementTree as ET
import tkinter as tk
from tkinter import ttk, messagebox, colorchooser, filedialog

# ============================================================
# BẢNG MÃ MÀU & LOẠI ĐẤT CHUẨN ĐỊA CHÍNH VIỆT NAM
# ============================================================
STANDARD_MAPPINGS = {
    'ONT': '#ffd0ff',   # Đất ở nông thôn – tím hồng
    'ODT': '#ffa0ff',   # Đất ở đô thị – tím sen
    'LUA': '#fffc82',   # Đất trồng lúa – vàng
    'CHN': '#fffc78',   # Đất chuyên trồng lúa nước
    'HNK': '#fff0b4',   # Đất trồng cây hàng năm khác – vàng be
    'CLN': '#80ff80',   # Đất trồng cây lâu năm – xanh lá
    'DTL': '#aaffff',   # Đất thủy lợi / kênh mương – xanh cyan
    'DLT': '#aaffff',   # Đất thủy lợi
    'DGT': '#ffaa32',   # Đất giao thông – cam đất
    'NTS': '#80ffcc',   # Đất nuôi trồng thủy sản – xanh ngọc
    'RSX': '#60c060',   # Rừng sản xuất – xanh đậm
    'RPH': '#40a040',   # Rừng phòng hộ
    'RDD': '#208020',   # Rừng đặc dụng
    'TSC': '#ff8040',   # Đất trồng cây công nghiệp
    'SKC': '#ffa0a0',   # Đất sản xuất kinh doanh
    'CSD': '#c0c0c0',   # Đất sinh hoạt cộng đồng
    'DVH': '#8080ff',   # Đất cơ sở văn hóa
    'DYT': '#ff6060',   # Đất cơ sở y tế
    'DGD': '#6080ff',   # Đất cơ sở giáo dục
    'CQP': '#800000',   # Đất quốc phòng
    'CAN': '#000080',   # Đất an ninh
    'TON': '#ff40a0',   # Đất tôn giáo tín ngưỡng
    'NTD': '#d0a060',   # Đất nghĩa trang nghĩa địa
    'SMN': '#4040ff',   # Đất sông, ngòi, kênh, rạch, suối
    'MNC': '#60a0ff',   # Mặt nước chuyên dùng
    'PNK': '#ffc060',   # Đất phi nông nghiệp khác
    'NKH': '#c0a080',   # Đất nông nghiệp khác
    'BCS': '#fffffe',   # Bờ canal / bờ thửa – trắng
}

KML_NS = 'http://www.opengis.net/kml/2.2'
GX_NS  = 'http://www.google.com/kml/ext/2.2'
XSI_NS = 'http://www.w3.org/2001/XMLSchema-instance'

ET.register_namespace('', KML_NS)
ET.register_namespace('gx', GX_NS)
ET.register_namespace('xsi', XSI_NS)

def hex_to_kml_bgr(hex_str):
    """Chuyển đổi mã màu hex (#RRGGBB) sang định dạng KML BGR (bbggrr)."""
    if not hex_str:
        return 'ffffff'
    h = hex_str.lstrip('#')
    if len(h) == 3:
        h = ''.join([c*2 for c in h])
    if len(h) != 6:
        return 'ffffff'
    r, g, b = h[0:2], h[2:4], h[4:6]
    return f"{b}{g}{r}"

def kml_color_to_hex(kml_color):
    """Chuyển đổi mã màu KML (aabbggrr hoặc bbggrr) sang hex (#RRGGBB)."""
    if not kml_color:
        return '#ffffff'
    c = kml_color.strip().lower()
    if len(c) == 8:  # aabbggrr
        b, g, r = c[2:4], c[4:6], c[6:8]
        return f"#{r}{g}{b}"
    elif len(c) == 6:  # bbggrr
        b, g, r = c[0:2], c[2:4], c[4:6]
        return f"#{r}{g}{b}"
    return '#ffffff'

def safe_color(c):
    if c and isinstance(c, str) and c.startswith('#') and (len(c) == 4 or len(c) == 7):
        return c
    return "#ffffff"

class KMLConverterApp:
    def __init__(self, root, file_path, tree, placemarks_info, unique_groups):
        self.root = root
        self.file_path = file_path
        self.tree = tree
        self.placemarks_info = placemarks_info
        self.unique_groups = unique_groups
        
        self.root.title("Chuyển Đổi Đường / Vùng & Xóa Thuộc Tính KML - Tốc Độ Cao")
        self.root.geometry("1120x720")
        self.root.minsize(1000, 600)
        
        self.setup_ui()

    def setup_ui(self):
        # Top Header Frame
        header_frame = ttk.Frame(self.root, padding="10 8 10 4")
        header_frame.pack(fill=tk.X)
        
        title_lbl = ttk.Label(
            header_frame, 
            text=f"📂 File: {os.path.basename(self.file_path)}", 
            font=("Segoe UI", 11, "bold")
        )
        title_lbl.pack(side=tk.LEFT)
        
        self.stat_lbl = ttk.Label(header_frame, text="", font=("Segoe UI", 9))
        self.stat_lbl.pack(side=tk.RIGHT)
        
        # Batch Actions & Delete Toolbar
        tools_frame = ttk.LabelFrame(self.root, text=" ⚡ Thao Tác Hàng Loạt & Lọc Xóa Theo Thuộc Tính ", padding="8 6")
        tools_frame.pack(fill=tk.X, padx=10, pady=4)
        
        # Row 1: Thao tác kiểu hình học & Khóa & Gán mã đất chung
        row1 = ttk.Frame(tools_frame)
        row1.pack(fill=tk.X, pady=2)
        
        ttk.Button(row1, text="🔷 Chuyển TẤT CẢ -> VÙNG", command=lambda: self.batch_set_geom('Polygon')).pack(side=tk.LEFT, padx=3)
        ttk.Button(row1, text="📐 Chuyển TẤT CẢ -> ĐƯỜNG", command=lambda: self.batch_set_geom('LineString')).pack(side=tk.LEFT, padx=3)
        ttk.Button(row1, text="🔄 Đảo kiểu (Đường ↔ Vùng)", command=self.batch_toggle_geom).pack(side=tk.LEFT, padx=3)
        
        ttk.Separator(row1, orient=tk.VERTICAL).pack(side=tk.LEFT, fill=tk.Y, padx=8)
        
        ttk.Button(row1, text="🔓 Mở khóa", command=lambda: self.batch_lock(False)).pack(side=tk.LEFT, padx=3)
        ttk.Button(row1, text="🔒 Khóa tất cả", command=lambda: self.batch_lock(True)).pack(side=tk.LEFT, padx=3)
        
        ttk.Separator(row1, orient=tk.VERTICAL).pack(side=tk.LEFT, fill=tk.Y, padx=8)
        
        ttk.Label(row1, text="Gán mã đất chung:").pack(side=tk.LEFT, padx=2)
        self.batch_lt_var = tk.StringVar(value="ONT")
        self.batch_lt_cb = ttk.Combobox(row1, textvariable=self.batch_lt_var, values=list(STANDARD_MAPPINGS.keys()), width=7)
        self.batch_lt_cb.pack(side=tk.LEFT, padx=2)
        ttk.Button(row1, text="Áp dụng", command=self.apply_batch_land_type).pack(side=tk.LEFT, padx=3)
        
        # Row 2: Thao tác Xóa theo thuộc tính & đối tượng
        row2 = ttk.Frame(tools_frame)
        row2.pack(fill=tk.X, pady=(4, 2))
        
        ttk.Label(row2, text="🗑️ Xóa thuộc tính:", font=("Segoe UI", 9, "bold")).pack(side=tk.LEFT, padx=(3, 6))
        
        ttk.Button(row2, text="🔍 Bộ Lọc Xóa Thuộc Tính...", command=self.open_filter_delete_dialog).pack(side=tk.LEFT, padx=3)
        
        ttk.Separator(row2, orient=tk.VERTICAL).pack(side=tk.LEFT, fill=tk.Y, padx=6)
        
        ttk.Label(row2, text="Xóa loại đất:").pack(side=tk.LEFT, padx=2)
        all_lts = sorted(list({p['land_type'].upper() for p in self.placemarks_info if p['land_type']}))
        if not all_lts:
            all_lts = list(STANDARD_MAPPINGS.keys())
        self.quick_del_lt_var = tk.StringVar(value=all_lts[0] if all_lts else "ONT")
        self.quick_del_lt_cb = ttk.Combobox(row2, textvariable=self.quick_del_lt_var, values=all_lts, width=7)
        self.quick_del_lt_cb.pack(side=tk.LEFT, padx=2)
        ttk.Button(row2, text="🗑️ Xóa mã này", command=self.quick_delete_land_type).pack(side=tk.LEFT, padx=3)
        
        ttk.Separator(row2, orient=tk.VERTICAL).pack(side=tk.LEFT, fill=tk.Y, padx=6)
        
        ttk.Button(row2, text="📐 Xóa hết Đường", command=lambda: self.batch_delete_by_geom('LineString')).pack(side=tk.LEFT, padx=3)
        ttk.Button(row2, text="🔷 Xóa hết Vùng", command=lambda: self.batch_delete_by_geom('Polygon')).pack(side=tk.LEFT, padx=3)
        
        ttk.Separator(row2, orient=tk.VERTICAL).pack(side=tk.LEFT, fill=tk.Y, padx=6)
        
        ttk.Button(row2, text="↩️ Hủy đánh dấu xóa", command=self.batch_clear_delete).pack(side=tk.LEFT, padx=3)

        # Tab Notebook (Tab 1: Nhóm quy tắc - Siêu tốc | Tab 2: Danh sách chi tiết)
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=4)

        # TAB 1: NHÓM QUY TẮC
        self.tab_groups = ttk.Frame(self.notebook, padding="4")
        self.notebook.add(self.tab_groups, text="⚡ Cấu hình theo Nhóm (Khuyên dùng - Siêu tốc)")
        self.setup_tab_groups()

        # TAB 2: DANH SÁCH CHI TIẾT (Virtual Treeview)
        self.tab_details = ttk.Frame(self.notebook, padding="4")
        self.notebook.add(self.tab_details, text="📋 Danh Sách Chi Tiết Đối Tượng")
        self.setup_tab_details()

        # Bottom Frame
        bottom_frame = ttk.Frame(self.root, padding="10 8")
        bottom_frame.pack(fill=tk.X, side=tk.BOTTOM)
        
        self.prog_bar = ttk.Progressbar(bottom_frame, mode='indeterminate', length=160)
        
        btn_save = ttk.Button(bottom_frame, text="💾 Áp dụng & Ghi đè file KML", command=lambda: self.save_kml(overwrite=True))
        btn_save.pack(side=tk.RIGHT, padx=6)
        
        btn_save_as = ttk.Button(bottom_frame, text="📁 Lưu thành file KML mới...", command=lambda: self.save_kml(overwrite=False))
        btn_save_as.pack(side=tk.RIGHT, padx=6)
        
        btn_close = ttk.Button(bottom_frame, text="❌ Thoát", command=self.root.destroy)
        btn_close.pack(side=tk.RIGHT, padx=6)
        
        self.status_lbl = ttk.Label(bottom_frame, text="Sẵn sàng thực hiện chuyển đổi hoặc xóa đối tượng.", font=("Segoe UI", 9, "italic"))
        self.status_lbl.pack(side=tk.LEFT, padx=6)

        self.update_stats_display()

    def update_stats_display(self):
        del_count = self.get_total_deleted_count()
        total_pm = len(self.placemarks_info)
        remain = total_pm - del_count
        poly_cnt = sum(1 for p in self.placemarks_info if p['orig_type'] == 'Polygon')
        line_cnt = sum(1 for p in self.placemarks_info if p['orig_type'] == 'LineString')
        other_cnt = total_pm - poly_cnt - line_cnt
        
        stat_text = f"📊 Tổng: {total_pm:,} đối tượng  |  🔷 Vùng: {poly_cnt:,}  |  📐 Đường: {line_cnt:,}  |  📦 Nhóm: {len(self.unique_groups)}"
        if other_cnt > 0:
            stat_text += f"  |  Khác: {other_cnt:,}"
        if del_count > 0:
            stat_text += f"  |  🗑️ Sẽ XÓA: {del_count:,}  |  ✅ Còn lại: {remain:,}"
            self.status_lbl.config(text=f"⚠️ Đang chọn XÓA {del_count:,} đối tượng (Số đối tượng còn lại: {remain:,}).")
        else:
            self.status_lbl.config(text="Sẵn sàng thực hiện chuyển đổi hoặc xóa đối tượng.")
        self.stat_lbl.config(text=stat_text)

    def get_rule_map(self):
        rule_map = {}
        for row in self.group_rows:
            g = row['group']
            key = (g['orig_type'], g['color'].lower(), g['land_type'].upper())
            rule_map[key] = {
                'locked': row['var_lock'].get(),
                'deleted': row['var_delete'].get(),
                'target_geom': row['var_target_geom'].get(),
                'target_lt': row['var_target_lt'].get().strip().upper(),
                'target_c': row['var_target_c'].get().strip()
            }
        return rule_map

    def get_total_deleted_count(self):
        rule_map = self.get_rule_map()
        count = 0
        for pm in self.placemarks_info:
            if pm.get('marked_delete', False):
                count += 1
            else:
                k = (pm['orig_type'], pm['color'].lower(), pm['land_type'].upper())
                rule = rule_map.get(k)
                if rule and rule.get('deleted', False):
                    count += 1
        return count

    def is_pm_deleted(self, pm, rule_map=None):
        if pm.get('marked_delete', False):
            return True
        if rule_map is None:
            rule_map = self.get_rule_map()
        k = (pm['orig_type'], pm['color'].lower(), pm['land_type'].upper())
        rule = rule_map.get(k)
        if rule and rule.get('deleted', False):
            return True
        return False

    def setup_tab_groups(self):
        # Table Header Frame
        tbl_header_frame = ttk.Frame(self.tab_groups, padding="6 4 24 4")
        tbl_header_frame.pack(fill=tk.X)
        
        cols = [
            ("STT & Kiểu gốc", 15, "w"),
            ("Số lượng", 11, "center"),
            ("Màu gốc", 8, "center"),
            ("Loại đất gốc", 12, "center"),
            ("Khóa", 5, "center"),
            ("🗑️ Xóa", 6, "center"),
            ("Kiểu mới (Chuyển đổi)", 18, "w"),
            ("Mã loại đất mới", 14, "w"),
            ("Màu mới & Chọn", 18, "w"),
        ]
        
        for idx, (title, w, anch) in enumerate(cols):
            lbl = ttk.Label(tbl_header_frame, text=title, font=("Segoe UI", 9, "bold"), anchor=anch)
            lbl.grid(row=0, column=idx, padx=4, sticky="ew")
            tbl_header_frame.columnconfigure(idx, weight=1 if idx in (0, 6, 7, 8) else 0)

        # Scrollable Canvas for Group Rows
        canvas_frame = ttk.Frame(self.tab_groups)
        canvas_frame.pack(fill=tk.BOTH, expand=True, pady=2)
        
        self.canvas = tk.Canvas(canvas_frame, highlightthickness=0)
        self.scrollbar = ttk.Scrollbar(canvas_frame, orient="vertical", command=self.canvas.yview)
        self.scrollable_frame = ttk.Frame(self.canvas)
        
        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all"))
        )
        
        self.canvas_window = self.canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        self.canvas.configure(yscrollcommand=self.scrollbar.set)
        
        self.canvas.bind(
            "<Configure>", 
            lambda e: self.canvas.itemconfig(self.canvas_window, width=e.width)
        )
        
        self.canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Build Rows for Groups
        self.group_rows = []
        for idx, g in enumerate(self.unique_groups):
            orig_t = g['orig_type']
            orig_c = g['color']
            orig_lt = g['land_type']
            count = g['count']
            
            row_frame = ttk.Frame(self.scrollable_frame, padding="3 4")
            row_frame.pack(fill=tk.X, pady=2)
            
            # STT & Kiểu gốc
            orig_text = "🔷 Vùng" if orig_t == 'Polygon' else ("📐 Đường" if orig_t == 'LineString' else orig_t)
            lbl_orig = ttk.Label(row_frame, text=f"{idx+1}. {orig_text}", font=("Segoe UI", 9, "bold"), width=15, anchor="w")
            lbl_orig.grid(row=0, column=0, padx=4, sticky="w")
            
            # Số lượng
            lbl_cnt = ttk.Label(row_frame, text=f"{count:,} đối tượng", width=11, anchor="center")
            lbl_cnt.grid(row=0, column=1, padx=4)
            
            # Màu gốc
            lbl_orig_c = tk.Label(row_frame, text="", bg=safe_color(orig_c), width=6, relief="solid", borderwidth=1)
            lbl_orig_c.grid(row=0, column=2, padx=4)
            
            # Loại đất gốc
            lbl_orig_lt = ttk.Label(row_frame, text=orig_lt.upper() if orig_lt else "(trống)", width=12, anchor="center")
            lbl_orig_lt.grid(row=0, column=3, padx=4)
            
            # Checkbox Khóa (Mặc định không khóa)
            var_lock = tk.BooleanVar(value=False)
            chk_lock = ttk.Checkbutton(row_frame, variable=var_lock)
            chk_lock.grid(row=0, column=4, padx=4)
            
            # Checkbox Xóa (Mặc định không xóa)
            var_delete = tk.BooleanVar(value=False)
            chk_delete = ttk.Checkbutton(row_frame, variable=var_delete)
            chk_delete.grid(row=0, column=5, padx=4)
            
            # Kiểu mới
            var_target_geom = tk.StringVar(value=orig_t)
            cb_geom = ttk.Combobox(
                row_frame, 
                textvariable=var_target_geom, 
                values=["Polygon", "LineString", "❌ XÓA ĐỐI TƯỢNG"], 
                width=17, 
                state="readonly"
            )
            cb_geom.grid(row=0, column=6, padx=4, sticky="w")
            
            # Mã loại đất mới
            var_target_lt = tk.StringVar(value=orig_lt.upper() if orig_lt else "ONT")
            cb_lt = ttk.Combobox(row_frame, textvariable=var_target_lt, values=list(STANDARD_MAPPINGS.keys()), width=13)
            cb_lt.grid(row=0, column=7, padx=4, sticky="w")
            
            # Màu mới
            color_frame = ttk.Frame(row_frame)
            color_frame.grid(row=0, column=8, padx=4, sticky="w")
            
            var_target_c = tk.StringVar(value=orig_c)
            lbl_preview = tk.Label(color_frame, text="", bg=safe_color(orig_c), width=3, relief="solid", borderwidth=1)
            lbl_preview.pack(side=tk.LEFT, padx=2)
            
            ent_c = ttk.Entry(color_frame, textvariable=var_target_c, width=9)
            ent_c.pack(side=tk.LEFT, padx=2)
            
            btn_pick_c = ttk.Button(color_frame, text="🎨 Chọn", width=6)
            btn_pick_c.pack(side=tk.LEFT, padx=2)
            
            row_frame.columnconfigure(0, weight=1)
            row_frame.columnconfigure(6, weight=1)
            row_frame.columnconfigure(7, weight=1)
            row_frame.columnconfigure(8, weight=1)
            
            # Event handlers
            def make_on_lt_change(v_lt, v_c, l_prev):
                def handler(event=None):
                    code = v_lt.get().strip().upper()
                    if code in STANDARD_MAPPINGS:
                        new_col = STANDARD_MAPPINGS[code]
                        v_c.set(new_col)
                        l_prev.config(bg=safe_color(new_col))
                return handler

            on_lt_changed = make_on_lt_change(var_target_lt, var_target_c, lbl_preview)
            cb_lt.bind('<<ComboboxSelected>>', on_lt_changed)
            cb_lt.bind('<KeyRelease>', on_lt_changed)
            
            def make_on_color_entry(v_c, l_prev):
                def handler(event=None):
                    l_prev.config(bg=safe_color(v_c.get()))
                return handler
                
            on_c_entry = make_on_color_entry(var_target_c, lbl_preview)
            ent_c.bind('<KeyRelease>', on_c_entry)

            def make_pick_color(v_c, l_prev):
                def handler():
                    cur = v_c.get()
                    chosen = colorchooser.askcolor(initialcolor=safe_color(cur), title="Chọn màu sắc cho nhóm")[1]
                    if chosen:
                        v_c.set(chosen)
                        l_prev.config(bg=safe_color(chosen))
                return handler

            btn_pick_c.config(command=make_pick_color(var_target_c, lbl_preview))

            def make_on_delete_change(v_del, v_geom, c_geom, c_lt, e_c, b_c, l_orig, orig_geom_type, v_lock):
                def handler():
                    is_del = v_del.get()
                    if is_del:
                        v_geom.set("❌ XÓA ĐỐI TƯỢNG")
                        c_geom.config(state="disabled")
                        c_lt.config(state="disabled")
                        e_c.config(state="disabled")
                        b_c.config(state="disabled")
                        l_orig.config(foreground="#c62828")
                    else:
                        if v_geom.get() == "❌ XÓA ĐỐI TƯỢNG":
                            v_geom.set(orig_geom_type)
                        st = "disabled" if v_lock.get() else "normal"
                        c_geom.config(state="disabled" if v_lock.get() else "readonly")
                        c_lt.config(state=st)
                        e_c.config(state=st)
                        b_c.config(state=st)
                        l_orig.config(foreground="")
                    self.update_stats_display()
                return handler

            on_del_changed = make_on_delete_change(
                var_delete, var_target_geom, cb_geom, cb_lt, ent_c, btn_pick_c, lbl_orig, orig_t, var_lock
            )
            chk_delete.config(command=on_del_changed)

            def make_on_geom_change(v_del, v_geom, on_del_fn):
                def handler(event=None):
                    if v_geom.get() == "❌ XÓA ĐỐI TƯỢNG":
                        if not v_del.get():
                            v_del.set(True)
                            on_del_fn()
                    else:
                        if v_del.get():
                            v_del.set(False)
                            on_del_fn()
                return handler

            cb_geom.bind("<<ComboboxSelected>>", make_on_geom_change(var_delete, var_target_geom, on_del_changed))

            def make_toggle_lock(v_lock, v_del, c_geom, c_lt, e_c, b_c):
                def handler():
                    if v_del.get():
                        return
                    st = "disabled" if v_lock.get() else "normal"
                    c_geom.config(state="disabled" if v_lock.get() else "readonly")
                    c_lt.config(state=st)
                    e_c.config(state=st)
                    b_c.config(state=st)
                return handler

            chk_lock.config(command=make_toggle_lock(var_lock, var_delete, cb_geom, cb_lt, ent_c, btn_pick_c))
            
            self.group_rows.append({
                'group': g,
                'var_lock': var_lock,
                'var_delete': var_delete,
                'var_target_geom': var_target_geom,
                'var_target_lt': var_target_lt,
                'var_target_c': var_target_c,
                'lbl_orig': lbl_orig,
                'lbl_preview': lbl_preview,
                'chk_lock': chk_lock,
                'chk_delete': chk_delete,
                'cb_geom': cb_geom,
                'cb_lt': cb_lt,
                'ent_c': ent_c,
                'btn_pick_c': btn_pick_c
            })

    def setup_tab_details(self):
        # Search & Action Frame
        s_frame = ttk.Frame(self.tab_details, padding="4")
        s_frame.pack(fill=tk.X)
        
        ttk.Label(s_frame, text="🔍 Tìm:").pack(side=tk.LEFT, padx=3)
        self.detail_search_var = tk.StringVar()
        s_ent = ttk.Entry(s_frame, textvariable=self.detail_search_var, width=18)
        s_ent.pack(side=tk.LEFT, padx=3)
        s_ent.bind("<Return>", lambda e: self.populate_treeview())
        
        ttk.Button(s_frame, text="Tìm", command=self.populate_treeview).pack(side=tk.LEFT, padx=2)
        ttk.Button(s_frame, text="Hiện tất cả", command=lambda: (self.detail_search_var.set(""), self.populate_treeview())).pack(side=tk.LEFT, padx=2)
        
        ttk.Separator(s_frame, orient=tk.VERTICAL).pack(side=tk.LEFT, fill=tk.Y, padx=6)
        
        ttk.Button(s_frame, text="🗑️ Đánh dấu XÓA dòng chọn", command=self.treeview_mark_delete_selected).pack(side=tk.LEFT, padx=2)
        ttk.Button(s_frame, text="↩️ Bỏ XÓA dòng chọn", command=self.treeview_unmark_delete_selected).pack(side=tk.LEFT, padx=2)
        ttk.Button(s_frame, text="🗑️ XÓA theo kết quả tìm", command=self.treeview_delete_search_results).pack(side=tk.LEFT, padx=2)
        
        ttk.Label(s_frame, text="(Nhấp phải chuột để xem thao tác nhanh)", font=("Segoe UI", 9, "italic")).pack(side=tk.RIGHT, padx=6)
        
        # Treeview
        tree_frame = ttk.Frame(self.tab_details)
        tree_frame.pack(fill=tk.BOTH, expand=True, pady=4)
        
        cols = ('idx', 'name', 'type', 'color', 'landtype', 'points', 'status')
        self.treeview = ttk.Treeview(tree_frame, columns=cols, show='headings', selectmode='extended')
        
        self.treeview.heading('idx', text='STT')
        self.treeview.heading('name', text='Tên Placemark')
        self.treeview.heading('type', text='Kiểu hình học')
        self.treeview.heading('color', text='Mã màu')
        self.treeview.heading('landtype', text='Loại đất')
        self.treeview.heading('points', text='Số đỉnh')
        self.treeview.heading('status', text='Trạng thái')
        
        self.treeview.column('idx', width=50, anchor='center')
        self.treeview.column('name', width=220, anchor='w')
        self.treeview.column('type', width=110, anchor='center')
        self.treeview.column('color', width=90, anchor='center')
        self.treeview.column('landtype', width=100, anchor='center')
        self.treeview.column('points', width=80, anchor='center')
        self.treeview.column('status', width=110, anchor='center')
        
        self.treeview.tag_configure('deleted', foreground='#c62828', background='#ffebee')
        self.treeview.tag_configure('normal', foreground='#000000', background='#ffffff')
        
        self.treeview.bind("<Button-3>", self.show_treeview_context_menu)
        
        tv_scroll = ttk.Scrollbar(tree_frame, orient=tk.VERTICAL, command=self.treeview.yview)
        self.treeview.configure(yscrollcommand=tv_scroll.set)
        
        self.treeview.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        tv_scroll.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.populate_treeview()

    def populate_treeview(self):
        self.treeview.delete(*self.treeview.get_children())
        query = self.detail_search_var.get().strip().lower()
        rule_map = self.get_rule_map()
        
        limit = 5000
        count = 0
        for idx, pm in enumerate(self.placemarks_info):
            name = pm['name']
            orig_t = pm['orig_type']
            col = pm['color']
            lt = pm['land_type']
            pts = pm.get('coords_count', 0)
            
            is_del = pm.get('marked_delete', False)
            rule = rule_map.get((orig_t, col.lower(), lt.upper()))
            if rule and rule.get('deleted', False):
                is_del = True
                
            status_text = "❌ SẼ XÓA" if is_del else "✅ Giữ lại"
            tag = "deleted" if is_del else "normal"
            
            if query:
                if (query not in name.lower() and 
                    query not in orig_t.lower() and 
                    query not in lt.lower() and 
                    query not in col.lower() and
                    query not in status_text.lower()):
                    continue
                    
            self.treeview.insert('', 'end', iid=str(idx), values=(
                idx + 1,
                name,
                "🔷 Vùng" if orig_t == 'Polygon' else ("📐 Đường" if orig_t == 'LineString' else orig_t),
                col,
                lt.upper(),
                f"{pts} điểm",
                status_text
            ), tags=(tag,))
            count += 1
            if count >= limit:
                break

    def treeview_mark_delete_selected(self):
        selection = self.treeview.selection()
        if not selection:
            messagebox.showwarning("Thông báo", "Vui lòng chọn ít nhất một đối tượng trong bảng!")
            return
        for iid in selection:
            idx = int(iid)
            self.placemarks_info[idx]['marked_delete'] = True
        self.populate_treeview()
        self.update_stats_display()
        self.status_lbl.config(text=f"Đã đánh dấu XÓA {len(selection):,} đối tượng được chọn.")

    def treeview_unmark_delete_selected(self):
        selection = self.treeview.selection()
        if not selection:
            messagebox.showwarning("Thông báo", "Vui lòng chọn ít nhất một đối tượng trong bảng!")
            return
        for iid in selection:
            idx = int(iid)
            self.placemarks_info[idx]['marked_delete'] = False
        self.populate_treeview()
        self.update_stats_display()
        self.status_lbl.config(text=f"Đã hủy đánh dấu XÓA cho {len(selection):,} đối tượng được chọn.")

    def treeview_delete_search_results(self):
        query = self.detail_search_var.get().strip().lower()
        if not query:
            messagebox.showwarning("Thông báo", "Vui lòng nhập từ khóa tìm kiếm trước khi chọn xóa theo kết quả!")
            return
            
        matched_indices = []
        for idx, pm in enumerate(self.placemarks_info):
            if (query in pm['name'].lower() or 
                query in pm['orig_type'].lower() or 
                query in pm['land_type'].lower() or 
                query in pm['color'].lower()):
                matched_indices.append(idx)
                
        if not matched_indices:
            messagebox.showinfo("Thông báo", f"Không tìm thấy đối tượng nào khớp với từ khóa '{query}'.")
            return
            
        confirm = messagebox.askyesno(
            "Xác nhận đánh dấu XÓA", 
            f"Tìm thấy {len(matched_indices):,} đối tượng khớp với từ khóa '{query}'.\n\nBạn có muốn đánh dấu XÓA tất cả các đối tượng này không?"
        )
        if confirm:
            for idx in matched_indices:
                self.placemarks_info[idx]['marked_delete'] = True
            self.populate_treeview()
            self.update_stats_display()
            self.status_lbl.config(text=f"Đã đánh dấu XÓA {len(matched_indices):,} đối tượng theo từ khóa '{query}'.")

    def show_treeview_context_menu(self, event):
        item_id = self.treeview.identify_row(event.y)
        if item_id:
            if item_id not in self.treeview.selection():
                self.treeview.selection_set(item_id)
            idx = int(item_id)
            pm = self.placemarks_info[idx]
            
            menu = tk.Menu(self.root, tearoff=0)
            menu.add_command(
                label=f"🗑️ Đánh dấu XÓA các dòng đang chọn ({len(self.treeview.selection())})", 
                command=self.treeview_mark_delete_selected
            )
            menu.add_command(
                label="↩️ Bỏ đánh dấu XÓA các dòng đang chọn", 
                command=self.treeview_unmark_delete_selected
            )
            menu.add_separator()
            menu.add_command(
                label=f"🗑️ XÓA tất cả đối tượng loại đất '{pm['land_type']}'", 
                command=lambda: self.batch_delete_by_land_type(pm['land_type'])
            )
            menu.add_command(
                label=f"🗑️ XÓA tất cả đối tượng kiểu '{pm['orig_type']}'", 
                command=lambda: self.batch_delete_by_geom(pm['orig_type'])
            )
            menu.add_command(
                label=f"🗑️ XÓA tất cả đối tượng màu '{pm['color']}'", 
                command=lambda: self.batch_delete_by_color(pm['color'])
            )
            menu.tk_popup(event.x_root, event.y_root)

    def batch_set_geom(self, target_type):
        changed = 0
        for row in self.group_rows:
            if not row['var_lock'].get() and not row['var_delete'].get():
                row['var_target_geom'].set(target_type)
                changed += 1
        self.status_lbl.config(text=f"Đã đặt {changed} nhóm đối tượng sang kiểu {target_type}.")

    def batch_toggle_geom(self):
        changed = 0
        for row in self.group_rows:
            if not row['var_lock'].get() and not row['var_delete'].get():
                cur = row['var_target_geom'].get()
                new_type = 'Polygon' if cur == 'LineString' else 'LineString'
                row['var_target_geom'].set(new_type)
                changed += 1
        self.status_lbl.config(text=f"Đã đảo kiểu cho {changed} nhóm đối tượng.")

    def batch_lock(self, locked):
        for row in self.group_rows:
            row['var_lock'].set(locked)
            if not row['var_delete'].get():
                st = "disabled" if locked else "normal"
                row['cb_geom'].config(state="disabled" if locked else "readonly")
                row['cb_lt'].config(state=st)
                row['ent_c'].config(state=st)
                row['btn_pick_c'].config(state=st)
        self.status_lbl.config(text="Đã khóa tất cả các nhóm." if locked else "Đã mở khóa tất cả các nhóm.")

    def apply_batch_land_type(self):
        lt = self.batch_lt_var.get().strip().upper()
        if not lt:
            return
        new_color = STANDARD_MAPPINGS.get(lt, None)
        applied = 0
        for row in self.group_rows:
            if not row['var_lock'].get() and not row['var_delete'].get():
                row['var_target_lt'].set(lt)
                if new_color:
                    row['var_target_c'].set(new_color)
                    row['lbl_preview'].config(bg=safe_color(new_color))
                applied += 1
        self.status_lbl.config(text=f"Đã gán mã loại đất {lt} cho {applied} nhóm mở khóa.")

    def quick_delete_land_type(self):
        lt = self.quick_del_lt_var.get().strip().upper()
        if not lt:
            return
        self.batch_delete_by_land_type(lt)

    def batch_delete_by_land_type(self, lt_code):
        lt_clean = lt_code.strip().upper()
        count = 0
        for pm in self.placemarks_info:
            if pm['land_type'].upper() == lt_clean:
                pm['marked_delete'] = True
                count += 1
                
        for row in self.group_rows:
            if row['group']['land_type'].upper() == lt_clean:
                row['var_delete'].set(True)
                row['var_target_geom'].set("❌ XÓA ĐỐI TƯỢNG")
                row['cb_geom'].config(state="disabled")
                row['cb_lt'].config(state="disabled")
                row['ent_c'].config(state="disabled")
                row['btn_pick_c'].config(state="disabled")
                row['lbl_orig'].config(foreground="#c62828")
                
        self.populate_treeview()
        self.update_stats_display()
        self.status_lbl.config(text=f"Đã đánh dấu XÓA {count:,} đối tượng có mã loại đất {lt_clean}.")

    def batch_delete_by_geom(self, target_geom):
        count = 0
        for pm in self.placemarks_info:
            if pm['orig_type'] == target_geom:
                pm['marked_delete'] = True
                count += 1
                
        for row in self.group_rows:
            if row['group']['orig_type'] == target_geom:
                row['var_delete'].set(True)
                row['var_target_geom'].set("❌ XÓA ĐỐI TƯỢNG")
                row['cb_geom'].config(state="disabled")
                row['cb_lt'].config(state="disabled")
                row['ent_c'].config(state="disabled")
                row['btn_pick_c'].config(state="disabled")
                row['lbl_orig'].config(foreground="#c62828")
                
        self.populate_treeview()
        self.update_stats_display()
        self.status_lbl.config(text=f"Đã đánh dấu XÓA {count:,} đối tượng kiểu hình học {target_geom}.")

    def batch_delete_by_color(self, hex_color):
        c_clean = hex_color.strip().lower()
        count = 0
        for pm in self.placemarks_info:
            if pm['color'].lower() == c_clean:
                pm['marked_delete'] = True
                count += 1
                
        for row in self.group_rows:
            if row['group']['color'].lower() == c_clean:
                row['var_delete'].set(True)
                row['var_target_geom'].set("❌ XÓA ĐỐI TƯỢNG")
                row['cb_geom'].config(state="disabled")
                row['cb_lt'].config(state="disabled")
                row['ent_c'].config(state="disabled")
                row['btn_pick_c'].config(state="disabled")
                row['lbl_orig'].config(foreground="#c62828")
                
        self.populate_treeview()
        self.update_stats_display()
        self.status_lbl.config(text=f"Đã đánh dấu XÓA {count:,} đối tượng có mã màu {c_clean}.")

    def batch_clear_delete(self):
        for pm in self.placemarks_info:
            pm['marked_delete'] = False
            
        for row in self.group_rows:
            row['var_delete'].set(False)
            if row['var_target_geom'].get() == "❌ XÓA ĐỐI TƯỢNG":
                row['var_target_geom'].set(row['group']['orig_type'])
            st = "disabled" if row['var_lock'].get() else "normal"
            row['cb_geom'].config(state="disabled" if row['var_lock'].get() else "readonly")
            row['cb_lt'].config(state=st)
            row['ent_c'].config(state=st)
            row['btn_pick_c'].config(state=st)
            row['lbl_orig'].config(foreground="")
            
        self.populate_treeview()
        self.update_stats_display()
        self.status_lbl.config(text="Đã hủy bỏ toàn bộ đánh dấu xóa.")

    def open_filter_delete_dialog(self):
        dlg = tk.Toplevel(self.root)
        dlg.title("🗑️ Bộ Lọc Xóa Đối Tượng Theo Thuộc Tính KML")
        dlg.geometry("580x500")
        dlg.minsize(520, 440)
        dlg.transient(self.root)
        dlg.grab_set()

        try:
            x = self.root.winfo_x() + (self.root.winfo_width() // 2) - 290
            y = self.root.winfo_y() + (self.root.winfo_height() // 2) - 250
            dlg.geometry(f"+{max(0, x)}+{max(0, y)}")
        except Exception:
            pass

        # Frame tiêu đề
        header = ttk.Frame(dlg, padding="10 8")
        header.pack(fill=tk.X)
        ttk.Label(
            header, 
            text="Bộ Lọc Nâng Cao: Xóa Đối Tượng Theo Thuộc Tính", 
            font=("Segoe UI", 11, "bold")
        ).pack(anchor="w")
        ttk.Label(
            header, 
            text="Chọn một hoặc kết hợp nhiều thuộc tính để tìm và đánh dấu xóa hàng loạt:", 
            font=("Segoe UI", 9)
        ).pack(anchor="w", pady=(2, 0))

        # Form lọc
        form_frame = ttk.LabelFrame(dlg, text=" Điều kiện lọc thuộc tính ", padding="12 10")
        form_frame.pack(fill=tk.BOTH, expand=True, padx=12, pady=6)

        # 1. Kiểu hình học
        ttk.Label(form_frame, text="1. Kiểu hình học:").grid(row=0, column=0, sticky="w", pady=4)
        geom_var = tk.StringVar(value="(Tất cả kiểu)")
        geom_cb = ttk.Combobox(
            form_frame, 
            textvariable=geom_var, 
            values=["(Tất cả kiểu)", "Polygon (Vùng)", "LineString (Đường)", "Point (Điểm)"],
            state="readonly",
            width=22
        )
        geom_cb.grid(row=0, column=1, sticky="w", padx=8, pady=4)

        # 2. Loại đất
        ttk.Label(form_frame, text="2. Mã loại đất (landType):").grid(row=1, column=0, sticky="w", pady=4)
        all_lts = sorted(list({p['land_type'].upper() for p in self.placemarks_info if p['land_type']}))
        lt_var = tk.StringVar(value="(Tất cả loại đất)")
        lt_cb = ttk.Combobox(
            form_frame, 
            textvariable=lt_var, 
            values=["(Tất cả loại đất)"] + all_lts,
            width=22
        )
        lt_cb.grid(row=1, column=1, sticky="w", padx=8, pady=4)

        # 3. Màu sắc
        ttk.Label(form_frame, text="3. Mã màu sắc (Color):").grid(row=2, column=0, sticky="w", pady=4)
        all_colors = sorted(list({p['color'].lower() for p in self.placemarks_info if p['color']}))
        color_var = tk.StringVar(value="(Tất cả màu)")
        color_cb = ttk.Combobox(
            form_frame, 
            textvariable=color_var, 
            values=["(Tất cả màu)"] + all_colors,
            width=22
        )
        color_cb.grid(row=2, column=1, sticky="w", padx=8, pady=4)

        # 4. Tên Placemark chứa
        ttk.Label(form_frame, text="4. Tên đối tượng chứa:").grid(row=3, column=0, sticky="w", pady=4)
        name_var = tk.StringVar(value="")
        name_ent = ttk.Entry(form_frame, textvariable=name_var, width=24)
        name_ent.grid(row=3, column=1, sticky="w", padx=8, pady=4)

        # 5. Số đỉnh tọa độ
        ttk.Label(form_frame, text="5. Số lượng đỉnh tọa độ:").grid(row=4, column=0, sticky="w", pady=4)
        pts_op_var = tk.StringVar(value="(Không lọc số đỉnh)")
        pts_val_var = tk.StringVar(value="2")
        
        pts_subframe = ttk.Frame(form_frame)
        pts_subframe.grid(row=4, column=1, sticky="w", padx=8, pady=4)
        pts_op_cb = ttk.Combobox(
            pts_subframe, 
            textvariable=pts_op_var, 
            values=["(Không lọc số đỉnh)", "<= (Nhỏ hơn hoặc bằng)", ">= (Lớn hơn hoặc bằng)", "= (Bằng)"],
            state="readonly",
            width=18
        )
        pts_op_cb.pack(side=tk.LEFT)
        pts_val_ent = ttk.Entry(pts_subframe, textvariable=pts_val_var, width=4)
        pts_val_ent.pack(side=tk.LEFT, padx=(4, 0))

        # Preview matching count
        preview_frame = ttk.Frame(dlg, padding="10 4")
        preview_frame.pack(fill=tk.X, padx=12)

        lbl_matched = ttk.Label(
            preview_frame, 
            text="Đang tính toán số lượng đối tượng phù hợp...", 
            font=("Segoe UI", 10, "bold"), 
            foreground="#0d47a1"
        )
        lbl_matched.pack(anchor="w")

        def get_matching_placemarks():
            g_sel = geom_var.get()
            lt_sel = lt_var.get().strip().upper()
            c_sel = color_var.get().strip().lower()
            name_sel = name_var.get().strip().lower()
            pts_op = pts_op_var.get()
            
            pts_limit = None
            if pts_op != "(Không lọc số đỉnh)":
                try:
                    pts_limit = int(pts_val_var.get().strip())
                except Exception:
                    pts_limit = None

            matched_list = []
            for idx, pm in enumerate(self.placemarks_info):
                if g_sel.startswith("Polygon") and pm['orig_type'] != 'Polygon':
                    continue
                if g_sel.startswith("LineString") and pm['orig_type'] != 'LineString':
                    continue
                if g_sel.startswith("Point") and pm['orig_type'] != 'Point':
                    continue

                if lt_sel != "(TẤT CẢ LOẠI ĐẤT)" and pm['land_type'].upper() != lt_sel:
                    continue

                if c_sel != "(tất cả màu)" and pm['color'].lower() != c_sel:
                    continue

                if name_sel and (name_sel not in pm['name'].lower()):
                    continue

                if pts_limit is not None:
                    p_cnt = pm.get('coords_count', 0)
                    if pts_op.startswith("<=") and not (p_cnt <= pts_limit):
                        continue
                    elif pts_op.startswith(">=") and not (p_cnt >= pts_limit):
                        continue
                    elif pts_op.startswith("=") and not (p_cnt == pts_limit):
                        continue

                matched_list.append(idx)
            return matched_list

        def update_matched_lbl(*args):
            matches = get_matching_placemarks()
            lbl_matched.config(
                text=f"👉 Khớp: {len(matches):,} đối tượng (trên tổng số {len(self.placemarks_info):,} đối tượng)."
            )

        geom_cb.bind("<<ComboboxSelected>>", update_matched_lbl)
        lt_cb.bind("<<ComboboxSelected>>", update_matched_lbl)
        lt_cb.bind("<KeyRelease>", update_matched_lbl)
        color_cb.bind("<<ComboboxSelected>>", update_matched_lbl)
        color_cb.bind("<KeyRelease>", update_matched_lbl)
        name_ent.bind("<KeyRelease>", update_matched_lbl)
        pts_op_cb.bind("<<ComboboxSelected>>", update_matched_lbl)
        pts_val_ent.bind("<KeyRelease>", update_matched_lbl)

        update_matched_lbl()

        # Dialog Buttons
        btn_box = ttk.Frame(dlg, padding="10 10")
        btn_box.pack(fill=tk.X, side=tk.BOTTOM)

        def apply_mark_delete():
            matches = get_matching_placemarks()
            if not matches:
                messagebox.showinfo("Thông báo", "Không có đối tượng nào phù hợp với điều kiện lọc!", parent=dlg)
                return
            for idx in matches:
                self.placemarks_info[idx]['marked_delete'] = True

            del_keys = set()
            for idx in matches:
                pm = self.placemarks_info[idx]
                del_keys.add((pm['orig_type'], pm['color'].lower(), pm['land_type'].upper()))

            for row in self.group_rows:
                g = row['group']
                k = (g['orig_type'], g['color'].lower(), g['land_type'].upper())
                if k in del_keys:
                    all_group_deleted = all(
                        p.get('marked_delete', False) 
                        for p in self.placemarks_info 
                        if (p['orig_type'], p['color'].lower(), p['land_type'].upper()) == k
                    )
                    if all_group_deleted:
                        row['var_delete'].set(True)
                        row['var_target_geom'].set("❌ XÓA ĐỐI TƯỢNG")
                        row['cb_geom'].config(state="disabled")
                        row['cb_lt'].config(state="disabled")
                        row['ent_c'].config(state="disabled")
                        row['btn_pick_c'].config(state="disabled")
                        row['lbl_orig'].config(foreground="#c62828")

            self.populate_treeview()
            self.update_stats_display()
            messagebox.showinfo(
                "Đã đánh dấu XÓA", 
                f"Đã đánh dấu XÓA thành công {len(matches):,} đối tượng!\n\n(Các đối tượng sẽ được xóa khi bạn bấm Ghi đè hoặc Lưu file mới)", 
                parent=dlg
            )
            dlg.destroy()

        def apply_unmark_delete():
            matches = get_matching_placemarks()
            if not matches:
                messagebox.showinfo("Thông báo", "Không có đối tượng nào phù hợp với điều kiện lọc!", parent=dlg)
                return
            for idx in matches:
                self.placemarks_info[idx]['marked_delete'] = False

            del_keys = set()
            for idx in matches:
                pm = self.placemarks_info[idx]
                del_keys.add((pm['orig_type'], pm['color'].lower(), pm['land_type'].upper()))

            for row in self.group_rows:
                g = row['group']
                k = (g['orig_type'], g['color'].lower(), g['land_type'].upper())
                if k in del_keys:
                    row['var_delete'].set(False)
                    if row['var_target_geom'].get() == "❌ XÓA ĐỐI TƯỢNG":
                        row['var_target_geom'].set(g['orig_type'])
                    st = "disabled" if row['var_lock'].get() else "normal"
                    row['cb_geom'].config(state="disabled" if row['var_lock'].get() else "readonly")
                    row['cb_lt'].config(state=st)
                    row['ent_c'].config(state=st)
                    row['btn_pick_c'].config(state=st)
                    row['lbl_orig'].config(foreground="")

            self.populate_treeview()
            self.update_stats_display()
            messagebox.showinfo("Đã hủy XÓA", f"Đã hủy bỏ đánh dấu xóa cho {len(matches):,} đối tượng!", parent=dlg)
            dlg.destroy()

        btn_mark = ttk.Button(btn_box, text="🗑️ Đánh dấu XÓA đối tượng lọc", command=apply_mark_delete)
        btn_mark.pack(side=tk.LEFT, padx=4)

        btn_unmark = ttk.Button(btn_box, text="↩️ Bỏ đánh dấu XÓA", command=apply_unmark_delete)
        btn_unmark.pack(side=tk.LEFT, padx=4)

        btn_cancel = ttk.Button(btn_box, text="Đóng", command=dlg.destroy)
        btn_cancel.pack(side=tk.RIGHT, padx=4)

    def save_kml(self, overwrite=True):
        if overwrite:
            save_path = self.file_path
            bak_path = self.file_path + ".bak"
            try:
                shutil.copy2(self.file_path, bak_path)
            except Exception as e:
                print(f"Khong the tao file backup: {e}")
        else:
            base, ext = os.path.splitext(self.file_path)
            default_new = f"{base}_chuyen_doi{ext}"
            save_path = filedialog.asksaveasfilename(
                title="Lưu file KML mới",
                initialfile=os.path.basename(default_new),
                initialdir=os.path.dirname(self.file_path),
                filetypes=[("File KML", "*.kml"), ("Tất cả", "*.*")]
            )
            if not save_path:
                return

        rule_map = self.get_rule_map()
        
        # Xác định danh sách đối tượng bị xóa
        to_delete_set = set()
        for idx, pm in enumerate(self.placemarks_info):
            k = (pm['orig_type'], pm['color'].lower(), pm['land_type'].upper())
            rule = rule_map.get(k)
            if pm.get('marked_delete', False) or (rule and rule.get('deleted', False)):
                to_delete_set.add(idx)

        total_del = len(to_delete_set)
        remain_cnt = len(self.placemarks_info) - total_del

        if total_del == len(self.placemarks_info):
            if not messagebox.askyesno("Cảnh báo", "Bạn đang chọn XÓA TOÀN BỘ tất cả đối tượng trong file!\nBạn có chắc chắn muốn xóa hết không?"):
                return
        elif total_del > 0:
            msg = (
                f"⚠️ XÁC NHẬN LƯU & XÓA ĐỐI TƯỢNG:\n\n"
                f"• Sẽ XÓA VĨNH VIỄN: {total_del:,} đối tượng\n"
                f"• Số đối tượng còn lại: {remain_cnt:,} đối tượng\n"
                f"• Lưu tại: {save_path}\n\n"
                f"Bạn có chắc chắn muốn tiến hành lưu không?"
            )
            if not messagebox.askyesno("Xác nhận xóa đối tượng", msg):
                return

        self.status_lbl.config(text="Đang xử lý dữ liệu và lưu file KML...")
        self.prog_bar.pack(side=tk.LEFT, padx=6)
        self.prog_bar.start(10)
        self.root.update_idletasks()

        t0 = time.time()
        ns_uri = KML_NS
        total_converted = 0
        total_deleted = 0

        try:
            # Xây dựng parent map để xóa Placemark an toàn, nhanh O(1)
            parent_map = {c: p for p in self.tree.iter() for c in p}

            for idx, pm in enumerate(self.placemarks_info):
                pm_el = pm['element']
                
                # Kiểm tra nếu đối tượng nằm trong danh sách xóa
                if idx in to_delete_set:
                    parent = parent_map.get(pm_el)
                    if parent is not None:
                        parent.remove(pm_el)
                        total_deleted += 1
                    continue

                orig_geom = pm['orig_type']
                orig_c = pm['color'].lower()
                orig_lt = pm['land_type'].upper()
                
                rule = rule_map.get((orig_geom, orig_c, orig_lt))
                if not rule or rule['locked']:
                    continue
                    
                target_geom = rule['target_geom']
                target_lt = rule['target_lt'].upper()
                target_c = rule['target_c']

                # 1. Cập nhật ExtendedData
                ext_el = pm_el.find(f'{{{ns_uri}}}ExtendedData')
                if ext_el is None:
                    ext_el = ET.SubElement(pm_el, f'{{{ns_uri}}}ExtendedData')
                    
                for child in list(ext_el):
                    if child.attrib.get('name') in ('lantypr', 'linetype'):
                        ext_el.remove(child)

                # Color trong ExtendedData
                data_c = None
                for child in ext_el.findall(f'{{{ns_uri}}}Data'):
                    if child.attrib.get('name') == 'color':
                        data_c = child
                        break
                if data_c is None:
                    data_c = ET.SubElement(ext_el, f'{{{ns_uri}}}Data', name='color')
                val_c = data_c.find(f'{{{ns_uri}}}value')
                if val_c is None:
                    val_c = ET.SubElement(data_c, f'{{{ns_uri}}}value')
                val_c.text = target_c

                # LandType trong ExtendedData
                data_lt = None
                for child in ext_el.findall(f'{{{ns_uri}}}Data'):
                    if child.attrib.get('name') == 'landType':
                        data_lt = child
                        break
                if data_lt is None:
                    data_lt = ET.SubElement(ext_el, f'{{{ns_uri}}}Data', name='landType')
                val_lt = data_lt.find(f'{{{ns_uri}}}value')
                if val_lt is None:
                    val_lt = ET.SubElement(data_lt, f'{{{ns_uri}}}value')
                val_lt.text = target_lt.upper()

                # 2. Chuyển đổi Hình học (Geometry)
                coords_str = pm['raw_coords']
                pts = coords_str.strip().split()
                alt_mode_text = pm.get('altitude_mode', '')

                if target_geom == 'Polygon' and orig_geom == 'LineString':
                    if pts and pts[0] != pts[-1]:
                        pts.append(pts[0])
                    closed_coords = ' '.join(pts)
                    
                    ls_el = pm_el.find(f'{{{ns_uri}}}LineString')
                    if ls_el is not None:
                        pm_el.remove(ls_el)
                        
                    poly_el = ET.SubElement(pm_el, f'{{{ns_uri}}}Polygon')
                    if alt_mode_text:
                        alt_el = ET.SubElement(poly_el, f'{{{ns_uri}}}altitudeMode')
                        alt_el.text = alt_mode_text
                    outer_el = ET.SubElement(poly_el, f'{{{ns_uri}}}outerBoundaryIs')
                    ring_el = ET.SubElement(outer_el, f'{{{ns_uri}}}LinearRing')
                    c_el = ET.SubElement(ring_el, f'{{{ns_uri}}}coordinates')
                    c_el.text = closed_coords
                    total_converted += 1
                    
                elif target_geom == 'LineString' and orig_geom == 'Polygon':
                    poly_el = pm_el.find(f'{{{ns_uri}}}Polygon')
                    if poly_el is not None:
                        pm_el.remove(poly_el)
                        
                    ls_el = ET.SubElement(pm_el, f'{{{ns_uri}}}LineString')
                    if alt_mode_text:
                        alt_el = ET.SubElement(ls_el, f'{{{ns_uri}}}altitudeMode')
                        alt_el.text = alt_mode_text
                    c_el = ET.SubElement(ls_el, f'{{{ns_uri}}}coordinates')
                    c_el.text = coords_str
                    total_converted += 1

                # 3. Cập nhật Style KML
                style_el = pm_el.find(f'{{{ns_uri}}}Style')
                if style_el is None:
                    style_el = ET.SubElement(pm_el, f'{{{ns_uri}}}Style')
                    
                bgr = hex_to_kml_bgr(target_c)
                kml_line_color = f"ff{bgr}"
                kml_poly_color = f"02{bgr}"
                
                # LineStyle
                ls_style = style_el.find(f'{{{ns_uri}}}LineStyle')
                if ls_style is None:
                    ls_style = ET.SubElement(style_el, f'{{{ns_uri}}}LineStyle')
                    w_el = ET.SubElement(ls_style, f'{{{ns_uri}}}width')
                    w_el.text = "3"
                c_ls = ls_style.find(f'{{{ns_uri}}}color')
                if c_ls is None:
                    c_ls = ET.SubElement(ls_style, f'{{{ns_uri}}}color')
                c_ls.text = kml_line_color
                
                # PolyStyle
                ps_style = style_el.find(f'{{{ns_uri}}}PolyStyle')
                if target_geom == 'Polygon':
                    if ps_style is None:
                        ps_style = ET.SubElement(style_el, f'{{{ns_uri}}}PolyStyle')
                    c_ps = ps_style.find(f'{{{ns_uri}}}color')
                    if c_ps is None:
                        c_ps = ET.SubElement(ps_style, f'{{{ns_uri}}}color')
                    c_ps.text = kml_poly_color
                elif target_geom == 'LineString':
                    if ps_style is not None:
                        style_el.remove(ps_style)

            # Chỉ format indent nếu số đối tượng còn lại nhỏ (< 500) để đảm bảo tốc độ ghi siêu nhanh
            if remain_cnt <= 500:
                try:
                    ET.indent(self.tree, space="  ")
                except Exception:
                    pass
                    
            self.tree.write(save_path, encoding='utf-8', xml_declaration=True)
            t1 = time.time()

            self.prog_bar.stop()
            self.prog_bar.pack_forget()

            report_msg = (
                f"Đã xử lý xong file KML trong {t1 - t0:.2f} giây!\n\n"
                f"• Đã XÓA: {total_deleted:,} đối tượng theo thuộc tính\n"
                f"• Đã chuyển đổi / cập nhật: {total_converted:,} đối tượng\n"
                f"• Còn lại trong file: {remain_cnt:,} đối tượng\n"
                f"• Lưu tại: {save_path}"
                + (f"\n• Sao lưu an toàn: {self.file_path}.bak" if overwrite else "")
            )
            messagebox.showinfo("Thành công", report_msg)
            self.root.destroy()
            
        except Exception as e:
            self.prog_bar.stop()
            self.prog_bar.pack_forget()
            messagebox.showerror("Lỗi khi lưu", f"Đã xảy ra lỗi: {e}")
            import traceback; traceback.print_exc()

def parse_kml_fast(file_path):
    """Phân tích cú pháp file KML tốc độ cao và gom nhóm thuộc tính."""
    tree = ET.parse(file_path)
    root = tree.getroot()
    ns_uri = KML_NS
    
    placemarks_info = []
    groups_dict = {}  # key: (orig_type, color, land_type) -> count
    
    for pm in root.findall(f'.//{{{ns_uri}}}Placemark'):
        # 1. Tên
        name_el = pm.find(f'{{{ns_uri}}}name')
        name_text = name_el.text.strip() if (name_el is not None and name_el.text) else "Không tên"
        
        # 2. Thuộc tính ExtendedData
        ext_data = {}
        ext_el = pm.find(f'{{{ns_uri}}}ExtendedData')
        if ext_el is not None:
            for d in ext_el.findall(f'{{{ns_uri}}}Data') + ext_el.findall(f'{{{ns_uri}}}SimpleData'):
                k = d.attrib.get('name')
                v_el = d.find(f'{{{ns_uri}}}value')
                v_val = v_el.text if (v_el is not None and v_el.text) else d.text
                if k and v_val:
                    ext_data[k] = v_val.strip()

        # 3. Xác định loại hình học & tọa độ
        geom_type = "Unknown"
        raw_coords = ""
        coords_count = 0
        alt_mode = ""
        
        poly_el = pm.find(f'{{{ns_uri}}}Polygon')
        ls_el = pm.find(f'{{{ns_uri}}}LineString')
        pt_el = pm.find(f'{{{ns_uri}}}Point')
        
        if poly_el is not None:
            geom_type = "Polygon"
            alt_el = poly_el.find(f'{{{ns_uri}}}altitudeMode')
            if alt_el is not None and alt_el.text:
                alt_mode = alt_el.text.strip()
            c_el = poly_el.find(f'.//{{{ns_uri}}}coordinates')
            if c_el is not None and c_el.text:
                raw_coords = c_el.text.strip()
                coords_count = len(raw_coords.split())
        elif ls_el is not None:
            geom_type = "LineString"
            alt_el = ls_el.find(f'{{{ns_uri}}}altitudeMode')
            if alt_el is not None and alt_el.text:
                alt_mode = alt_el.text.strip()
            c_el = ls_el.find(f'.//{{{ns_uri}}}coordinates')
            if c_el is not None and c_el.text:
                raw_coords = c_el.text.strip()
                coords_count = len(raw_coords.split())
        elif pt_el is not None:
            geom_type = "Point"
            c_el = pt_el.find(f'.//{{{ns_uri}}}coordinates')
            if c_el is not None and c_el.text:
                raw_coords = c_el.text.strip()
                coords_count = len(raw_coords.split())

        # 4. Xác định màu sắc
        color = ext_data.get('color', '')
        if not color:
            style_el = pm.find(f'{{{ns_uri}}}Style')
            if style_el is not None:
                ls_c = style_el.find(f'.//{{{ns_uri}}}LineStyle/{{{ns_uri}}}color')
                if ls_c is not None and ls_c.text:
                    color = kml_color_to_hex(ls_c.text)
                else:
                    ps_c = style_el.find(f'.//{{{ns_uri}}}PolyStyle/{{{ns_uri}}}color')
                    if ps_c is not None and ps_c.text:
                        color = kml_color_to_hex(ps_c.text)
        if not color:
            color = "#ffd0ff"

        # 5. Xác định loại đất (landType)
        lt = ext_data.get('landType', ext_data.get('lantypr', ext_data.get('linetype', '')))
        if not lt:
            for candidate in STANDARD_MAPPINGS.keys():
                if candidate.lower() in name_text.lower():
                    lt = candidate
                    break
        if not lt:
            lt = "ONT"

        color_clean = color.lower()
        lt_clean = lt.strip().upper()

        # Gom nhóm
        g_key = (geom_type, color_clean, lt_clean)
        groups_dict[g_key] = groups_dict.get(g_key, 0) + 1

        placemarks_info.append({
            'element': pm,
            'name': name_text,
            'orig_type': geom_type,
            'color': color_clean,
            'land_type': lt_clean,
            'raw_coords': raw_coords,
            'coords_count': coords_count,
            'altitude_mode': alt_mode,
            'ext_data': ext_data,
            'marked_delete': False
        })

    # Chuyển groups_dict sang danh sách
    unique_groups = []
    for (gt, col, lt_code), cnt in sorted(groups_dict.items(), key=lambda x: -x[1]):
        unique_groups.append({
            'orig_type': gt,
            'color': col,
            'land_type': lt_code,
            'count': cnt
        })

    return tree, placemarks_info, unique_groups

def main():
    file_path = ""
    if len(sys.argv) > 1 and sys.argv[1].strip():
        file_path = sys.argv[1].strip()
    else:
        root_tmp = tk.Tk()
        root_tmp.withdraw()
        file_path = filedialog.askopenfilename(
            title="Chọn file KML cần chuyển đổi thuộc tính & Đường/Vùng",
            filetypes=[("File KML (*.kml)", "*.kml"), ("Tất cả các file", "*.*")]
        )
        root_tmp.destroy()
        
    if not file_path or not os.path.isfile(file_path):
        print("\n[!] Không có file KML nào được chọn.")
        print("Vui lòng KÉO THẢ trực tiếp file .kml vào file .bat này hoặc chạy lại để chọn file!")
        return

    print(f"[*] Đang đọc và phân tích file KML: {file_path}")
    t0 = time.time()
    try:
        tree, placemarks_info, unique_groups = parse_kml_fast(file_path)
        t1 = time.time()
        print(f"  -> Đọc thành công {len(placemarks_info):,} Placemarks ({len(unique_groups)} nhóm) trong {t1 - t0:.2f}s")
        
        if not placemarks_info:
            print("[!] Không tìm thấy đối tượng (Placemark) nào trong file KML.")
            input("Nhấn Enter để thoát...")
            return
            
        root = tk.Tk()
        app = KMLConverterApp(root, file_path, tree, placemarks_info, unique_groups)
        root.mainloop()
    except Exception as e:
        print(f"[!] Đã xảy ra lỗi: {e}")
        import traceback; traceback.print_exc()
        input("Nhấn Enter để thoát...")

if __name__ == '__main__':
    main()
