// D:\CBXeVan\cycle_advisor.js
// Module Cảnh báo Chu kỳ Kiểm định Xe Tải VAN Cải tạo
// Căn cứ pháp lý: Thông tư số 30/2026/TT-BXD của Bộ Xây dựng
// Đơn vị phát triển: FYJ

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CycleAdvisor = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const BANNER_ID = 'cbxevan-cycle-banner';

  /**
   * Trích xuất thông tin phương tiện từ văn bản (PDF textLayer, DOM text hoặc URL)
   */
  function parseVehicleData(source) {
    const text = typeof source === 'string' ? source : (source?.innerText || source?.textContent || '');

    // 1. Biển số xe: 15D-033.25T, 15D-03325, 29B-123.45...
    const plateMatch = text.match(/(?:Biển\s*(?:đăng\s*ký|đk)|Registration\s*plate)[^:\n\r]*[:\s]+([0-9]{2}[A-Z]-?[0-9]+[\.0-9]*[A-Z]?)/i)
      || text.match(/(?:Số\s*GCN|Certificate)[^:\n\r]*[:\s]+([0-9]{2}[A-Z]-?[0-9]+[\.0-9]*[A-Z]?)/i)
      || text.match(/([0-9]{2}[A-Z]-?[0-9]{3,5}[\.0-9]*[A-Z]?)/i);
    const plate = plateMatch ? plateMatch[1].trim() : '';

    // 2. Loại phương tiện (Vehicle type)
    const typeMatch = text.match(/(?:Loại\s*phương\s*tiện|Vehicle\s*type)[^:\n\r]*[:\s]+([^\n\r]+)/i);
    const rawType = typeMatch ? typeMatch[1].trim() : '';
    const isVan = /tải\s*van|tải-van|\bvan\b/i.test(rawType) || /tải\s*van|tải-van|\bvan\b/i.test(text.substring(0, 3500));

    // 3. Có cải tạo (Modification)
    // Hỗ trợ nhận diện các ký hiệu: [x], [X], [✓], [v], "x", "X", "Có", "cải tạo"
    let isModified = false;
    const modMatch = text.match(/(?:Có\s*cải\s*tạo|Modification)[^:\n\r]*[:\s]+([^\n\r]+)/i);
    if (modMatch) {
      const val = modMatch[1].trim();
      isModified = /\[[xX✓v]\]|[xX✓v]|có/i.test(val) && !val.includes('[-]');
    } else {
      isModified = /Có\s*cải\s*tạo[^\n\r]*\[[xX✓v]\]/i.test(text) || /Có\s*cải\s*tạo[^\n\r]*\b[xX✓v]\b/i.test(text);
    }

    // 4. Năm sản xuất (Production year)
    const yearMatch = text.match(/(?:Năm\s*sản\s*xuất|Production\s*year)[^:\n\r\d]*[:\s]+(\d{4})/i);
    const prodYear = yearMatch ? parseInt(yearMatch[1], 10) : 0;

    // 5. Ngày kiểm định (Inspection date) -> Năm kiểm định
    const inspectMatch = text.match(/(?:Ngày\s*KĐ|Ngày\s*kiểm\s*định|Inspection\s*date)[^:\n\r\d]*[:\s]+(\d{1,2}\/\d{1,2}\/(\d{4}))/i);
    const inspectYear = inspectMatch ? parseInt(inspectMatch[1].split('/')[2], 10) : new Date().getFullYear();

    return {
      plate,
      rawType,
      isVan,
      isModified,
      prodYear,
      inspectYear,
    };
  }

  /**
   * Tính toán và đưa ra kết luận chu kỳ kiểm định theo Thông tư số 30/2026/TT-BXD
   */
  function calculateCycle(data) {
    if (!data || !data.isVan || !data.isModified || !data.prodYear || data.prodYear < 1900) {
      return {
        isTargetVan: false,
        reason: 'Không phải xe tải VAN cải tạo hoặc thiếu thông số năm sản xuất',
      };
    }

    const currentYear = data.inspectYear || new Date().getFullYear();
    const vehicleAge = currentYear - data.prodYear;

    let proposedMonths = 6;
    let severity = 'WARNING';
    let warningTitle = '⚠️ CẢNH BÁO CHU KỲ KIỂM ĐỊNH (TT 30/2026/TT-BXD)';
    let warningMessage = '';

    if (vehicleAge >= 15) {
      // Xe trên 15 năm tuổi cải tạo từ xe chở người >9 chỗ
      proposedMonths = 3;
      severity = 'DANGER';
      warningTitle = '🚨 CẢNH BÁO ĐẶC BIỆT: CHU KỲ BẮT BUỘC 03 THÁNG (TT 30/2026/TT-BXD)';
      warningMessage = `Xe tải VAN hoán cải từ xe khách >9 chỗ đã sản xuất từ 15 năm trở lên (Tuổi xe: ${vehicleAge} năm). Theo quy định Thông tư 30/2026/TT-BXD, chu kỳ kiểm định định kỳ BẮT BUỘC là 03 THÁNG. Tuyệt đối không áp chu kỳ 06 tháng như xe tải thường!`;
    } else if (vehicleAge > 5) {
      // Xe trên 5 năm đến dưới 15 năm
      proposedMonths = 6;
      severity = 'WARNING';
      warningTitle = '⚠️ NHẮC CHU KỲ KIỂM ĐỊNH (TT 30/2026/TT-BXD)';
      warningMessage = `Xe tải VAN hoán cải từ xe khách (Tuổi xe: ${vehicleAge} năm). Đề xuất chu kỳ kiểm định định kỳ là 06 THÁNG.`;
    } else {
      // Xe đến 5 năm
      proposedMonths = 12;
      severity = 'INFO';
      warningTitle = 'ℹ️ THÔNG TIN CHU KỲ KIỂM ĐỊNH (TT 30/2026/TT-BXD)';
      warningMessage = `Xe tải VAN hoán cải từ xe khách (Tuổi xe: ${vehicleAge} năm). Đề xuất chu kỳ kiểm định định kỳ là 12 THÁNG (Chu kỳ đầu 24 tháng nếu lần đầu).`;
    }

    return {
      isTargetVan: true,
      plate: data.plate || 'Chưa rõ biển số',
      prodYear: data.prodYear,
      inspectYear: currentYear,
      vehicleAge,
      proposedMonths,
      severity,
      warningTitle,
      warningMessage,
    };
  }

  /**
   * Tạo chuỗi HTML giao diện Light Mode tương phản cao, chữ to rõ nét
   */
  function buildBannerHtml(result) {
    if (!result || !result.isTargetVan) return '';

    const isDanger = result.severity === 'DANGER';
    const borderColor = isDanger ? '#dc3545' : '#ffc107';
    const bgColor = '#fff3cd'; // Light Mode nền vàng ấm tương phản cao
    const titleColor = isDanger ? '#b02a37' : '#856404';
    const badgeBg = isDanger ? '#dc3545' : '#e0a800';

    return `
      <div id="${BANNER_ID}" class="cbxevan-banner-container" style="
        position: fixed;
        top: 12px;
        left: 50%;
        transform: translateX(-50%);
        width: calc(100% - 32px);
        max-width: 1050px;
        background: ${bgColor};
        border: 3px solid ${borderColor};
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.25);
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #212529;
        padding: 14px 20px;
        box-sizing: border-box;
      ">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 14px;">
          <div style="flex: 1;">
            <div style="font-size: 17px; font-weight: 800; color: ${titleColor}; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
              <span>${result.warningTitle}</span>
            </div>
            
            <div style="font-size: 14.5px; font-weight: 600; color: #1c2434; margin-bottom: 8px;">
              Phương tiện: <span style="color: #b02a37; font-weight: 800; font-size: 15.5px;">${result.plate}</span> 
              | Năm SX: <span style="font-weight: 800;">${result.prodYear}</span> 
              | Tuổi xe: <span style="font-weight: 800; color: ${isDanger ? '#b02a37' : '#1c2434'}; font-size: 15px;">${result.vehicleAge} năm</span>
              ${isDanger ? ' <span style="color: #b02a37; font-weight: 800;">(≥ 15 năm)</span>' : ''}
            </div>

            <div style="
              display: inline-block;
              background: ${badgeBg};
              color: #ffffff;
              font-size: 18px;
              font-weight: 900;
              padding: 5px 14px;
              border-radius: 6px;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            ">
              ➜ ĐỀ XUẤT CHU KỲ: 0${result.proposedMonths} THÁNG
            </div>

            <div style="font-size: 14px; font-weight: 600; line-height: 1.45; color: #2b3035;">
              ${result.warningMessage}
            </div>
          </div>

          <button id="btn-close-cbxevan-banner" style="
            background: #ffffff;
            border: 2px solid ${borderColor};
            color: ${borderColor};
            font-size: 15px;
            font-weight: bold;
            padding: 6px 14px;
            border-radius: 6px;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s ease;
          " onmouseover="this.style.background='${borderColor}';this.style.color='#fff';" onmouseout="this.style.background='#fff';this.style.color='${borderColor}';">
            ✕ Đóng
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Hiển thị banner vào giao diện trang web
   */
  function renderWarningBanner(result) {
    if (typeof document === 'undefined') return;

    const existing = document.getElementById(BANNER_ID);
    if (!result || !result.isTargetVan) {
      if (existing) existing.remove();
      return;
    }

    if (existing) {
      if (existing.dataset.plate === result.plate && existing.dataset.months == result.proposedMonths) {
        return; // Đã hiển thị đúng xe và chu kỳ, không render lại để tránh nhấp nháy
      }
      existing.remove();
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = buildBannerHtml(result).trim();
    const bannerEl = wrapper.firstElementChild;
    if (!bannerEl) return;

    bannerEl.dataset.plate = result.plate;
    bannerEl.dataset.months = result.proposedMonths;

    document.body.appendChild(bannerEl);

    const closeBtn = document.getElementById('btn-close-cbxevan-banner');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        bannerEl.remove();
      });
    }

    // Lưu vào chrome.storage để popup hiển thị xe gần nhất
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({
          CBXEVAN_LAST_RESULT: {
            ...result,
            detectedAt: new Date().toLocaleString('vi-VN')
          }
        });
      }
    } catch (e) {}
  }

  /**
   * Tự động quét context (DOM hoặc text) và kích hoạt hiển thị
   */
  function scanAndAlert(context) {
    if (typeof document === 'undefined') return null;
    const rootEl = context || document.body;
    if (!rootEl) return null;

    const parsed = parseVehicleData(rootEl);
    const result = calculateCycle(parsed);
    if (result.isTargetVan) {
      renderWarningBanner(result);
    }
    return result;
  }

  return {
    BANNER_ID,
    parseVehicleData,
    calculateCycle,
    buildBannerHtml,
    renderWarningBanner,
    scanAndAlert,
  };
});
