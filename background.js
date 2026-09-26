// D:\CBXeVan\background.js
// Service Worker cho Tiện ích CBXeVan

chrome.runtime.onInstalled.addListener(function (details) {
  console.log('[CBXeVan] Extension đã được cài đặt/cập nhật phiên bản:', details.reason);
});

// Lắng nghe thông điệp từ Content Script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message && message.action === 'VEHICLE_DETECTED') {
    const tabId = sender.tab ? sender.tab.id : null;
    if (tabId) {
      const badgeText = message.months ? `0${message.months}T` : 'VAN';
      chrome.action.setBadgeText({ text: badgeText, tabId: tabId });

      let badgeBg = '#ffc107'; // Vàng
      if (message.severity === 'DANGER') {
        badgeBg = '#dc3545'; // Đỏ
      } else if (message.severity === 'INFO') {
        badgeBg = '#0d6efd'; // Xanh
      }
      chrome.action.setBadgeBackgroundColor({ color: badgeBg, tabId: tabId });
    }
  }
  return true;
});

// Xóa badge khi chuyển URL tab
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({ text: '', tabId: tabId });
  }
});
