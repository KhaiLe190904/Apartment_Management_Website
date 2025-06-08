const mongoose = require('mongoose');
const Payment = require('../models/paymentModel');

// Load environment variables
require('dotenv').config();

async function cleanTestPayments() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bluemoon_apartment', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('🔌 Đã kết nối đến MongoDB');

    // Đếm tổng số thanh toán trước khi xóa
    const totalBefore = await Payment.countDocuments();
    console.log(`📊 Tổng số thanh toán trước khi xóa: ${totalBefore}`);

    // Xóa thanh toán có receipt number bắt đầu với AF (Area Fee - phí dịch vụ & chung cư)
    const areaFeeResult = await Payment.deleteMany({
      receiptNumber: { $regex: '^AF' }
    });
    console.log(`🏢 Đã xóa ${areaFeeResult.deletedCount} thanh toán phí dịch vụ & chung cư (AF)`);

    // Xóa thanh toán có receipt number bắt đầu với VF (Vehicle Fee - phí xe)  
    const vehicleFeeResult = await Payment.deleteMany({
      receiptNumber: { $regex: '^VF' }
    });
    console.log(`🚗 Đã xóa ${vehicleFeeResult.deletedCount} thanh toán phí xe (VF)`);

    // Xóa thanh toán trong tháng 6/2025 (các thanh toán test)
    const june2025Result = await Payment.deleteMany({
      $or: [
        {
          paymentDate: {
            $gte: new Date('2025-06-01'),
            $lt: new Date('2025-07-01')
          }
        },
        {
          period: {
            $gte: new Date('2025-06-01'),
            $lt: new Date('2025-07-01')
          }
        }
      ]
    });
    console.log(`📅 Đã xóa ${june2025Result.deletedCount} thanh toán tháng 6/2025`);

    // Đếm tổng số thanh toán sau khi xóa
    const totalAfter = await Payment.countDocuments();
    console.log(`\n📊 Tổng số thanh toán sau khi xóa: ${totalAfter}`);
    console.log(`🗑️  Tổng cộng đã xóa: ${totalBefore - totalAfter} thanh toán`);

    console.log('\n✅ Hoàn thành việc dọn dẹp dữ liệu thanh toán test!');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('🔌 Đã đóng kết nối MongoDB');
  }
}

// Chạy script
cleanTestPayments(); 