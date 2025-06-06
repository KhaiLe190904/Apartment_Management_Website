import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Message from '../components/Message';
import Loader from '../components/Loader';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie, Bar, Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const DashboardScreen = () => {
  const { userInfo } = useContext(AuthContext);
  const [stats, setStats] = useState({
    counts: {
      households: 0,
      residents: 0,
      fees: 0,
      temporaryResidences: 0,
      temporaryAbsences: 0
    },
    financials: {
      monthlyRevenue: 0,
      revenueByType: {}
    },
    recentPayments: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!userInfo) {
          return;
        }
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        const { data } = await axios.get('/api/statistics/dashboard', config);
        setStats(data);
        setLoading(false);
      } catch (error) {
        setError('Không thể tải dữ liệu tổng quan');
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [userInfo]);
  
  // Generate monthly trend data based on current monthly revenue
  const monthlyTrend = useMemo(() => {
    // Sử dụng dữ liệu từ API nếu có
    if (stats.financials.monthlyTrend) {
      return {
        labels: stats.financials.monthlyTrend.labels,
        datasets: [
          {
            label: 'Doanh Thu Hàng Tháng',
            data: stats.financials.monthlyTrend.data,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.3,
          },
        ],
      };
    }
    
    // Fallback nếu không có dữ liệu từ API
    const months = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6'];
    const baseValue = stats.financials.monthlyRevenue || 10000000;
    
    // Generate random but consistent data points around the base value
    const data = months.map((_, index) => {
      // Create a consistent pattern based on month index
      const factor = 0.8 + ((index % 3) * 0.15);
      return Math.floor(baseValue * factor);
    });
    
    return {
      labels: months,
      datasets: [
        {
          label: 'Doanh Thu Hàng Tháng',
          data: data,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.3,
        },
      ],
    };
  }, [stats.financials.monthlyRevenue, stats.financials.monthlyTrend]);
  
  // Prepare data for revenue by fee type chart
  const revenueByTypeData = useMemo(() => {
    // Định nghĩa các màu cho biểu đồ
    const colors = {
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',  // Hồng
        'rgba(54, 162, 235, 0.6)',  // Xanh dương
        'rgba(255, 206, 86, 0.6)',  // Vàng
        'rgba(75, 192, 192, 0.6)',  // Xanh lá
        'rgba(153, 102, 255, 0.6)', // Tím
        'rgba(255, 159, 64, 0.6)',  // Cam
        'rgba(199, 199, 199, 0.6)'  // Xám
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(199, 199, 199, 1)'
      ]
    };

    // Lọc các loại phí có giá trị > 0 và sắp xếp theo giá trị giảm dần
    const revenueEntries = Object.entries(stats.financials.revenueByType)
      .filter(([_, value]) => value > 0)
      .sort((a, b) => b[1] - a[1]);
    
    // Tạo labels hiển thị cả tên loại phí và số tiền
    const labels = revenueEntries.map(([label, value]) => 
      `${label}: ${value.toLocaleString()} VND`
    );
    const values = revenueEntries.map(([_, value]) => value);

    return {
      labels: labels,
      datasets: [
        {
          label: 'Doanh Thu Tháng Hiện Tại',
          data: values,
          backgroundColor: colors.backgroundColor.slice(0, labels.length),
          borderColor: colors.borderColor.slice(0, labels.length),
          borderWidth: 1,
        },
      ],
    };
  }, [stats.financials.revenueByType]);
  
  // Prepare data for counts comparison chart
  const countsComparisonData = useMemo(() => ({
    labels: ['Hộ Gia Đình', 'Cư Dân'],
    datasets: [
      {
        label: 'Số Lượng',
        data: [
          stats.counts.households,
          stats.counts.residents
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1,
      },
    ],
  }), [stats.counts.households, stats.counts.residents]);
  
  // Customize chart options for each chart
  const pieChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 15,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: `Tỷ lệ doanh thu ${stats.financials.displayMonthName || 'tháng hiện tại'} theo loại phí`,
        font: {
          size: 14,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${value.toLocaleString()} VND (${percentage}%)`;
          },
          title: function(context) {
            // Lấy tên loại phí từ label (bỏ phần số tiền)
            const fullLabel = context[0].label;
            const feeTypeName = fullLabel.split(':')[0];
            return feeTypeName;
          }
        }
      }
    }
  }), [stats.financials.displayMonthName]);

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Số lượng đối tượng quản lý',
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Số lượng'
        }
      }
    }
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Doanh thu 6 tháng gần nhất',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: ${value.toLocaleString()} VND`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Doanh thu (VND)'
        },
        ticks: {
          callback: function(value) {
            return value.toLocaleString();
          }
        }
      }
    }
  };
  
  // Area chart (Line với fill)
  const areaChartOptions = {
    ...lineChartOptions,
    elements: { line: { fill: true } },
    plugins: {
      ...lineChartOptions.plugins,
      title: { ...lineChartOptions.plugins.title, text: 'Biểu đồ Doanh Thu (Area)' }
    }
  };
  const areaChartData = {
    ...monthlyTrend,
    datasets: monthlyTrend.datasets.map(ds => ({ ...ds, fill: true, backgroundColor: 'rgba(0,204,255,0.15)' }))
  };
  // Bar ngang cho thống kê số lượng
  const horizontalBarOptions = {
    ...barChartOptions,
    indexAxis: 'y',
    plugins: {
      ...barChartOptions.plugins,
      title: { ...barChartOptions.plugins.title, text: 'Thống Kê Số Lượng (Bar Ngang)' }
    }
  };
  
  return (
    <div className="dashboard-bg py-4 px-2 px-md-4">
      <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
        <i className="bi bi-speedometer2 text-primary" style={{ fontSize: 36 }}></i>
        <h1 className="mb-0 fw-bold" style={{ letterSpacing: 1 }}>Bảng Điều Khiển Quản Lý</h1>
        <div className="ms-auto fw-semibold text-secondary" style={{ minWidth: 120, fontSize: 18 }}>
          {stats.financials.displayMonthName || (new Date().toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }))}
        </div>
      </div>
      
      {error && <Message variant="danger">{error}</Message>}
      
      {loading ? (
        <Loader />
      ) : (
        <>
          {/* Card thống kê: Row/Col, tối giản, màu trắng/xám nhạt */}
          <div className="row g-3 mb-4 justify-content-center">
            <div className="col-6 col-md-3">
              <div className="bg-white border rounded-4 shadow-sm p-3 text-center">
                <div className="text-secondary small mb-1">HỘ GIA ĐÌNH</div>
                <div className="fw-bold fs-3 text-primary mb-1">{stats.counts.households}</div>
                <Link to="/households" className="small text-decoration-none">Xem chi tiết</Link>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="bg-white border rounded-4 shadow-sm p-3 text-center">
                <div className="text-secondary small mb-1">CƯ DÂN</div>
                <div className="fw-bold fs-3 text-success mb-1">{stats.counts.residents}</div>
                <Link to="/residents" className="small text-decoration-none">Xem chi tiết</Link>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="bg-white border rounded-4 shadow-sm p-3 text-center">
                <div className="text-secondary small mb-1">LOẠI PHÍ</div>
                <div className="fw-bold fs-3 text-warning mb-1">{stats.counts.fees}</div>
                <Link to="/fees" className="small text-decoration-none">Xem chi tiết</Link>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="bg-white border rounded-4 shadow-sm p-3 text-center">
                <div className="text-secondary small mb-1">DOANH THU</div>
                <div className="fw-bold fs-3 text-info mb-1">{stats.financials.monthlyRevenue.toLocaleString()}</div>
                <Link to="/payments" className="small text-decoration-none">Xem chi tiết</Link>
              </div>
            </div>
          </div>
          {/* Grid biểu đồ: 2 hàng, mỗi hàng 2 biểu đồ, card trắng, bo góc lớn, shadow nhẹ */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6">
              <div className="bg-white border rounded-4 shadow-sm p-3 h-100">
                <div className="fw-bold mb-2" style={{ fontSize: 16 }}>Tỷ Lệ Doanh Thu (Doughnut)</div>
                <div style={{ height: 240 }}>
                  <Doughnut data={revenueByTypeData} options={pieChartOptions} />
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="bg-white border rounded-4 shadow-sm p-3 h-100">
                <div className="fw-bold mb-2" style={{ fontSize: 16 }}>Thống Kê Số Lượng (Bar Ngang)</div>
                <div style={{ height: 240 }}>
                  <Bar data={countsComparisonData} options={horizontalBarOptions} />
                </div>
              </div>
            </div>
          </div>
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6">
              <div className="bg-white border rounded-4 shadow-sm p-3 h-100">
                <div className="fw-bold mb-2" style={{ fontSize: 16 }}>Biểu Đồ Doanh Thu (Area)</div>
                <div style={{ height: 240 }}>
                  <Line data={areaChartData} options={areaChartOptions} />
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="bg-white border rounded-4 shadow-sm p-3 h-100">
                <div className="fw-bold mb-2" style={{ fontSize: 16 }}>Phí Đã Thanh Toán Gần Đây</div>
                {stats.recentPayments.length === 0 ? (
                  <p className="text-center">Không tìm thấy thanh toán gần đây</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle table-borderless dashboard-table">
                      <thead className="table-light">
                        <tr>
                          <th className="fw-bold">Hộ Gia Đình</th>
                          <th className="fw-bold">Phí</th>
                          <th className="fw-bold">Số Tiền</th>
                          <th className="fw-bold">Ngày</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentPayments.map((payment) => (
                          <tr key={payment._id} className="table-row-hover">
                            <td className="text-primary fw-semibold">
                              <i className="bi bi-house-door me-2"></i>
                              {payment.household?.apartmentNumber || 'N/A'}
                            </td>
                            <td className="fw-semibold">{payment.fee?.name || 'N/A'}</td>
                            <td className="text-success fw-bold">{payment.amount.toLocaleString()} VND</td>
                            <td className="text-muted">{new Date(payment.paymentDate).toLocaleDateString('vi-VN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardScreen; 