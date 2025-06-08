const mongoose = require('mongoose');
const areaBasedFeeService = require('../services/areaBasedFeeService');

// Load environment variables
require('dotenv').config();

async function testAreaBasedFees() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bluemoon_apartment', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('🔌 Đã kết nối đến MongoDB');

    // Test 1: Lấy thống kê
    console.log('\n📊 Test 1: Lấy thống kê phí theo diện tích');
    console.log('='.repeat(60));
    
    const statistics = await areaBasedFeeService.getAreaBasedFeeStatistics();
    
    console.log(`🏠 Tổng hộ gia đình: ${statistics.totalHouseholds}`);
    console.log(`📐 Tổng diện tích: ${statistics.totalArea} m²`);
    console.log(`💰 Phí hàng tháng: ${statistics.totalMonthlyFees.toLocaleString()} VND`);
    console.log(`📊 Diện tích trung bình: ${statistics.avgArea} m²`);
    
    console.log('\n📋 Chi tiết phí theo loại:');
    for (const [feeCode, feeInfo] of Object.entries(statistics.feeBreakdown)) {
      console.log(`  - ${feeCode}: ${feeInfo.name}`);
      console.log(`    💰 Đơn giá: ${feeInfo.unitPrice.toLocaleString()} VND/m²`);
      console.log(`    📐 Tổng diện tích: ${feeInfo.totalArea} m²`);
      console.log(`    💵 Tổng phí: ${feeInfo.totalAmount.toLocaleString()} VND`);
    }

    console.log('\n📊 Thống kê tháng gần nhất:');
    const currentStats = statistics.currentMonthStats;
    if (currentStats.period) {
      console.log(`  📅 Kỳ: ${currentStats.period.toLocaleDateString('vi-VN')}`);
      console.log(`  📈 Tổng thanh toán: ${currentStats.totalPayments}`);
      console.log(`  ✅ Đã thanh toán: ${currentStats.paidPayments}`);
      console.log(`  ⏳ Chờ thanh toán: ${currentStats.pendingPayments}`);
      console.log(`  ❌ Quá hạn: ${currentStats.overduePayments}`);
      console.log(`  💵 Doanh thu: ${currentStats.totalRevenue.toLocaleString()} VND`);
      console.log(`  📊 Tỷ lệ thu: ${currentStats.collectionRate}%`);
    } else {
      console.log('  ❌ Chưa có dữ liệu thanh toán');
    }

    // Test 2: Tính phí cho tất cả hộ gia đình
    console.log('\n🏠 Test 2: Tính phí cho tất cả hộ gia đình');
    console.log('='.repeat(60));
    
    const calculations = await areaBasedFeeService.calculateAreaBasedFeesForAllHouseholds();
    
    console.log(`📊 Tổng số hộ tính được: ${calculations.length}`);
    console.log(`💰 Tổng phí tất cả hộ: ${calculations.reduce((sum, calc) => sum + calc.totalAmount, 0).toLocaleString()} VND`);
    
    // Hiển thị 5 hộ đầu tiên
    console.log('\n📋 5 hộ gia đình đầu tiên:');
    calculations.slice(0, 5).forEach((calc, index) => {
      console.log(`  ${index + 1}. Căn hộ ${calc.apartmentNumber}:`);
      console.log(`     📐 Diện tích: ${calc.area} m²`);
      console.log(`     💰 Tổng phí: ${calc.totalAmount.toLocaleString()} VND`);
      calc.feeDetails.forEach(detail => {
        console.log(`     - ${detail.feeName}: ${detail.amount.toLocaleString()} VND (${detail.unitPrice.toLocaleString()} VND/m²)`);
      });
    });

    // Test 3: Thống kê theo diện tích
    console.log('\n📊 Test 3: Phân tích theo diện tích');
    console.log('='.repeat(60));
    
    const areaGroups = {
      'Nhỏ (< 60m²)': calculations.filter(c => c.area < 60),
      'Trung bình (60-80m²)': calculations.filter(c => c.area >= 60 && c.area <= 80),
      'Lớn (> 80m²)': calculations.filter(c => c.area > 80)
    };

    for (const [group, households] of Object.entries(areaGroups)) {
      const avgArea = households.length > 0 ? 
        Math.round(households.reduce((sum, h) => sum + h.area, 0) / households.length) : 0;
      const avgFee = households.length > 0 ? 
        Math.round(households.reduce((sum, h) => sum + h.totalAmount, 0) / households.length) : 0;
        
      console.log(`  ${group}:`);
      console.log(`    📊 Số lượng: ${households.length} hộ`);
      console.log(`    📐 Diện tích TB: ${avgArea} m²`);
      console.log(`    💰 Phí TB: ${avgFee.toLocaleString()} VND`);
    }

  } catch (error) {
    console.error('❌ Lỗi test:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Đã đóng kết nối MongoDB');
  }
}

// Run the test
testAreaBasedFees()
  .then(() => {
    console.log('\n✅ Hoàn thành test phí theo diện tích!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }); 