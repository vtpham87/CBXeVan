// D:\CBXeVan\content.js
// Content Script cho Tiện ích CBXeVan
// Tự động theo dõi trang và kích hoạt cảnh báo khi mở xe tải VAN cải tạo

(function () {
  'use strict';

  if (typeof CycleAdvisor === 'undefined') {
    console.warn('[CBXeVan] CycleAdvisor chưa sẵn sàng.');
    return;
  }

  const isTopWindow = (window === window.top);

  /**
   * Gom toàn bộ nội dung văn bản từ document chính và các iframe con (cùng origin)
   */
  function gatherAllPageText() {
    let text = document.body ? (document.body.innerText || '') : '';

    // Quét thêm qua các iframe xem trước PDF hoặc form nhúng
    try {
      const iframes = document.querySelectorAll('iframe');
      for (const iframe of iframes) {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc && doc.body) {
            text += '\n' + (doc.body.innerText || '');
          }
        } catch (err) {
          // Bỏ qua cross-origin iframe
        }
      }
    } catch (e) {}

    return text;
  }

  let lastScanTime = 0;
  function triggerScan() {
    const now = Date.now();
    if (now - lastScanTime < 450) return; // Debounce 450ms
    lastScanTime = now;

    try {
      const allText = gatherAllPageText();
      const parsed = CycleAdvisor.parseVehicleData(allText);
      const result = CycleAdvisor.calculateCycle(parsed);

      if (result && result.isTargetVan) {
        if (isTopWindow) {
          CycleAdvisor.renderWarningBanner(result);
          // Gửi thông báo đến background để cập nhật badge
          try {
            chrome.runtime.sendMessage({
              action: 'VEHICLE_DETECTED',
              months: result.proposedMonths,
              severity: result.severity,
              plate: result.plate
            }).catch(() => {});
          } catch (e) {}
        } else {
          // Đang ở trong iframe, báo cho window.top hiển thị banner
          try {
            window.top.postMessage({
              source: 'CBXEVAN_IFRAME_DETECTED',
              result: result
            }, '*');
          } catch (e) {
            // Nếu không postMessage được thì render trực tiếp trong iframe
            CycleAdvisor.renderWarningBanner(result);
          }
        }
      }
    } catch (err) {
      console.warn('[CBXeVan] Lỗi trong quá trình quét trang:', err);
    }
  }

  // Lắng nghe postMessage từ iframe con gửi lên window.top
  if (isTopWindow) {
    window.addEventListener('message', function (event) {
      if (event.data && event.data.source === 'CBXEVAN_IFRAME_DETECTED' && event.data.result) {
        CycleAdvisor.renderWarningBanner(event.data.result);
      }
    });
  }

  // 1. Quét ngay khi trang tải xong
  triggerScan();

  // 2. Lắng nghe thay đổi DOM (MutationObserver) hỗ trợ Angular SPA / PDF textLayer
  if (document.body) {
    const observer = new MutationObserver(function () {
      triggerScan();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // 3. Quét định kỳ bổ trợ trong 15 giây đầu khi xem trước GCN
  let scanCount = 0;
  const intervalId = setInterval(function () {
    scanCount++;
    triggerScan();
    if (scanCount >= 10) {
      clearInterval(intervalId);
    }
  }, 1500);

  // 4. Lắng nghe lệnh quét lại từ Popup
  try {
    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
      if (msg && msg.action === 'RESCAN') {
        triggerScan();
        sendResponse({ ok: true });
      }
    });
  } catch (e) {}

  console.log('[CBXeVan] Đã khởi động giám sát xe tải VAN cải tạo (TT 30/2026/TT-BXD).');
})();
