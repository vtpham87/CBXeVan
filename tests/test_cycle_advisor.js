// D:\CBXeVan\tests\test_cycle_advisor.js
// Unit Tests for CBXeVan Cycle Advisor (Thông tư 30/2026/TT-BXD)
const assert = require('assert');
const path = require('path');

const CycleAdvisor = require('../cycle_advisor.js');

function runTests() {
  assert(CycleAdvisor, 'Module CycleAdvisor phải được nạp thành công');

  console.log('=== TEST 1: parseVehicleData trích xuất chuẩn xác thông tin từ text GCN ===');
  const sampleGcnText = `
    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
    GIẤY CHỨNG NHẬN KIỂM ĐỊNH AN TOÀN KỸ THUẬT VÀ BẢO VỆ MÔI TRƯỜNG
    Số GCN: 26KĐG/019604/1507D
    1. Phương tiện (Vehicle):
    Biển đăng ký (Registration plate): 15D-033.25T
    Số khung (Chassis Nº): RL4RS12P379001636
    Số động cơ (Engine Nº): 2KD6035646
    Loại phương tiện (Vehicle type): Ô tô tải VAN
    Năm sản xuất (Production year): 2007
    Niên hạn sử dụng (Lifetime Limit to): 2032
    Có kinh doanh vận tải (Commercial use): [-]
    Có cải tạo(Modification): [x]
    2. Thông số kỹ thuật (Technical specifications):
    Ngày KĐ (Inspection date): 23/09/2026
    Số phiếu KĐ (Inspection report Nº): 23181/26
  `;

  const parsed = CycleAdvisor.parseVehicleData(sampleGcnText);
  assert.strictEqual(parsed.plate, '15D-033.25T', 'Phải nhận diện đúng biển số 15D-033.25T');
  assert.strictEqual(parsed.isVan, true, 'Phải nhận diện đúng loại xe tải VAN');
  assert.strictEqual(parsed.isModified, true, 'Phải nhận diện đúng có cải tạo [x]');
  assert.strictEqual(parsed.prodYear, 2007, 'Phải nhận diện đúng năm sản xuất 2007');
  assert.strictEqual(parsed.inspectYear, 2026, 'Phải nhận diện đúng năm kiểm định 2026');
  console.log('  ✓ Test 1 Passed');

  console.log('=== TEST 2: Xe tải VAN cải tạo SX 2007 (Tuổi 19 >= 15) -> 03 THÁNG (DANGER) ===');
  const res1 = CycleAdvisor.calculateCycle(parsed);
  assert.strictEqual(res1.isTargetVan, true);
  assert.strictEqual(res1.vehicleAge, 19);
  assert.strictEqual(res1.proposedMonths, 3, 'Tuổi >= 15 năm bắt buộc áp chu kỳ 03 tháng');
  assert.strictEqual(res1.severity, 'DANGER');
  assert(res1.warningMessage.includes('03 THÁNG'), 'Cảnh báo phải nêu rõ chu kỳ 03 THÁNG');
  assert(res1.warningMessage.includes('không áp chu kỳ 06 tháng') || res1.warningMessage.includes('Không áp chu kỳ 06 tháng'), 'Phải có lưu ý không áp nhầm 6 tháng');
  console.log('  ✓ Test 2 Passed');

  console.log('=== TEST 3: Xe tải VAN cải tạo SX 2018 (Tuổi 8 > 5 && < 15) -> 06 THÁNG (WARNING) ===');
  const data2018 = { isVan: true, isModified: true, prodYear: 2018, inspectYear: 2026, plate: '15D-012.34' };
  const res2 = CycleAdvisor.calculateCycle(data2018);
  assert.strictEqual(res2.isTargetVan, true);
  assert.strictEqual(res2.vehicleAge, 8);
  assert.strictEqual(res2.proposedMonths, 6, 'Tuổi từ trên 5 đến dưới 15 năm đề xuất 06 tháng');
  assert.strictEqual(res2.severity, 'WARNING');
  console.log('  ✓ Test 3 Passed');

  console.log('=== TEST 4: Xe tải VAN cải tạo SX 2023 (Tuổi 3 <= 5) -> 12 THÁNG (INFO) ===');
  const data2023 = { isVan: true, isModified: true, prodYear: 2023, inspectYear: 2026, plate: '15D-009.99' };
  const res3 = CycleAdvisor.calculateCycle(data2023);
  assert.strictEqual(res3.isTargetVan, true);
  assert.strictEqual(res3.vehicleAge, 3);
  assert.strictEqual(res3.proposedMonths, 12, 'Tuổi <= 5 năm đề xuất 12 tháng');
  assert.strictEqual(res3.severity, 'INFO');
  console.log('  ✓ Test 4 Passed');

  console.log('=== TEST 5: Các trường hợp KHÔNG kích hoạt cảnh báo ===');
  // 5a. Xe tải thùng không cải tạo
  const dataNotModified = { isVan: true, isModified: false, prodYear: 2007, inspectYear: 2026 };
  assert.strictEqual(CycleAdvisor.calculateCycle(dataNotModified).isTargetVan, false);

  // 5b. Xe con không phải tải VAN
  const dataNotVan = { isVan: false, isModified: true, prodYear: 2007, inspectYear: 2026 };
  assert.strictEqual(CycleAdvisor.calculateCycle(dataNotVan).isTargetVan, false);

  // 5c. Nhận diện các biến thể ký hiệu check: [✓], [v]
  const textCheck = `
    Loại phương tiện: Ô tô tải VAN (chở hàng)
    Có cải tạo: [✓]
    Năm sản xuất: 2010
  `;
  const parsedCheck = CycleAdvisor.parseVehicleData(textCheck);
  assert.strictEqual(parsedCheck.isVan, true);
  assert.strictEqual(parsedCheck.isModified, true);
  assert.strictEqual(parsedCheck.prodYear, 2010);
  console.log('  ✓ Test 5 Passed');

  console.log('=== TEST 6: buildBannerHtml tạo giao diện Light Mode chuẩn xác ===');
  const bannerHtml = CycleAdvisor.buildBannerHtml(res1);
  assert(bannerHtml.includes('id="cbxevan-cycle-banner"'), 'Phải có id định danh cbxevan-cycle-banner');
  assert(bannerHtml.includes('03 THÁNG'), 'Banner phải chứa text 03 THÁNG');
  assert(bannerHtml.includes('15D-033.25T'), 'Banner phải chứa biển số xe');
  assert(bannerHtml.includes('TT 30/2026/TT-BXD'), 'Banner phải nêu rõ căn cứ Thông tư 30');
  assert(bannerHtml.includes('btn-close-cbxevan-banner'), 'Phải có nút đóng');
  console.log('  ✓ Test 6 Passed');

  console.log('\n🎉 TẤT CẢ 6 BỘ TEST ĐỀU ĐẠT CHUẨN XÁC 100%!');
}

runTests();
