/*
 * Bản web của Keo_Tha_KML_Vao_Day.bat.
 * Phần xử lý KML dưới đây giữ nguyên thứ tự ưu tiên thuộc tính và các quy tắc
 * chuyển đổi của chương trình Python gốc; chỉ thay giao diện Tkinter bằng DOM.
 */

const KML_NS = 'http://www.opengis.net/kml/2.2';
const DELETE_GEOM_VALUE = '__DELETE__';

const STANDARD_MAPPINGS = {
  ONT: '#ffd0ff', ODT: '#ffa0ff', LUA: '#fffc82', CHN: '#fffc78',
  HNK: '#fff0b4', CLN: '#80ff80', DTL: '#aaffff', DLT: '#aaffff',
  DGT: '#ffaa32', NTS: '#80ffcc', RSX: '#60c060', RPH: '#40a040',
  RDD: '#208020', TSC: '#ff8040', SKC: '#ffa0a0', CSD: '#c0c0c0',
  DVH: '#8080ff', DYT: '#ff6060', DGD: '#6080ff', CQP: '#800000',
  CAN: '#000080', TON: '#ff40a0', NTD: '#d0a060', SMN: '#4040ff',
  MNC: '#60a0ff', PNK: '#ffc060', NKH: '#c0a080', BCS: '#fffffe'
};

const LAND_DESCRIPTIONS = {
  ONT: 'Đất ở tại nông thôn',
  ODT: 'Đất ở tại đô thị',
  LUA: 'Đất trồng lúa',
  CHN: 'Đất trồng cây hàng năm khác',
  HNK: 'Đất trồng cây hàng năm khác',
  CLN: 'Đất trồng cây lâu năm',
  DTL: 'Đất thủy lợi',
  DLT: 'Đất thủy lợi',
  DGT: 'Đất giao thông',
  NTS: 'Đất nuôi trồng thủy sản',
  RSX: 'Đất rừng sản xuất',
  RPH: 'Đất rừng phòng hộ',
  RDD: 'Đất rừng đặc dụng',
  TSC: 'Đất trụ sở cơ quan',
  SKC: 'Đất cơ sở sản xuất phi nông nghiệp',
  CSD: 'Đất có mục đích công cộng',
  DVH: 'Đất cơ sở văn hóa',
  DYT: 'Đất cơ sở y tế',
  DGD: 'Đất cơ sở giáo dục - đào tạo',
  CQP: 'Đất quốc phòng',
  CAN: 'Đất an ninh',
  TON: 'Đất tín ngưỡng, tôn giáo',
  NTD: 'Đất nghĩa trang, nhà tang lễ',
  SMN: 'Đất sông, ngòi, kênh, rạch, suối',
  MNC: 'Đất có mặt nước chuyên dùng',
  PNK: 'Đất phi nông nghiệp khác',
  NKH: 'Đất nông nghiệp khác',
  BCS: 'Đất bằng chưa sử dụng'
};

const ICONS = {
  database: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>',
  polygon: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 19 7 16 16 8 16 5 7 12 2"></polygon></svg>',
  line: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 15 21 7"></polyline><circle cx="3" cy="17" r="1.5"></circle><circle cx="21" cy="7" r="1.5"></circle></svg>',
  point: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
  layers: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>',
  trash: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
  check: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
  undo: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>',
  filter: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>',
  compass: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line></svg>'
};

const state = {
  file: null,
  fileName: '',
  sourceText: '',
  document: null,
  placemarks: [],
  groups: [],
  groupControls: [],
  selectedDetail: new Set(),
  search: '',
  xyzTouched: false
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const els = {
  fileInput: $('#file-input'),
  fileName: $('#file-name'),
  dropZone: $('#drop-zone'),
  workspace: $('#workspace'),
  stats: $('#stats'),
  status: $('#status'),
  groupBody: $('#group-body'),
  detailBody: $('#detail-body'),
  detailLimit: $('#detail-limit'),
  detailSearch: $('#detail-search'),
  quickDeleteLandType: $('#quick-delete-land-type'),
  batchLandType: $('#batch-land-type'),
  landOptions: $('#land-type-options'),
  contextMenu: $('#context-menu'),
  busy: $('#busy'),
  busyText: $('#busy-text'),
  filterDialog: $('#filter-dialog'),
  filterMatched: $('#filter-matched'),
  filterGeometry: $('#filter-geometry'),
  filterLandType: $('#filter-land-type'),
  filterColor: $('#filter-color'),
  filterName: $('#filter-name'),
  filterPointsOp: $('#filter-points-op'),
  filterPointsValue: $('#filter-points-value'),
  filterLandOptions: $('#filter-land-options'),
  filterColorOptions: $('#filter-color-options'),
  xyzTabBadge: $('#xyz-tab-badge'),
  xyzCurrentFile: $('#xyz-current-file'),
  xyzObjectCount: $('#xyz-object-count'),
  xyzVertexCount: $('#xyz-vertex-count'),
  xyzEnabled: $('#xyz-enabled'),
  xyzDx: $('#xyz-dx'),
  xyzDy: $('#xyz-dy'),
  xyzDz: $('#xyz-dz'),
  xyzDxDesc: $('#xyz-dx-desc'),
  xyzDyDesc: $('#xyz-dy-desc'),
  xyzDzDesc: $('#xyz-dz-desc'),
  xyzSumX: $('#xyz-sum-x'),
  xyzSumY: $('#xyz-sum-y'),
  xyzSumZ: $('#xyz-sum-z'),
  xyzPreviewBody: $('#xyz-preview-body'),
  xyzPreviewNote: $('#xyz-preview-note'),
  xyzExportLabel: $('#xyz-export-label')
};

function keyFor(type, color, landType) {
  return `${type}\u0000${String(color || '').toLowerCase()}\u0000${String(landType || '').toUpperCase()}`;
}

function localChildren(parent, localName) {
  return Array.from(parent?.children || []).filter(child =>
    (child.localName || child.tagName) === localName
  );
}

function directChild(parent, localName) {
  return localChildren(parent, localName)[0] || null;
}

function descendantsByLocalName(parent, localName) {
  if (!parent) return [];
  const byNs = parent.getElementsByTagNameNS ? Array.from(parent.getElementsByTagNameNS('*', localName)) : [];
  if (byNs.length) return byNs;
  return Array.from(parent.getElementsByTagName ? parent.getElementsByTagName(localName) : []);
}

function descendant(parent, localName) {
  return descendantsByLocalName(parent, localName)[0] || null;
}

function textOf(element) {
  return element?.textContent || '';
}

function hexToKmlBgr(hexString) {
  if (!hexString) return 'ffffff';
  let h = String(hexString).replace(/^#/, '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (h.length !== 6) return 'ffffff';
  return `${h.slice(4, 6)}${h.slice(2, 4)}${h.slice(0, 2)}`;
}

function kmlColorToHex(kmlColor) {
  if (!kmlColor) return '#ffffff';
  const c = String(kmlColor).trim().toLowerCase();
  if (c.length === 8) return `#${c.slice(6, 8)}${c.slice(4, 6)}${c.slice(2, 4)}`;
  if (c.length === 6) return `#${c.slice(4, 6)}${c.slice(2, 4)}${c.slice(0, 2)}`;
  return '#ffffff';
}

function safeColor(value) {
  const c = String(value || '');
  return (/^#[0-9a-f]{3}$/i.test(c) || /^#[0-9a-f]{6}$/i.test(c)) ? c : '#ffffff';
}

function fullColorForPicker(value) {
  const c = safeColor(value);
  if (c.length === 4) return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
  return c;
}

function geometryLabel(type) {
  return type === 'Polygon' ? 'Vùng' : type === 'LineString' ? 'Đường' : type === 'Point' ? 'Điểm' : type;
}

function createGeometryBadge(type) {
  const span = document.createElement('span');
  const cls = type === 'Polygon' ? 'geom-polygon' : type === 'LineString' ? 'geom-line' : type === 'Point' ? 'geom-point' : 'geom-other';
  span.className = `geom-badge ${cls}`;
  const icon = type === 'Polygon' ? ICONS.polygon : type === 'LineString' ? ICONS.line : type === 'Point' ? ICONS.point : ICONS.layers;
  span.innerHTML = `${icon}<span>${geometryLabel(type)}</span>`;
  return span;
}

function createStatusBadge(deleted) {
  const span = document.createElement('span');
  span.className = `status-badge ${deleted ? 'is-deleted' : 'is-keep'}`;
  span.innerHTML = deleted ? `${ICONS.trash}<span>Sẽ xóa</span>` : `${ICONS.check}<span>Giữ lại</span>`;
  return span;
}

function showBusy(message) {
  els.busyText.textContent = message;
  els.busy.hidden = false;
}

function hideBusy() {
  els.busy.hidden = true;
}

function setStatus(message) {
  els.status.textContent = message;
}

function showToast(title, description = '') {
  const container = $('#toast-container');
  if (!container) return;
  const card = document.createElement('div');
  card.className = 'toast-card';
  card.innerHTML = `
    <div class="toast-icon">${ICONS.check}</div>
    <div class="toast-content">
      <div class="toast-title"></div>
      <div class="toast-desc"></div>
    </div>
  `;
  card.querySelector('.toast-title').textContent = title;
  card.querySelector('.toast-desc').textContent = description;
  container.appendChild(card);
  window.setTimeout(() => {
    card.style.opacity = '0';
    card.style.transition = 'opacity 0.2s ease';
    window.setTimeout(() => card.remove(), 220);
  }, 3500);
}

function closeNotify() {
  const dlg = $('#notify-dialog');
  if (!dlg) return;
  if (dlg.open) dlg.close();
  else dlg.removeAttribute('open');
}

function notify(message, title = 'Thông báo') {
  const dlg = $('#notify-dialog');
  const titleEl = $('#notify-title');
  const subEl = $('#notify-subtitle');
  const iconEl = $('#notify-icon');
  const bodyEl = $('#notify-body');
  if (!dlg || !bodyEl) return;

  const lowerTitle = String(title || '').toLowerCase();
  const isError = lowerTitle.includes('lỗi');
  const isSuccess = lowerTitle.includes('thành công') || lowerTitle.includes('đã');

  iconEl.className = `modal-icon notify-icon ${isError ? 'is-danger' : isSuccess ? 'is-success' : 'is-info'}`;
  iconEl.innerHTML = isError
    ? '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
    : isSuccess
      ? ICONS.check
      : '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';

  titleEl.textContent = title;
  subEl.textContent = isError
    ? 'Vui lòng kiểm tra lại dữ liệu hoặc thao tác'
    : isSuccess
      ? 'Cấu hình đã được cập nhật vào phiên làm việc hiện tại'
      : 'Thông tin chi tiết từ hệ thống xử lý KML';

  bodyEl.replaceChildren();
  const lines = String(message || '').split('\n').map(l => l.trim()).filter(Boolean);
  let kvList = null;

  lines.forEach((line, idx) => {
    if (line.startsWith('•')) {
      if (!kvList) {
        kvList = document.createElement('div');
        kvList.className = 'notify-kv-list';
        bodyEl.appendChild(kvList);
      }
      const raw = line.replace(/^•\s*/, '');
      const colonIdx = raw.indexOf(':');
      const row = document.createElement('div');
      row.className = 'notify-kv-row';
      if (colonIdx !== -1) {
        const k = raw.slice(0, colonIdx).trim();
        const v = raw.slice(colonIdx + 1).trim();
        row.innerHTML = `<span class="notify-kv-key"><span class="notify-kv-dot"></span><span></span></span><span class="notify-kv-val"></span>`;
        row.querySelector('.notify-kv-key span:last-child').textContent = k;
        row.querySelector('.notify-kv-val').textContent = v;
      } else {
        row.innerHTML = `<span class="notify-kv-key"><span class="notify-kv-dot"></span><span></span></span>`;
        row.querySelector('.notify-kv-key span:last-child').textContent = raw;
      }
      kvList.appendChild(row);
    } else {
      const p = document.createElement('p');
      p.className = (idx === lines.length - 1 && lines.length > 1) ? 'notify-foot-note' : 'notify-lead';
      p.textContent = line.replace(/^\(|\)$/g, '');
      bodyEl.appendChild(p);
    }
  });

  if (typeof dlg.showModal === 'function') {
    if (!dlg.open) dlg.showModal();
  } else {
    dlg.setAttribute('open', '');
  }
  const okBtn = $('#notify-ok');
  if (okBtn) okBtn.focus();
}

function parseXmlDocument(text) {
  const cleaned = String(text || '').replace(/^\uFEFF/, '').trimStart();
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleaned, 'application/xml');
  if (doc.querySelector('parsererror') || !doc.documentElement || (doc.documentElement.localName || doc.documentElement.tagName).toLowerCase() !== 'kml') {
    throw new Error('File không phải KML hợp lệ hoặc không đọc được XML.');
  }
  return doc;
}

function parseKml(text, fileName) {
  const doc = parseXmlDocument(text);
  const placemarks = [];
  const groups = new Map();
  const pmElements = descendantsByLocalName(doc, 'Placemark');

  for (const pm of pmElements) {
    const nameEl = directChild(pm, 'name');
    const name = nameEl && textOf(nameEl).trim() ? textOf(nameEl).trim() : 'Không tên';
    const extData = {};
    const extEl = directChild(pm, 'ExtendedData');
    if (extEl) {
      for (const child of Array.from(extEl.children)) {
        const tag = child.localName || child.tagName;
        if (!['Data', 'SimpleData'].includes(tag)) continue;
        const k = child.getAttribute('name');
        if (!k) continue;
        const valueEl = directChild(child, 'value');
        const value = valueEl ? textOf(valueEl) : textOf(child);
        if (value) extData[k] = value.trim();
      }
    }

    let origType = 'Unknown';
    let rawCoords = '';
    let coordsCount = 0;
    let altitudeMode = '';
    const polygon = directChild(pm, 'Polygon');
    const lineString = directChild(pm, 'LineString');
    const point = directChild(pm, 'Point');
    let geometry = null;
    if (polygon) { origType = 'Polygon'; geometry = polygon; }
    else if (lineString) { origType = 'LineString'; geometry = lineString; }
    else if (point) { origType = 'Point'; geometry = point; }
    if (geometry) {
      const altitude = directChild(geometry, 'altitudeMode');
      if (altitude && textOf(altitude)) altitudeMode = textOf(altitude).trim();
      const coords = descendant(geometry, 'coordinates');
      if (coords && textOf(coords)) {
        rawCoords = textOf(coords).trim();
        coordsCount = rawCoords.split(/\s+/).filter(Boolean).length;
      }
    }

    let color = extData.color || '';
    if (!color) {
      const style = directChild(pm, 'Style');
      if (style) {
        const lineColor = descendant(descendant(style, 'LineStyle'), 'color');
        const polyColor = descendant(descendant(style, 'PolyStyle'), 'color');
        if (lineColor && textOf(lineColor)) color = kmlColorToHex(textOf(lineColor));
        else if (polyColor && textOf(polyColor)) color = kmlColorToHex(textOf(polyColor));
      }
    }
    if (!color) color = '#ffd0ff';

    let landType = extData.landType || extData.lantypr || extData.linetype || '';
    if (!landType) {
      for (const candidate of Object.keys(STANDARD_MAPPINGS)) {
        if (candidate.toLowerCase() && name.toLowerCase().includes(candidate.toLowerCase())) {
          landType = candidate;
          break;
        }
      }
    }
    if (!landType) landType = 'ONT';
    color = color.toLowerCase();
    landType = landType.trim().toUpperCase();
    const pmInfo = {
      element: pm, name, origType, color, landType, rawCoords, coordsCount,
      altitudeMode, extData, markedDelete: false
    };
    placemarks.push(pmInfo);
    const key = keyFor(origType, color, landType);
    const group = groups.get(key) || { orig_type: origType, color, land_type: landType, count: 0 };
    group.count += 1;
    groups.set(key, group);
  }

  const uniqueGroups = Array.from(groups.values()).sort((a, b) => b.count - a.count);
  return { document: doc, placemarks, groups: uniqueGroups, fileName };
}

function groupRuleMap() {
  const map = new Map();
  for (const control of state.groupControls) {
    const group = control.group;
    map.set(keyFor(group.orig_type, group.color, group.land_type), {
      locked: control.lock.checked,
      deleted: control.delete.checked,
      targetGeom: control.geometry.value,
      targetLt: control.landType.value.trim().toUpperCase(),
      targetColor: control.color.value.trim()
    });
  }
  return map;
}

function isPlacemarkDeleted(pm, ruleMap = groupRuleMap()) {
  if (pm.markedDelete) return true;
  const rule = ruleMap.get(keyFor(pm.origType, pm.color, pm.landType));
  return Boolean(rule?.deleted);
}

function totalDeleted(ruleMap = groupRuleMap()) {
  let count = 0;
  for (const pm of state.placemarks) if (isPlacemarkDeleted(pm, ruleMap)) count += 1;
  return count;
}

function updateStats() {
  const ruleMap = groupRuleMap();
  const total = state.placemarks.length;
  const deleted = totalDeleted(ruleMap);
  const polygonCount = state.placemarks.filter(pm => pm.origType === 'Polygon').length;
  const lineCount = state.placemarks.filter(pm => pm.origType === 'LineString').length;
  const otherCount = total - polygonCount - lineCount;

  const chips = [
    `<span class="stat-chip">${ICONS.database}<span>Tổng: <strong>${total.toLocaleString('en-US')}</strong></span></span>`,
    `<span class="stat-chip">${ICONS.polygon}<span>Vùng: <strong>${polygonCount.toLocaleString('en-US')}</strong></span></span>`,
    `<span class="stat-chip">${ICONS.line}<span>Đường: <strong>${lineCount.toLocaleString('en-US')}</strong></span></span>`,
    `<span class="stat-chip">${ICONS.layers}<span>Nhóm: <strong>${state.groups.length.toLocaleString('en-US')}</strong></span></span>`
  ];
  if (otherCount > 0) {
    chips.push(`<span class="stat-chip">${ICONS.point}<span>Khác: <strong>${otherCount.toLocaleString('en-US')}</strong></span></span>`);
  }
  if (deleted > 0) {
    chips.push(`<span class="stat-chip stat-danger">${ICONS.trash}<span>Sẽ xóa: <strong>${deleted.toLocaleString('en-US')}</strong></span></span>`);
    chips.push(`<span class="stat-chip stat-success">${ICONS.check}<span>Còn lại: <strong>${(total - deleted).toLocaleString('en-US')}</strong></span></span>`);
    if (!els.status.dataset.custom) {
      setStatus(`Đang chọn xóa ${deleted.toLocaleString('en-US')} đối tượng (còn lại ${(total - deleted).toLocaleString('en-US')}).`);
    }
  } else if (!els.status.dataset.custom) {
    setStatus('Sẵn sàng thực hiện chuyển đổi hoặc xóa đối tượng.');
  }
  const xyzCfg = getXyzConfig();
  if (xyzCfg.enabled && xyzCfg.hasOffset) {
    chips.push(`<span class="stat-chip stat-xyz">${ICONS.compass}<span>XYZ: <strong>X${formatSignedNumber(xyzCfg.dx)}, Y${formatSignedNumber(xyzCfg.dy)}, Z${formatSignedNumber(xyzCfg.dz)}</strong> (${xyzCfg.unit})</span></span>`);
  }
  els.stats.innerHTML = chips.join('');
  updateXyzView(ruleMap);
}

function setCustomStatus(message) {
  els.status.dataset.custom = '1';
  setStatus(message);
  window.clearTimeout(setCustomStatus.timer);
  setCustomStatus.timer = window.setTimeout(() => {
    delete els.status.dataset.custom;
    updateStats();
  }, 5000);
}

function setControlDisabled(control, disabled) {
  control.geometry.disabled = disabled;
  control.landType.disabled = disabled;
  if (control.comboToggle) control.comboToggle.disabled = disabled;
  control.color.disabled = disabled;
  control.colorPicker.disabled = disabled;
}

function syncGroupControl(control, render = true) {
  const isDelete = control.delete.checked;
  if (isDelete) {
    control.geometry.value = DELETE_GEOM_VALUE;
    setControlDisabled(control, true);
    control.row.classList.add('deleted');
  } else {
    if (control.geometry.value === DELETE_GEOM_VALUE) control.geometry.value = control.group.orig_type;
    setControlDisabled(control, control.lock.checked);
    control.row.classList.remove('deleted');
  }
  if (render) {
    updateStats();
    renderDetails();
  }
}

function onLandTypeChange(control) {
  const code = control.landType.value.trim().toUpperCase();
  if (Object.prototype.hasOwnProperty.call(STANDARD_MAPPINGS, code)) {
    const color = STANDARD_MAPPINGS[code];
    control.color.value = color;
    control.colorPicker.value = fullColorForPicker(color);
    control.swatch.style.backgroundColor = safeColor(color);
  }
}

function onColorChange(control) {
  control.swatch.style.backgroundColor = safeColor(control.color.value);
}

function makeColorEditor(control) {
  const wrapper = document.createElement('div');
  wrapper.className = 'color-editor';
  control.swatch = document.createElement('span');
  control.swatch.className = 'color-swatch';
  control.swatch.title = 'Màu mới';
  control.color = document.createElement('input');
  control.color.type = 'text';
  control.color.value = control.group.color;
  control.color.setAttribute('aria-label', 'Mã màu mới');
  control.colorPicker = document.createElement('input');
  control.colorPicker.type = 'color';
  control.colorPicker.value = fullColorForPicker(control.group.color);
  control.colorPicker.title = 'Chọn màu';
  wrapper.append(control.swatch, control.color, control.colorPicker);
  control.color.addEventListener('input', () => onColorChange(control));
  control.colorPicker.addEventListener('input', () => {
    control.color.value = control.colorPicker.value;
    onColorChange(control);
  });
  onColorChange(control);
  return wrapper;
}

function renderGroups() {
  els.groupBody.replaceChildren();
  state.groupControls = [];
  for (const [index, group] of state.groups.entries()) {
    const row = document.createElement('tr');
    const original = document.createElement('td');
    const origWrap = document.createElement('div');
    origWrap.className = 'group-orig-cell';
    const indexSpan = document.createElement('span');
    indexSpan.className = 'row-index';
    indexSpan.textContent = `${index + 1}.`;
    origWrap.append(indexSpan, createGeometryBadge(group.orig_type));
    original.appendChild(origWrap);

    const count = document.createElement('td');
    count.innerHTML = `<span class="count-pill">${group.count.toLocaleString('en-US')}</span>`;

    const originalColor = document.createElement('td');
    const swatch = document.createElement('span');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = safeColor(group.color);
    swatch.title = group.color;
    originalColor.appendChild(swatch);

    const originalLandType = document.createElement('td');
    const codeBadge = document.createElement('span');
    codeBadge.className = 'code-badge';
    codeBadge.textContent = group.land_type || '(trống)';
    originalLandType.appendChild(codeBadge);

    const lockCell = document.createElement('td');
    const lock = document.createElement('input');
    lock.type = 'checkbox';
    lock.title = 'Khóa nhóm';
    lockCell.appendChild(lock);

    const deleteCell = document.createElement('td');
    const del = document.createElement('input');
    del.type = 'checkbox';
    del.className = 'danger-checkbox';
    del.title = 'Xóa nhóm';
    deleteCell.appendChild(del);

    const geometryCell = document.createElement('td');
    const geometry = document.createElement('select');
    const geometryOptions = [
      { value: 'Polygon', label: 'Polygon (Vùng)' },
      { value: 'LineString', label: 'LineString (Đường)' }
    ];
    if (!geometryOptions.some(item => item.value === group.orig_type)) {
      geometryOptions.push({ value: group.orig_type, label: group.orig_type });
    }
    geometryOptions.push({ value: DELETE_GEOM_VALUE, label: 'Xóa đối tượng' });
    for (const item of geometryOptions) {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      geometry.appendChild(option);
    }
    geometry.value = group.orig_type;
    geometryCell.appendChild(geometry);

    const landCell = document.createElement('td');
    const comboWrap = document.createElement('div');
    comboWrap.className = 'combo-wrap';
    const landType = document.createElement('input');
    landType.type = 'text';
    landType.className = 'land-type-input';
    landType.value = group.land_type || 'ONT';
    landType.autocomplete = 'off';
    const comboToggle = document.createElement('button');
    comboToggle.type = 'button';
    comboToggle.className = 'combo-toggle';
    comboToggle.tabIndex = -1;
    comboToggle.title = 'Hiện tất cả mã loại đất';
    comboToggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
    comboWrap.append(landType, comboToggle);
    landCell.appendChild(comboWrap);
    wireLandTypeCombo(landType, comboToggle);

    const colorCell = document.createElement('td');
    const control = { group, row, lock, delete: del, geometry, landType, comboToggle };
    colorCell.appendChild(makeColorEditor(control));

    row.append(original, count, originalColor, originalLandType, lockCell, deleteCell, geometryCell, landCell, colorCell);
    els.groupBody.appendChild(row);
    state.groupControls.push(control);

    del.addEventListener('change', () => syncGroupControl(control));
    lock.addEventListener('change', () => {
      if (del.checked) return;
      setControlDisabled(control, lock.checked);
    });
    geometry.addEventListener('change', () => {
      if (geometry.value === DELETE_GEOM_VALUE && !del.checked) { del.checked = true; }
      else if (geometry.value !== DELETE_GEOM_VALUE && del.checked) del.checked = false;
      syncGroupControl(control);
    });
    landType.addEventListener('input', () => onLandTypeChange(control));
    syncGroupControl(control, false);
  }
  updateStats();
}

function rowMatchesSearch(pm, query, statusText) {
  if (!query) return true;
  return [pm.name, pm.origType, geometryLabel(pm.origType), pm.landType, pm.color, statusText]
    .some(value => String(value).toLowerCase().includes(query));
}

function selectDetailRow(index, event) {
  if (event.shiftKey && state.selectedDetail.size) {
    const last = Array.from(state.selectedDetail).pop();
    const start = Math.min(last, index), end = Math.max(last, index);
    for (let i = start; i <= end; i += 1) state.selectedDetail.add(i);
  } else if (event.metaKey || event.ctrlKey) {
    if (state.selectedDetail.has(index)) state.selectedDetail.delete(index);
    else state.selectedDetail.add(index);
  } else {
    state.selectedDetail = new Set([index]);
  }
  refreshSelectionClasses();
}

function refreshSelectionClasses() {
  for (const row of els.detailBody.children) {
    row.classList.toggle('selected', state.selectedDetail.has(Number(row.dataset.index)));
  }
}

function renderDetails() {
  if (!state.document) return;
  const query = state.search.trim().toLowerCase();
  const ruleMap = groupRuleMap();
  els.detailBody.replaceChildren();
  let count = 0;
  for (let index = 0; index < state.placemarks.length; index += 1) {
    const pm = state.placemarks[index];
    const deleted = isPlacemarkDeleted(pm, ruleMap);
    const statusText = deleted ? 'Sẽ xóa' : 'Giữ lại';
    if (!rowMatchesSearch(pm, query, statusText)) continue;

    const row = document.createElement('tr');
    row.dataset.index = String(index);
    if (deleted) row.classList.add('deleted');
    if (state.selectedDetail.has(index)) row.classList.add('selected');

    const cIdx = document.createElement('td');
    cIdx.textContent = String(index + 1);

    const cName = document.createElement('td');
    cName.textContent = pm.name;
    cName.title = pm.name;

    const cGeom = document.createElement('td');
    cGeom.appendChild(createGeometryBadge(pm.origType));

    const cColor = document.createElement('td');
    cColor.innerHTML = `<span class="inline-color"><span class="color-dot" style="background:${safeColor(pm.color)}"></span><code>${pm.color}</code></span>`;

    const cLt = document.createElement('td');
    const ltSpan = document.createElement('span');
    ltSpan.className = 'code-badge';
    ltSpan.textContent = pm.landType.toUpperCase();
    cLt.appendChild(ltSpan);

    const cPts = document.createElement('td');
    cPts.textContent = `${pm.coordsCount} điểm`;

    const cStatus = document.createElement('td');
    cStatus.appendChild(createStatusBadge(deleted));

    row.append(cIdx, cName, cGeom, cColor, cLt, cPts, cStatus);
    row.addEventListener('click', event => selectDetailRow(index, event));
    row.addEventListener('contextmenu', event => {
      event.preventDefault();
      if (!state.selectedDetail.has(index)) state.selectedDetail = new Set([index]);
      refreshSelectionClasses();
      openContextMenu(event.clientX, event.clientY, pm);
    });
    els.detailBody.appendChild(row);
    count += 1;
  }
  els.detailLimit.textContent = `Đang hiển thị đầy đủ ${count.toLocaleString('en-US')} / ${state.placemarks.length.toLocaleString('en-US')} đối tượng trong tệp.`;
}

function parseStrictFloat(value) {
  const s = String(value ?? '').trim();
  if (!s) return NaN;
  const num = Number(s);
  return Number.isFinite(num) ? num : NaN;
}

function formatSignedNumber(num) {
  if (!Number.isFinite(num) || Object.is(num, -0)) return '+0';
  return num >= 0 ? `+${num}` : `${num}`;
}

function getXyzConfig() {
  const unitRadio = $('input[name="xyz-unit"]:checked');
  const unit = unitRadio ? unitRadio.value : 'met';
  const dx = parseStrictFloat(els.xyzDx?.value);
  const dy = parseStrictFloat(els.xyzDy?.value);
  const dz = parseStrictFloat(els.xyzDz?.value);
  const safeDx = Number.isFinite(dx) ? dx : 0;
  const safeDy = Number.isFinite(dy) ? dy : 0;
  const safeDz = Number.isFinite(dz) ? dz : 0;
  const enabled = Boolean(els.xyzEnabled?.checked);
  const hasOffset = safeDx !== 0 || safeDy !== 0 || safeDz !== 0;
  return { unit, dx: safeDx, dy: safeDy, dz: safeDz, enabled, hasOffset };
}

function shiftCoordToken(token, config) {
  const parts = String(token || '').split(',');
  if (parts.length < 2) return { token, shifted: false };
  const x = parseStrictFloat(parts[0]);
  const y = parseStrictFloat(parts[1]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { token, shifted: false };

  let xNew;
  let yNew;
  if (config.unit === 'met') {
    const R = 6378137.0;
    yNew = y + (config.dy / R) * (180 / Math.PI);
    const cosLat = Math.cos((y * Math.PI) / 180);
    if (Math.abs(cosLat) < 1e-10) return { token, shifted: false };
    xNew = x + (config.dx / (R * cosLat)) * (180 / Math.PI);
  } else {
    xNew = x + config.dx;
    yNew = y + config.dy;
  }

  const newParts = [...parts];
  newParts[0] = xNew.toFixed(10);
  newParts[1] = yNew.toFixed(10);

  if (newParts.length >= 3) {
    const z = parseStrictFloat(newParts[2]);
    if (!Number.isFinite(z)) return { token, shifted: false };
    newParts[2] = (z + config.dz).toFixed(3);
  }

  return { token: newParts.join(','), shifted: true };
}

function shiftCoordinatesText(rawText, config) {
  const trimmed = String(rawText || '').trim();
  if (!trimmed) return { text: '', shiftedTokens: 0 };
  const tokens = trimmed.split(/\s+/);
  const newTokens = [];
  let shiftedTokens = 0;
  for (const token of tokens) {
    if (!token) continue;
    const res = shiftCoordToken(token, config);
    newTokens.push(res.token);
    if (res.shifted) shiftedTokens += 1;
  }
  return { text: newTokens.join(' '), shiftedTokens };
}

function createCoordElement(token, normalizePrecision = false) {
  const wrap = document.createElement('div');
  wrap.className = 'coord-chip-list';
  const parts = String(token || '').split(',');
  const labels = ['X', 'Y', 'Z'];
  parts.forEach((rawPart, idx) => {
    const span = document.createElement('span');
    span.className = 'coord-item';
    const b = document.createElement('b');
    b.textContent = `${labels[idx] || `C${idx + 1}`}:`;
    let valText = rawPart;
    if (normalizePrecision) {
      const n = parseStrictFloat(rawPart);
      if (Number.isFinite(n)) {
        valText = idx < 2 ? n.toFixed(10) : n.toFixed(3);
      }
    }
    span.append(b, document.createTextNode(valText));
    wrap.appendChild(span);
  });
  return wrap;
}

function updateXyzView(ruleMap = groupRuleMap()) {
  if (!els.xyzDx) return;
  const cfg = getXyzConfig();
  const unitLabel = cfg.unit === 'met' ? 'mét' : 'độ';

  $$('.xyz-xy-unit').forEach(el => { el.textContent = unitLabel; });

  els.xyzDxDesc.textContent = cfg.dx === 0 ? `Không dịch (0 ${unitLabel})` : `${cfg.dx > 0 ? 'Đông' : 'Tây'} ${Math.abs(cfg.dx)} ${unitLabel}`;
  els.xyzDyDesc.textContent = cfg.dy === 0 ? `Không dịch (0 ${unitLabel})` : `${cfg.dy > 0 ? 'Bắc' : 'Nam'} ${Math.abs(cfg.dy)} ${unitLabel}`;
  els.xyzDzDesc.textContent = cfg.dz === 0 ? 'Không dịch (0 mét)' : `${cfg.dz > 0 ? 'Lên' : 'Xuống'} ${Math.abs(cfg.dz)} mét`;

  els.xyzSumX.textContent = `${formatSignedNumber(cfg.dx)} (${cfg.unit})`;
  els.xyzSumY.textContent = `${formatSignedNumber(cfg.dy)} (${cfg.unit})`;
  els.xyzSumZ.textContent = `${formatSignedNumber(cfg.dz)} mét`;

  if (els.xyzTabBadge) {
    els.xyzTabBadge.hidden = !(cfg.enabled && cfg.hasOffset);
  }

  const outFile = state.fileName ? `chinh_XYZ_${state.fileName}` : 'chinh_XYZ_file.kml';
  if (els.xyzExportLabel) {
    els.xyzExportLabel.textContent = `Tải xuống ${outFile}`;
  }
  if (els.xyzCurrentFile) {
    els.xyzCurrentFile.textContent = state.fileName || '—';
  }

  if (!state.document) {
    if (els.xyzObjectCount) els.xyzObjectCount.textContent = '0';
    if (els.xyzVertexCount) els.xyzVertexCount.textContent = '0';
    if (els.xyzPreviewBody) els.xyzPreviewBody.replaceChildren();
    return;
  }

  let keptObjects = 0;
  let totalVertices = 0;
  for (const pm of state.placemarks) {
    if (isPlacemarkDeleted(pm, ruleMap)) continue;
    keptObjects += 1;
    totalVertices += pm.coordsCount;
  }
  if (els.xyzObjectCount) els.xyzObjectCount.textContent = keptObjects.toLocaleString('en-US');
  if (els.xyzVertexCount) els.xyzVertexCount.textContent = totalVertices.toLocaleString('en-US');

  els.xyzPreviewBody.replaceChildren();
  let previewCount = 0;
  for (let i = 0; i < state.placemarks.length; i += 1) {
    const pm = state.placemarks[i];
    if (isPlacemarkDeleted(pm, ruleMap) || !pm.rawCoords) continue;
    const firstToken = pm.rawCoords.trim().split(/\s+/)[0] || '';
    if (!firstToken) continue;
    const shifted = shiftCoordToken(firstToken, cfg);

    const tr = document.createElement('tr');
    const tdIdx = document.createElement('td');
    tdIdx.textContent = String(i + 1);

    const tdName = document.createElement('td');
    tdName.textContent = pm.name;
    tdName.title = pm.name;

    const tdGeom = document.createElement('td');
    tdGeom.appendChild(createGeometryBadge(pm.origType));

    const tdOrig = document.createElement('td');
    tdOrig.className = 'coord-cell';
    tdOrig.appendChild(createCoordElement(firstToken, true));
    tdOrig.title = firstToken;

    const tdNew = document.createElement('td');
    tdNew.className = 'coord-cell coord-new';
    tdNew.appendChild(createCoordElement(shifted.token, false));
    tdNew.title = shifted.token;

    tr.append(tdIdx, tdName, tdGeom, tdOrig, tdNew);
    els.xyzPreviewBody.appendChild(tr);
    previewCount += 1;
  }
  if (els.xyzPreviewNote) {
    els.xyzPreviewNote.textContent = previewCount > 0
      ? `Đang hiển thị đầy đủ ${previewCount.toLocaleString('en-US')} / ${keptObjects.toLocaleString('en-US')} đối tượng giữ lại (tổng ${totalVertices.toLocaleString('en-US')} đỉnh tọa độ sẽ được dịch chuyển).`
      : 'Không có tọa độ nào để xem trước.';
  }
}

function activateTab(tabName) {
  $$('.tab').forEach(item => {
    const isTarget = item.dataset.tab === tabName;
    item.classList.toggle('active', isTarget);
    item.setAttribute('aria-selected', isTarget ? 'true' : 'false');
  });
  $$('.tab-panel').forEach(panel => {
    const active = panel.id === `tab-${tabName}`;
    panel.classList.toggle('active', active);
    panel.hidden = !active;
  });
  if (tabName === 'xyz') {
    if (!state.xyzTouched && els.xyzEnabled) {
      els.xyzEnabled.checked = true;
      state.xyzTouched = true;
    }
    updateStats();
  }
}

function refreshDataViews() {
  renderGroups();
  renderDetails();
  updateStats();
  updateFilterOptions();
}

function markSelected(value) {
  if (!state.selectedDetail.size) { notify('Vui lòng chọn ít nhất một đối tượng trong bảng!'); return; }
  for (const index of state.selectedDetail) state.placemarks[index].markedDelete = value;
  renderDetails();
  updateStats();
  setCustomStatus(value ? `Đã đánh dấu xóa ${state.selectedDetail.size.toLocaleString('en-US')} đối tượng được chọn.` : `Đã hủy đánh dấu xóa cho ${state.selectedDetail.size.toLocaleString('en-US')} đối tượng được chọn.`);
}

function deleteSearchResults() {
  const query = state.search.trim().toLowerCase();
  if (!query) { notify('Vui lòng nhập từ khóa tìm kiếm trước khi chọn xóa theo kết quả!'); return; }
  const matches = state.placemarks.map((pm, index) => ({ pm, index })).filter(({ pm }) =>
    [pm.name, pm.origType, pm.landType, pm.color].some(value => value.toLowerCase().includes(query))
  );
  if (!matches.length) { notify(`Không tìm thấy đối tượng nào khớp với từ khóa '${query}'.`); return; }
  if (!window.confirm(`Tìm thấy ${matches.length.toLocaleString('en-US')} đối tượng khớp với từ khóa '${query}'.\n\nBạn có muốn đánh dấu XÓA tất cả các đối tượng này không?`)) return;
  for (const { pm } of matches) pm.markedDelete = true;
  renderDetails();
  updateStats();
  setCustomStatus(`Đã đánh dấu xóa ${matches.length.toLocaleString('en-US')} đối tượng theo từ khóa '${query}'.`);
}

function markBy(predicate, message) {
  let count = 0;
  for (const pm of state.placemarks) if (predicate(pm)) { pm.markedDelete = true; count += 1; }
  for (const control of state.groupControls) if (predicate({
    origType: control.group.orig_type,
    color: control.group.color,
    landType: control.group.land_type
  })) {
    control.delete.checked = true;
    syncGroupControl(control, false);
  }
  renderDetails();
  updateStats();
  setCustomStatus(message(count));
}

function batchDeleteByLandType(value) {
  const code = value.trim().toUpperCase();
  markBy(pm => pm.landType.toUpperCase() === code, count => `Đã đánh dấu xóa ${count.toLocaleString('en-US')} đối tượng có mã loại đất ${code}.`);
}

function batchDeleteByGeometry(value) {
  markBy(pm => pm.origType === value, count => `Đã đánh dấu xóa ${count.toLocaleString('en-US')} đối tượng kiểu hình học ${value}.`);
}

function batchDeleteByColor(value) {
  const color = value.trim().toLowerCase();
  markBy(pm => pm.color.toLowerCase() === color, count => `Đã đánh dấu xóa ${count.toLocaleString('en-US')} đối tượng có mã màu ${color}.`);
}

function clearDelete() {
  for (const pm of state.placemarks) pm.markedDelete = false;
  for (const control of state.groupControls) {
    control.delete.checked = false;
    if (control.geometry.value === DELETE_GEOM_VALUE) control.geometry.value = control.group.orig_type;
    syncGroupControl(control, false);
  }
  renderDetails();
  updateStats();
  setCustomStatus('Đã hủy bỏ toàn bộ đánh dấu xóa.');
}

function batchSetGeometry(target) {
  let changed = 0;
  for (const control of state.groupControls) {
    if (!control.lock.checked && !control.delete.checked) { control.geometry.value = target; changed += 1; }
  }
  renderDetails();
  updateStats();
  setCustomStatus(`Đã đặt ${changed} nhóm đối tượng sang kiểu ${target}.`);
}

function batchToggleGeometry() {
  let changed = 0;
  for (const control of state.groupControls) {
    if (!control.lock.checked && !control.delete.checked) {
      control.geometry.value = control.geometry.value === 'LineString' ? 'Polygon' : 'LineString';
      changed += 1;
    }
  }
  renderDetails();
  updateStats();
  setCustomStatus(`Đã đảo kiểu cho ${changed} nhóm đối tượng.`);
}

function batchLock(locked) {
  for (const control of state.groupControls) {
    control.lock.checked = locked;
    if (!control.delete.checked) setControlDisabled(control, locked);
  }
  renderDetails();
  updateStats();
  setCustomStatus(locked ? 'Đã khóa tất cả các nhóm.' : 'Đã mở khóa tất cả các nhóm.');
}

function applyBatchLandType() {
  const code = els.batchLandType.value.trim().toUpperCase();
  if (!code) return;
  let applied = 0;
  for (const control of state.groupControls) {
    if (!control.lock.checked && !control.delete.checked) {
      control.landType.value = code;
      if (STANDARD_MAPPINGS[code]) {
        control.color.value = STANDARD_MAPPINGS[code];
        control.colorPicker.value = fullColorForPicker(STANDARD_MAPPINGS[code]);
        onColorChange(control);
      }
      applied += 1;
    }
  }
  renderDetails();
  updateStats();
  setCustomStatus(`Đã gán mã loại đất ${code} cho ${applied} nhóm mở khóa.`);
}

let activeComboPopup = null;
let activeComboInput = null;

function closeComboPopup() {
  if (activeComboPopup) {
    activeComboPopup.remove();
    activeComboPopup = null;
    activeComboInput = null;
  }
}

function getAllLandCodeOptions(includeAllOption = false) {
  const fileCodes = [...new Set(state.placemarks.filter(pm => pm.landType).map(pm => pm.landType.toUpperCase()))].sort();
  const allCodes = [...new Set([...fileCodes, ...Object.keys(STANDARD_MAPPINGS)])];
  const items = [];
  if (includeAllOption) {
    items.push({ code: '(Tất cả loại đất)', color: null, desc: 'Không lọc theo mã đất' });
  }
  for (const code of allCodes) {
    items.push({
      code,
      color: STANDARD_MAPPINGS[code] || null,
      desc: LAND_DESCRIPTIONS[code] || (fileCodes.includes(code) ? 'Mã có trong tệp KML' : '')
    });
  }
  return items;
}

function getAllColorOptions() {
  const colors = [...new Set(state.placemarks.filter(pm => pm.color).map(pm => pm.color.toLowerCase()))].sort();
  const items = [{ code: '(Tất cả màu)', color: null, desc: 'Không lọc theo màu sắc' }];
  for (const c of colors) {
    items.push({ code: c, color: safeColor(c), desc: 'Màu có trong tệp KML' });
  }
  return items;
}

function openComboPopup(input, items, filterText = '') {
  if (input.disabled) return;
  closeComboPopup();
  const query = filterText.trim().toLowerCase();
  const filtered = query
    ? items.filter(item => item.code.toLowerCase().includes(query) || (item.desc && item.desc.toLowerCase().includes(query)))
    : items;
  if (!filtered.length) return;

  const popup = document.createElement('div');
  popup.className = 'combo-popup';
  const currentVal = input.value.trim().toUpperCase();
  let activeEl = null;

  for (const item of filtered) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'combo-option';
    if (item.code.toUpperCase() === currentVal) {
      btn.classList.add('is-active');
      activeEl = btn;
    }
    if (item.color) {
      const swatch = document.createElement('span');
      swatch.className = 'combo-option-swatch';
      swatch.style.backgroundColor = safeColor(item.color);
      btn.appendChild(swatch);
    }
    const codeSpan = document.createElement('span');
    codeSpan.className = 'combo-option-code';
    codeSpan.textContent = item.code;
    btn.appendChild(codeSpan);

    if (item.desc) {
      const descSpan = document.createElement('span');
      descSpan.className = 'combo-option-desc';
      descSpan.textContent = item.desc;
      btn.appendChild(descSpan);
    }

    btn.addEventListener('mousedown', event => {
      event.preventDefault();
      input.value = item.code;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      closeComboPopup();
    });
    popup.appendChild(btn);
  }

  const host = input.closest('dialog') || document.body;
  host.appendChild(popup);
  activeComboPopup = popup;
  activeComboInput = input;

  const rect = input.getBoundingClientRect();
  const popupHeight = Math.min(280, popup.scrollHeight);
  const spaceBelow = window.innerHeight - rect.bottom - 8;
  const top = spaceBelow >= popupHeight || rect.top < popupHeight
    ? rect.bottom + 4
    : Math.max(8, rect.top - popupHeight - 4);
  const left = Math.min(rect.left, window.innerWidth - Math.max(rect.width, 260) - 8);

  popup.style.top = `${top}px`;
  popup.style.left = `${Math.max(8, left)}px`;
  popup.style.minWidth = `${Math.max(rect.width, 260)}px`;

  if (activeEl) {
    activeEl.scrollIntoView({ block: 'nearest' });
  }
}

function wireLandTypeCombo(input, toggleBtn, getItemsFn = () => getAllLandCodeOptions(false)) {
  if (!input) return;
  if (toggleBtn) {
    toggleBtn.addEventListener('mousedown', event => {
      event.preventDefault();
      event.stopPropagation();
      if (activeComboPopup && activeComboInput === input) {
        closeComboPopup();
      } else {
        input.focus();
        openComboPopup(input, getItemsFn(), '');
      }
    });
  }
  input.addEventListener('click', event => {
    event.stopPropagation();
    openComboPopup(input, getItemsFn(), '');
  });
  input.addEventListener('input', () => {
    openComboPopup(input, getItemsFn(), input.value);
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape' || event.key === 'Tab' || event.key === 'Enter') {
      closeComboPopup();
    } else if (event.key === 'ArrowDown' && !activeComboPopup) {
      openComboPopup(input, getItemsFn(), '');
    }
  });
}

function updateFilterOptions() {
  const landTypes = [...new Set(state.placemarks.filter(pm => pm.landType).map(pm => pm.landType.toUpperCase()))].sort();
  els.quickDeleteLandType.replaceChildren();
  const quickValues = [...new Set([...landTypes, ...Object.keys(STANDARD_MAPPINGS)])];
  for (const value of quickValues) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = LAND_DESCRIPTIONS[value] ? `${value} — ${LAND_DESCRIPTIONS[value]}` : value;
    els.quickDeleteLandType.appendChild(option);
  }
}

function fillDatalist(list, values) {
  list.replaceChildren();
  for (const value of values) {
    const option = document.createElement('option');
    option.value = value;
    list.appendChild(option);
  }
}

function getFilterMatches() {
  const geometry = els.filterGeometry.value;
  const landType = els.filterLandType.value.trim().toUpperCase();
  const color = els.filterColor.value.trim().toLowerCase();
  const name = els.filterName.value.trim().toLowerCase();
  const pointsOp = els.filterPointsOp.value;
  let pointsLimit = null;
  if (!pointsOp.startsWith('(Không')) {
    const parsed = Number.parseInt(els.filterPointsValue.value.trim(), 10);
    if (Number.isFinite(parsed)) pointsLimit = parsed;
  }
  const matches = [];
  state.placemarks.forEach((pm, index) => {
    if (geometry.startsWith('Polygon') && pm.origType !== 'Polygon') return;
    if (geometry.startsWith('LineString') && pm.origType !== 'LineString') return;
    if (geometry.startsWith('Point') && pm.origType !== 'Point') return;
    if (landType !== '(TẤT CẢ LOẠI ĐẤT)' && pm.landType.toUpperCase() !== landType) return;
    if (color !== '(tất cả màu)' && pm.color.toLowerCase() !== color) return;
    if (name && !pm.name.toLowerCase().includes(name)) return;
    if (pointsLimit !== null) {
      if (pointsOp.startsWith('<=') && !(pm.coordsCount <= pointsLimit)) return;
      if (pointsOp.startsWith('>=') && !(pm.coordsCount >= pointsLimit)) return;
      if (pointsOp.startsWith('=') && !(pm.coordsCount === pointsLimit)) return;
    }
    matches.push(index);
  });
  return matches;
}

function updateFilterMatched() {
  const matches = getFilterMatches();
  els.filterMatched.innerHTML = `${ICONS.filter}<span>Khớp điều kiện: <strong>${matches.length.toLocaleString('en-US')}</strong> / ${state.placemarks.length.toLocaleString('en-US')} đối tượng</span>`;
}

function markFilterMatches(value) {
  const matches = getFilterMatches();
  if (!matches.length) { notify('Không có đối tượng nào phù hợp với điều kiện lọc!'); return; }
  for (const index of matches) state.placemarks[index].markedDelete = value;
  const touched = new Set(matches.map(index => keyFor(state.placemarks[index].origType, state.placemarks[index].color, state.placemarks[index].landType)));
  for (const control of state.groupControls) {
    const key = keyFor(control.group.orig_type, control.group.color, control.group.land_type);
    if (!touched.has(key)) continue;
    if (value) {
      const allMarked = state.placemarks.filter(pm => keyFor(pm.origType, pm.color, pm.landType) === key).every(pm => pm.markedDelete);
      if (allMarked) control.delete.checked = true;
    } else {
      control.delete.checked = false;
      if (control.geometry.value === DELETE_GEOM_VALUE) control.geometry.value = control.group.orig_type;
    }
    syncGroupControl(control, false);
  }
  renderDetails();
  updateStats();
  notify(value ? `Đã đánh dấu XÓA thành công ${matches.length.toLocaleString('en-US')} đối tượng!\n\n(Các đối tượng sẽ được xóa khi bạn bấm lưu file)` : `Đã hủy bỏ đánh dấu xóa cho ${matches.length.toLocaleString('en-US')} đối tượng!`, value ? 'Đã đánh dấu XÓA' : 'Đã hủy XÓA');
  els.filterDialog.close();
}

function openFilter() {
  els.filterGeometry.value = '(Tất cả kiểu)';
  els.filterLandType.value = '(Tất cả loại đất)';
  els.filterColor.value = '(Tất cả màu)';
  els.filterName.value = '';
  els.filterPointsOp.value = '(Không lọc số đỉnh)';
  els.filterPointsValue.value = '2';
  updateFilterMatched();
  if (typeof els.filterDialog.showModal === 'function') els.filterDialog.showModal();
  else els.filterDialog.setAttribute('open', '');
}

function closeFilter() {
  if (els.filterDialog.open) els.filterDialog.close();
  else els.filterDialog.removeAttribute('open');
}

function openContextMenu(x, y, pm) {
  const menu = els.contextMenu;
  menu.replaceChildren();
  const add = (icon, label, action, isDanger = false) => {
    const button = document.createElement('button');
    button.type = 'button';
    if (isDanger) button.classList.add('ctx-danger');
    const span = document.createElement('span');
    span.textContent = label;
    button.innerHTML = icon;
    button.appendChild(span);
    button.addEventListener('click', () => { action(); menu.hidden = true; });
    menu.appendChild(button);
  };
  add(ICONS.trash, `Đánh dấu xóa các dòng đang chọn (${state.selectedDetail.size})`, () => markSelected(true), true);
  add(ICONS.undo, 'Bỏ đánh dấu xóa các dòng đang chọn', () => markSelected(false));
  const hr = document.createElement('hr');
  menu.appendChild(hr);
  add(ICONS.trash, `Xóa tất cả đối tượng loại đất '${pm.landType}'`, () => batchDeleteByLandType(pm.landType), true);
  add(ICONS.trash, `Xóa tất cả đối tượng kiểu '${pm.origType}'`, () => batchDeleteByGeometry(pm.origType), true);
  add(ICONS.trash, `Xóa tất cả đối tượng màu '${pm.color}'`, () => batchDeleteByColor(pm.color), true);
  menu.hidden = false;
  const rect = menu.getBoundingClientRect();
  menu.style.left = `${Math.min(x, window.innerWidth - rect.width - 6)}px`;
  menu.style.top = `${Math.min(y, window.innerHeight - rect.height - 6)}px`;
}

function appendNsElement(parent, localName) {
  const ns = parent.namespaceURI || parent.ownerDocument.documentElement?.namespaceURI || KML_NS;
  const child = parent.ownerDocument.createElementNS(ns, localName);
  parent.appendChild(child);
  return child;
}

function updateExtendedData(pmElement, targetColor, targetLandType) {
  let ext = directChild(pmElement, 'ExtendedData');
  if (!ext) ext = appendNsElement(pmElement, 'ExtendedData');
  for (const child of Array.from(ext.children)) {
    if (child.getAttribute('name') === 'lantypr' || child.getAttribute('name') === 'linetype') child.remove();
  }
  let colorData = Array.from(ext.children).find(child => (child.localName || child.tagName) === 'Data' && child.getAttribute('name') === 'color');
  if (!colorData) { colorData = appendNsElement(ext, 'Data'); colorData.setAttribute('name', 'color'); }
  let colorValue = directChild(colorData, 'value');
  if (!colorValue) colorValue = appendNsElement(colorData, 'value');
  colorValue.textContent = targetColor;

  let landData = Array.from(ext.children).find(child => (child.localName || child.tagName) === 'Data' && child.getAttribute('name') === 'landType');
  if (!landData) { landData = appendNsElement(ext, 'Data'); landData.setAttribute('name', 'landType'); }
  let landValue = directChild(landData, 'value');
  if (!landValue) landValue = appendNsElement(landData, 'value');
  landValue.textContent = targetLandType.toUpperCase();
}

function updateGeometry(pmInfo, pm, targetGeom) {
  const points = pmInfo.rawCoords.trim() ? pmInfo.rawCoords.trim().split(/\s+/) : [];
  const altitude = pmInfo.altitudeMode;
  if (targetGeom === 'Polygon' && pmInfo.origType === 'LineString') {
    if (points.length && points[0] !== points[points.length - 1]) points.push(points[0]);
    const line = directChild(pm, 'LineString');
    if (line) line.remove();
    const polygon = appendNsElement(pm, 'Polygon');
    if (altitude) {
      const alt = appendNsElement(polygon, 'altitudeMode');
      alt.textContent = altitude;
    }
    const outer = appendNsElement(polygon, 'outerBoundaryIs');
    const ring = appendNsElement(outer, 'LinearRing');
    const coords = appendNsElement(ring, 'coordinates');
    coords.textContent = points.join(' ');
    return 1;
  }
  if (targetGeom === 'LineString' && pmInfo.origType === 'Polygon') {
    const polygon = directChild(pm, 'Polygon');
    if (polygon) polygon.remove();
    const line = appendNsElement(pm, 'LineString');
    if (altitude) {
      const alt = appendNsElement(line, 'altitudeMode');
      alt.textContent = altitude;
    }
    const coords = appendNsElement(line, 'coordinates');
    coords.textContent = pmInfo.rawCoords;
    return 1;
  }
  return 0;
}

function updateStyle(pm, targetGeom, targetColor) {
  let style = directChild(pm, 'Style');
  if (!style) style = appendNsElement(pm, 'Style');
  let lineStyle = directChild(style, 'LineStyle');
  if (!lineStyle) {
    lineStyle = appendNsElement(style, 'LineStyle');
    const width = appendNsElement(lineStyle, 'width');
    width.textContent = '3';
  }
  let lineColor = directChild(lineStyle, 'color');
  if (!lineColor) lineColor = appendNsElement(lineStyle, 'color');
  const bgr = hexToKmlBgr(targetColor);
  lineColor.textContent = `ff${bgr}`;
  let polyStyle = directChild(style, 'PolyStyle');
  if (targetGeom === 'Polygon') {
    if (!polyStyle) polyStyle = appendNsElement(style, 'PolyStyle');
    let polyColor = directChild(polyStyle, 'color');
    if (!polyColor) polyColor = appendNsElement(polyStyle, 'color');
    polyColor.textContent = `02${bgr}`;
  } else if (targetGeom === 'LineString' && polyStyle) {
    polyStyle.remove();
  }
}

function indentXml(element, level = 0, space = '  ') {
  const children = Array.from(element.childNodes);
  const elementChildren = children.filter(node => node.nodeType === Node.ELEMENT_NODE);
  if (!elementChildren.length) return;
  const hasRealText = children.some(node =>
    (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE) && node.nodeValue.trim()
  );
  if (hasRealText) return;
  const doc = element.ownerDocument;
  for (const node of children) if (node.nodeType === Node.TEXT_NODE) node.remove();
  const inner = `\n${space.repeat(level + 1)}`;
  for (const node of Array.from(element.childNodes)) {
    element.insertBefore(doc.createTextNode(inner), node);
    if (node.nodeType === Node.ELEMENT_NODE) indentXml(node, level + 1, space);
  }
  element.appendChild(doc.createTextNode(`\n${space.repeat(level)}`));
}

function serializeDocument(doc) {
  let xml = new XMLSerializer().serializeToString(doc);
  if (!/^\s*<\?xml/i.test(xml)) xml = `<?xml version="1.0" encoding="utf-8"?>\n${xml}`;
  return xml;
}

function downloadText(name, text) {
  const blob = new Blob([text], { type: 'application/vnd.google-earth.kml+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function outputBaseName() {
  return state.fileName.replace(/\.kml$/i, '') || 'output';
}

function saveKml(overwrite, options = {}) {
  const ruleMap = groupRuleMap();
  const xyzCfg = getXyzConfig();
  const applyXyz = Boolean(options.forceXyz || (xyzCfg.enabled && xyzCfg.hasOffset));
  const toDelete = new Set();
  state.placemarks.forEach((pm, index) => { if (isPlacemarkDeleted(pm, ruleMap)) toDelete.add(index); });
  const totalDeleted = toDelete.size;
  const remain = state.placemarks.length - totalDeleted;
  const saveName = overwrite
    ? state.fileName
    : (options.prefixChinhXyz || applyXyz)
      ? `chinh_XYZ_${state.fileName}`
      : `${outputBaseName()}_chuyen_doi.kml`;

  if (totalDeleted === state.placemarks.length) {
    if (!window.confirm('Bạn đang chọn XÓA TOÀN BỘ tất cả đối tượng trong file!\nBạn có chắc chắn muốn xóa hết không?')) return;
  } else if (totalDeleted > 0) {
    const message = `XÁC NHẬN LƯU & XÓA ĐỐI TƯỢNG:\n\n• Sẽ XÓA VĨNH VIỄN: ${totalDeleted.toLocaleString('en-US')} đối tượng\n• Số đối tượng còn lại: ${remain.toLocaleString('en-US')} đối tượng\n• Tải xuống: ${saveName}\n\nBạn có chắc chắn muốn tiến hành lưu không?`;
    if (!window.confirm(message)) return;
  }

  showBusy('Đang xử lý dữ liệu và chuẩn bị lưu file KML…');
  window.setTimeout(() => {
    try {
      const doc = parseXmlDocument(state.sourceText);
      const freshElements = descendantsByLocalName(doc, 'Placemark');
      if (freshElements.length !== state.placemarks.length) throw new Error('Không khớp số lượng Placemark khi chuẩn bị lưu.');
      let totalConverted = 0;
      let deletedActual = 0;
      for (let index = 0; index < state.placemarks.length; index += 1) {
        const pmInfo = state.placemarks[index];
        const element = freshElements[index];
        if (toDelete.has(index)) {
          if (element.parentNode) { element.parentNode.removeChild(element); deletedActual += 1; }
          continue;
        }
        const rule = ruleMap.get(keyFor(pmInfo.origType, pmInfo.color, pmInfo.landType));
        if (!rule || rule.locked) continue;
        updateExtendedData(element, rule.targetColor, rule.targetLt);
        totalConverted += updateGeometry(pmInfo, element, rule.targetGeom);
        updateStyle(element, rule.targetGeom, rule.targetColor);
      }

      let shiftedVertices = 0;
      if (applyXyz) {
        const coordElements = descendantsByLocalName(doc, 'coordinates');
        for (const coordEl of coordElements) {
          const res = shiftCoordinatesText(coordEl.textContent, xyzCfg);
          coordEl.textContent = res.text;
          shiftedVertices += res.shiftedTokens;
        }
      }

      if (remain <= 500) {
        try { indentXml(doc.documentElement); } catch (_) { /* bỏ qua như bản gốc */ }
      }
      const output = serializeDocument(doc);
      if (overwrite) downloadText(`${state.fileName}.bak`, state.sourceText);
      downloadText(saveName, output);
      hideBusy();
      const backupLine = overwrite ? `\n• Sao lưu an toàn: ${state.fileName}.bak` : '';
      const xyzLine = applyXyz
        ? `\n• Dịch chuyển XYZ: X ${formatSignedNumber(xyzCfg.dx)} (${xyzCfg.unit}), Y ${formatSignedNumber(xyzCfg.dy)} (${xyzCfg.unit}), Z ${formatSignedNumber(xyzCfg.dz)} mét (${shiftedVertices.toLocaleString('en-US')} đỉnh)`
        : '';
      notify(`Đã xử lý xong file KML.\n\n• Đã XÓA: ${deletedActual.toLocaleString('en-US')} đối tượng theo thuộc tính\n• Đã chuyển đổi / cập nhật: ${totalConverted.toLocaleString('en-US')} đối tượng\n• Còn lại trong file: ${remain.toLocaleString('en-US')} đối tượng${xyzLine}\n• Tải xuống: ${saveName}${backupLine}`, 'Thành công');
      setStatus('Đã lưu file KML thành công.');
    } catch (error) {
      hideBusy();
      notify(`Đã xảy ra lỗi: ${error.message || error}`, 'Lỗi khi lưu');
    }
  }, 20);
}

function readFileAsText(file) {
  if (typeof file.text === 'function') return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Không thể đọc file.'));
    reader.readAsText(file, 'utf-8');
  });
}

async function loadFile(file) {
  if (!file) return;
  showBusy('Đang đọc và phân tích file KML…');
  try {
    const text = await readFileAsText(file);
    const parsed = parseKml(text, file.name);
    state.file = file;
    state.fileName = file.name;
    state.sourceText = text;
    state.document = parsed.document;
    state.placemarks = parsed.placemarks;
    state.groups = parsed.groups;
    state.selectedDetail.clear();
    state.search = '';
    els.fileName.textContent = file.name;
    els.workspace.hidden = false;
    els.dropZone.hidden = true;
    els.detailSearch.value = '';
    refreshDataViews();
    setStatus(`Đọc thành công ${state.placemarks.length.toLocaleString('en-US')} Placemarks (${state.groups.length} nhóm).`);
    if (!state.placemarks.length) notify('Không tìm thấy đối tượng (Placemark) nào trong file KML.');
  } catch (error) {
    notify(error.message || String(error), 'Lỗi đọc KML');
  } finally {
    els.fileInput.value = '';
    hideBusy();
  }
}

function closeFile() {
  state.file = null;
  state.fileName = '';
  state.sourceText = '';
  state.document = null;
  state.placemarks = [];
  state.groups = [];
  state.groupControls = [];
  state.selectedDetail.clear();
  els.workspace.hidden = true;
  els.dropZone.hidden = false;
  els.fileInput.value = '';
  els.fileName.textContent = 'Chưa chọn tệp';
}

function wireEvents() {
  els.fileInput.addEventListener('click', () => {
    els.fileInput.value = '';
  });
  els.fileInput.addEventListener('change', event => {
    const file = event.target.files && event.target.files[0];
    if (file) loadFile(file);
  });
  for (const eventName of ['dragenter', 'dragover']) {
    els.dropZone.addEventListener(eventName, event => {
      event.preventDefault();
      els.dropZone.classList.add('dragover');
    });
  }
  for (const eventName of ['dragleave', 'drop']) {
    els.dropZone.addEventListener(eventName, event => {
      event.preventDefault();
      els.dropZone.classList.remove('dragover');
    });
  }
  window.addEventListener('dragover', event => event.preventDefault());
  window.addEventListener('drop', event => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) loadFile(file);
  });
  $$('.tab').forEach(tab => tab.addEventListener('click', () => activateTab(tab.dataset.tab)));
  const jumpXyzBtn = $('#jump-xyz-tab');
  if (jumpXyzBtn) jumpXyzBtn.addEventListener('click', () => activateTab('xyz'));

  $$('input[name="xyz-unit"]').forEach(radio => radio.addEventListener('change', () => {
    state.xyzTouched = true;
    if (els.xyzEnabled && getXyzConfig().hasOffset) els.xyzEnabled.checked = true;
    updateStats();
  }));
  [els.xyzDx, els.xyzDy, els.xyzDz].forEach(input => {
    if (!input) return;
    input.addEventListener('input', () => {
      state.xyzTouched = true;
      if (els.xyzEnabled && getXyzConfig().hasOffset) els.xyzEnabled.checked = true;
      updateStats();
    });
  });
  if (els.xyzEnabled) {
    els.xyzEnabled.addEventListener('change', () => {
      state.xyzTouched = true;
      updateStats();
    });
  }
  const xyzPresetBtn = $('#xyz-preset-default');
  if (xyzPresetBtn) {
    xyzPresetBtn.addEventListener('click', () => {
      const metRadio = $('input[name="xyz-unit"][value="met"]');
      if (metRadio) metRadio.checked = true;
      els.xyzDx.value = '-2';
      els.xyzDy.value = '1';
      els.xyzDz.value = '-2';
      els.xyzEnabled.checked = true;
      state.xyzTouched = true;
      updateStats();
      setCustomStatus('Đã đặt lại mẫu dịch chuyển mặc định: X = -2m, Y = +1m, Z = -2m.');
    });
  }
  const xyzResetBtn = $('#xyz-reset-zero');
  if (xyzResetBtn) {
    xyzResetBtn.addEventListener('click', () => {
      els.xyzDx.value = '0';
      els.xyzDy.value = '0';
      els.xyzDz.value = '0';
      els.xyzEnabled.checked = false;
      state.xyzTouched = true;
      const banner = $('#xyz-apply-banner');
      if (banner) banner.hidden = true;
      updateStats();
      setCustomStatus('Đã đặt độ lệch XYZ về 0 (tắt dịch chuyển tọa độ).');
    });
  }
  const xyzApplyBtn = $('#xyz-apply-session');
  if (xyzApplyBtn) {
    xyzApplyBtn.addEventListener('click', () => {
      const cfg = getXyzConfig();
      const banner = $('#xyz-apply-banner');
      els.xyzEnabled.checked = cfg.hasOffset;
      state.xyzTouched = true;
      updateStats();
      if (cfg.hasOffset) {
        const ruleMap = groupRuleMap();
        let keptObjects = 0;
        let totalVertices = 0;
        for (const pm of state.placemarks) {
          if (isPlacemarkDeleted(pm, ruleMap)) continue;
          keptObjects += 1;
          totalVertices += pm.coordsCount;
        }
        const summaryText = `X: ${formatSignedNumber(cfg.dx)} (${cfg.unit}) · Y: ${formatSignedNumber(cfg.dy)} (${cfg.unit}) · Z: ${formatSignedNumber(cfg.dz)} mét`;
        if (banner) {
          banner.innerHTML = `${ICONS.check}<span>Đã áp dụng vào phiên làm việc: <strong>${summaryText}</strong></span>`;
          banner.hidden = false;
        }
        setCustomStatus(`Đã áp dụng dịch chuyển XYZ (${summaryText}) cho tệp đang mở.`);
        showToast('Đã áp dụng tọa độ XYZ', summaryText);
        notify(
          `Đã áp dụng cấu hình dịch chuyển tọa độ XYZ vào phiên làm việc thành công!\n\n` +
          `• Tệp đang mở: ${state.fileName || '—'}\n` +
          `• Kinh độ (X): ${formatSignedNumber(cfg.dx)} (${cfg.unit})\n` +
          `• Vĩ độ (Y): ${formatSignedNumber(cfg.dy)} (${cfg.unit})\n` +
          `• Độ cao (Z): ${formatSignedNumber(cfg.dz)} mét\n` +
          `• Phạm vi áp dụng: ${keptObjects.toLocaleString('en-US')} đối tượng (${totalVertices.toLocaleString('en-US')} đỉnh tọa độ)\n\n` +
          `Bạn có thể chuyển qua các tab khác để chỉnh tiếp hoặc bấm Lưu file bất kỳ lúc nào.`,
          'Áp dụng XYZ thành công'
        );
      } else {
        if (banner) banner.hidden = true;
        setCustomStatus('Các thông số X, Y, Z đang bằng 0 (không dịch chuyển).');
        notify('Các thông số X, Y, Z hiện đang bằng 0 (không có độ lệch tọa độ nào để áp dụng).', 'Thông báo');
      }
    });
  }
  const xyzExportBtn = $('#xyz-export-now');
  if (xyzExportBtn) {
    xyzExportBtn.addEventListener('click', () => {
      if (els.xyzEnabled) els.xyzEnabled.checked = true;
      state.xyzTouched = true;
      updateStats();
      saveKml(false, { forceXyz: true, prefixChinhXyz: true });
    });
  }
  $('#all-to-polygon').addEventListener('click', () => batchSetGeometry('Polygon'));
  $('#all-to-line').addEventListener('click', () => batchSetGeometry('LineString'));
  $('#toggle-all-geometry').addEventListener('click', batchToggleGeometry);
  $('#unlock-all').addEventListener('click', () => batchLock(false));
  $('#lock-all').addEventListener('click', () => batchLock(true));
  $('#apply-batch-land-type').addEventListener('click', applyBatchLandType);
  $('#quick-delete').addEventListener('click', () => batchDeleteByLandType(els.quickDeleteLandType.value));
  $('#delete-all-lines').addEventListener('click', () => batchDeleteByGeometry('LineString'));
  $('#delete-all-polygons').addEventListener('click', () => batchDeleteByGeometry('Polygon'));
  $('#clear-delete').addEventListener('click', clearDelete);
  $('#open-filter').addEventListener('click', openFilter);
  $('#detail-search-button').addEventListener('click', () => { state.search = els.detailSearch.value; renderDetails(); });
  els.detailSearch.addEventListener('keydown', event => { if (event.key === 'Enter') { state.search = els.detailSearch.value; renderDetails(); } });
  $('#detail-show-all').addEventListener('click', () => { els.detailSearch.value = ''; state.search = ''; renderDetails(); });
  $('#mark-selected').addEventListener('click', () => markSelected(true));
  $('#unmark-selected').addEventListener('click', () => markSelected(false));
  $('#delete-search-results').addEventListener('click', deleteSearchResults);
  $('#save-overwrite').addEventListener('click', () => saveKml(true));
  $('#save-as').addEventListener('click', () => saveKml(false));
  $('#close-file').addEventListener('click', closeFile);
  $$('#close-filter, #close-filter-bottom').forEach(button => button.addEventListener('click', closeFilter));
  $$('#close-notify, #notify-ok').forEach(button => button.addEventListener('click', closeNotify));
  const notifyDlg = $('#notify-dialog');
  if (notifyDlg) {
    notifyDlg.addEventListener('click', event => {
      if (event.target === notifyDlg) closeNotify();
    });
  }
  $('#filter-mark').addEventListener('click', () => markFilterMatches(true));
  $('#filter-unmark').addEventListener('click', () => markFilterMatches(false));
  [els.filterGeometry, els.filterLandType, els.filterColor, els.filterName, els.filterPointsOp, els.filterPointsValue]
    .forEach(element => element.addEventListener('input', updateFilterMatched));
  document.addEventListener('click', event => { if (!els.contextMenu.hidden && !els.contextMenu.contains(event.target)) els.contextMenu.hidden = true; });
  wireLandTypeCombo(
    els.batchLandType,
    $('[data-combo-for="batch-land-type"]'),
    () => getAllLandCodeOptions(false)
  );
  wireLandTypeCombo(
    els.filterLandType,
    $('[data-combo-for="filter-land-type"]'),
    () => getAllLandCodeOptions(true)
  );
  wireLandTypeCombo(
    els.filterColor,
    $('[data-combo-for="filter-color"]'),
    () => getAllColorOptions()
  );
  document.addEventListener('mousedown', event => {
    if (activeComboPopup && !activeComboPopup.contains(event.target) && event.target !== activeComboInput) {
      closeComboPopup();
    }
  });
  window.addEventListener('scroll', event => {
    if (activeComboPopup && activeComboPopup.contains(event.target)) return;
    closeComboPopup();
  }, true);
  window.addEventListener('resize', () => {
    els.contextMenu.hidden = true;
    closeComboPopup();
  });
}

wireEvents();

async function initVisitorCounter() {
  const el = $('#visitor-count');
  if (!el) return;
  const storageKey = 'kml_tool_visitor_count';
  try {
    const res = await fetch('https://api.counterapi.dev/v1/nhatnguyen11111-kml-tool/visits/up', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.count === 'number') {
        localStorage.setItem(storageKey, String(data.count));
        el.textContent = data.count.toLocaleString('en-US');
        return;
      }
    }
  } catch (_) {
    // Fallback below when offline or blocked
  }
  try {
    const prev = Number.parseInt(localStorage.getItem(storageKey) || '0', 10);
    const next = (Number.isFinite(prev) ? prev : 0) + 1;
    localStorage.setItem(storageKey, String(next));
    el.textContent = next.toLocaleString('en-US');
  } catch (_) {
    el.textContent = '1';
  }
}

initVisitorCounter();
