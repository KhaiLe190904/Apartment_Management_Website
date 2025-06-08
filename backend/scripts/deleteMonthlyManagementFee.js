const mongoose = require('mongoose');
const Payment = require('../models/paymentModel');
const Fee = require('../models/feeModel');

// Load environment variables
require('dotenv').config();

async function deleteMonthlyManagementFee() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bluemoon_apartment', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('🔌 Đã kết nối đến MongoDB');

    // Tìm phí quản lý hàng tháng
    const monthlyFee = await Fee.findOne({ feeCode: 'PHI001' });
    
    if (!monthlyFee) {
      console.log('❌ Không tìm thấy "Phí quản lý hàng tháng" (PHI001)');
      return;
    }

    console.log(`📋 Tìm thấy phí: ${monthlyFee.name} (${monthlyFee.feeCode})`);
    console.log(`💰 Giá: ${monthlyFee.amount.toLocaleString()} VND`);

    // Đếm số thanh toán liên quan
    const relatedPayments = await Payment.countDocuments({ fee: monthlyFee._id });
    console.log(`📊 Số thanh toán liên quan: ${relatedPayments}`);

    if (relatedPayments > 0) {
      // Thống kê các thanh toán trước khi xóa
      const paidCount = await Payment.countDocuments({ fee: monthlyFee._id, status: 'paid' });
      const pendingCount = await Payment.countDocuments({ fee: monthlyFee._id, status: 'pending' });
      const overdueCount = await Payment.countDocuments({ fee: monthlyFee._id, status: 'overdue' });
      
      const totalRevenue = await Payment.aggregate([
        { $match: { fee: monthlyFee._id, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      console.log(`\n📊 Thống kê thanh toán sẽ bị xóa:`);
      console.log(`   ✅ Đã thanh toán: ${paidCount}`);
      console.log(`   ⏳ Chờ thanh toán: ${pendingCount}`);
      console.log(`   ❌ Quá hạn: ${overdueCount}`);
      console.log(`   💵 Tổng doanh thu sẽ mất: ${(totalRevenue[0]?.total || 0).toLocaleString()} VND`);

      // Xóa tất cả thanh toán liên quan
      console.log(`\n🗑️ Đang xóa ${relatedPayments} thanh toán liên quan...`);
      const deletePaymentsResult = await Payment.deleteMany({ fee: monthlyFee._id });
      console.log(`✅ Đã xóa ${deletePaymentsResult.deletedCount} thanh toán`);
    }

    // Xóa phí
    console.log(`\n🗑️ Đang xóa phí "${monthlyFee.name}"...`);
    const deleteFeeResult = await Fee.findByIdAndDelete(monthlyFee._id);
    
    if (deleteFeeResult) {
      console.log(`✅ Đã xóa phí: ${deleteFeeResult.name} (${deleteFeeResult.feeCode})`);
    } else {
      console.log(`❌ Không thể xóa phí`);
    }

    // Kiểm tra kết quả
    const remainingFee = await Fee.findOne({ feeCode: 'PHI001' });
    const remainingPayments = await Payment.countDocuments({ fee: monthlyFee._id });

    console.log(`\n📊 Kết quả kiểm tra:`);
    console.log(`   📋 Phí PHI001 còn lại: ${remainingFee ? 'CÒN' : 'KHÔNG CÒN'}`);
    console.log(`   💳 Thanh toán liên quan còn lại: ${remainingPayments}`);

    // Hiển thị danh sách phí còn lại
    console.log(`\n📋 Danh sách phí còn lại:`);
    const remainingFees = await Fee.find({}).sort({ feeCode: 1 });
    
    for (const fee of remainingFees) {
      const paymentCount = await Payment.countDocuments({ fee: fee._id });
      console.log(`   - ${fee.feeCode}: ${fee.name} (${paymentCount} thanh toán)`);
    }

    // Thống kê tổng quan sau khi xóa
    const totalPayments = await Payment.countDocuments({});
    const totalFees = await Fee.countDocuments({});
    
    console.log(`\n🏆 Thống kê sau khi xóa:`);
    console.log(`   📋 Tổng số phí: ${totalFees}`);
    console.log(`   💳 Tổng số thanh toán: ${totalPayments}`);

  } catch (error) {
    console.error('❌ Lỗi khi xóa phí quản lý hàng tháng:', error);
    throw error;
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\n🔌 Đã đóng kết nối MongoDB');
  }
}

// Run the script
deleteMonthlyManagementFee()
  .then(() => {
    console.log('\n✅ Hoàn thành việc xóa "Phí quản lý hàng tháng"!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }); 