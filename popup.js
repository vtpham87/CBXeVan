// D:\CBXeVan\popup.js
// Xử lý giao diện Popup cho Tiện ích CBXeVan

document.addEventListener('DOMContentLoaded', function () {
  const lastDetectedEl = document.getElementById('last-detected-content');
  const btnCalc = document.getElementById('btn-quick-calc');
  const calcResultEl = document.getElementById('quick-calc-result');
  const btnRescan = document.getElementById('btn-rescan-tab');

  // 1. Tải kết quả phát hiện gần nhất từ storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['CBXEVAN_LAST_RESULT'], function (res) {
      if (res && res.CBXEVAN_LAST_RESULT) {
        const item = res.CBXEVAN_LAST_RESULT;
        const isDanger = item.severity === 'DANGER';
        const badgeClass = isDanger ? 'danger' : (item.severity === 'WARNING' ? 'warning' : 'info');

        lastDetectedEl.innerHTML = `
          <div class="detected-item">
            <div class="detected-plate">${item.plate || 'Chưa rõ biển'}</div>
            <div>Năm SX: <b>${item.prodYear}</b> | Tuổi xe: <b style="color:${isDanger ? '#b02a37' : '#1c2434'}">${item.vehicleAge} năm</b></div>
            <div class="cycle-badge ${badgeClass}">➜ ĐỀ XUẤT: 0${item.proposedMonths} THÁNG</div>
            <div style="font-size: 11.5px; color: #6c757d; margin-top: 4px;">Thời điểm phát hiện: ${item.detectedAt || 'Vừa xong'}</div>
          </div>
        `;
      }
    });
  }

  // 2. Tính toán nhanh chu kỳ
  btnCalc.addEventListener('click', function () {
    const prodYear = parseInt(document.getElementById('input-prod-year').value, 10);
    const inspectYear = parseInt(document.getElementById('input-inspect-year').value, 10) || new Date().getFullYear();

    if (!prodYear || prodYear < 1980 || prodYear > 2040) {
      alert('Vui lòng nhập năm sản xuất hợp lệ (VD: 2008)!');
      return;
    }

    const age = inspectYear - prodYear;
    let months = 6;
    let sev = 'WARNING';
    let note = '';

    if (age >= 15) {
      months = 3;
      sev = 'DANGER';
      note = 'Xe ≥ 15 năm hoán cải từ xe khách >9 chỗ: Bắt buộc áp chu kỳ 03 THÁNG theo TT 30/2026/TT-BXD. Tuyệt đối không cấp 06 tháng!';
    } else if (age > 5) {
      months = 6;
      sev = 'WARNING';
      note = 'Xe từ trên 5 đến dưới 15 năm hoán cải từ xe khách: Đề xuất chu kỳ định kỳ 06 THÁNG.';
    } else {
      months = 12;
      sev = 'INFO';
      note = 'Xe đến 5 năm hoán cải từ xe khách: Đề xuất chu kỳ định kỳ 12 THÁNG.';
    }

    const badgeBg = sev === 'DANGER' ? '#dc3545' : (sev === 'WARNING' ? '#e0a800' : '#0d6efd');
    const borderCol = sev === 'DANGER' ? '#f5c2c7' : (sev === 'WARNING' ? '#ffecb5' : '#b6d4fe');
    const boxBg = sev === 'DANGER' ? '#f8d7da' : (sev === 'WARNING' ? '#fff3cd' : '#cfe2ff');

    calcResultEl.style.display = 'block';
    calcResultEl.style.background = boxBg;
    calcResultEl.style.borderColor = borderCol;
    calcResultEl.innerHTML = `
      <div style="font-weight: 700; color: #212529;">Tuổi xe: <b>${age} năm</b> (${prodYear} ➜ ${inspectYear})</div>
      <div style="margin: 6px 0;">
        <span style="background: ${badgeBg}; color: #fff; font-weight: 800; padding: 4px 10px; border-radius: 4px; font-size: 14px;">
          ➜ CHU KỲ: 0${months} THÁNG
        </span>
      </div>
      <div style="font-size: 12px; color: #333; line-height: 1.35;">${note}</div>
    `;
  });

  // 3. Yêu cầu content script quét lại tab hiện tại
  btnRescan.addEventListener('click', function () {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'RESCAN' }, function (resp) {
            btnRescan.innerText = '✓ Đã kích hoạt quét!';
            setTimeout(function () {
              btnRescan.innerText = '🔄 Quét lại tab này';
            }, 1800);
          });
        }
      });
    }
  });
});
