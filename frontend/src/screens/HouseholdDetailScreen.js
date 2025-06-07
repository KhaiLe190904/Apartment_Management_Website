import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Card, Button, ListGroup, Table, Alert, Badge } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Message from '../components/Message';
import Loader from '../components/Loader';
import AuthContext from '../context/AuthContext';
import axios from 'axios';

const HouseholdDetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [household, setHousehold] = useState(null);
  const [residents, setResidents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [feeStatus, setFeeStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { userInfo } = useContext(AuthContext);
  
  useEffect(() => {
    fetchHouseholdData();
  }, [id, userInfo]);
  
  const fetchHouseholdData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      // Make all requests in parallel
      const [householdResponse, residentsResponse, vehiclesResponse, feeStatusResponse] = await Promise.all([
        axios.get(`/api/households/${id}`, config),
        axios.get(`/api/households/${id}/residents`, config),
        axios.get(`/api/vehicles/household/${id}`, config),
        axios.get(`/api/payments/household/${id}/fee-status`, config)
      ]);
      
      setHousehold(householdResponse.data);
      setResidents(residentsResponse.data);
      setVehicles(vehiclesResponse.data);
      setFeeStatus(feeStatusResponse.data.feeStatus);
      
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể tải dữ liệu hộ gia đình'
      );
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddResident = () => {
    navigate(`/residents/create?household=${household._id}`);
  };

  const handleCreatePayment = (feeId, isDebt = false) => {
    navigate(`/payments/create?household=${household._id}&fee=${feeId}&isDebt=${isDebt}`);
  };

  // Helper function to get badge variant based on status
  const getStatusBadge = (status) => {
    switch(status) {
      case 'paid':
        return <Badge bg="success" className="px-3 py-2">Đã thanh toán</Badge>;
      case 'pending':
        return <Badge bg="warning" className="px-3 py-2">Chưa thanh toán</Badge>;
      case 'overdue':
        return <Badge bg="danger" className="px-3 py-2">Quá hạn</Badge>;
      default:
        return <Badge bg="secondary" className="px-3 py-2">Không áp dụng</Badge>;
    }
  };
  
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      {/* Navigation */}
      <div className="mb-4">
        <Link to='/households' className='btn btn-light btn-lg rounded-pill shadow-sm px-4' style={{
          border: 'none',
          transition: 'all 0.3s ease'
        }}>
          <i className="bi bi-arrow-left me-2"></i> Quay lại Danh sách
        </Link>
      </div>
      
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : household ? (
        <>
          {/* Hero Section - Household Info */}
          <div className="mb-5">
            <div style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(15px)',
              borderRadius: '25px',
              padding: '40px',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 15px 50px rgba(0,0,0,0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Background Pattern */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '200px',
                height: '200px',
                background: 'linear-gradient(45deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1))',
                borderRadius: '50%',
                transform: 'translate(50%, -50%)'
              }}></div>
              
              <Row className="align-items-center">
                <Col lg={8}>
                  <div className="d-flex align-items-center mb-4">
                    <div style={{
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      borderRadius: '20px',
                      padding: '20px',
                      marginRight: '20px',
                      boxShadow: '0 10px 30px rgba(79, 172, 254, 0.3)'
                    }}>
                      <i className="bi bi-house-door" style={{ fontSize: '3rem', color: 'white' }}></i>
                    </div>
                    <div>
                      <h1 className="mb-2 fw-bold" style={{ fontSize: '3rem', color: '#2d3748' }}>
                        Căn hộ {household.apartmentNumber}
                      </h1>
                      <div className="d-flex align-items-center gap-3">
                        <Badge bg={household.active ? 'success' : 'danger'} className="px-3 py-2 fs-6">
                          <i className={`bi ${household.active ? 'bi-check-circle' : 'bi-x-circle'} me-2`}></i>
                          {household.active ? 'Đang hoạt động' : 'Không hoạt động'}
                        </Badge>
                        <span className="text-muted">
                          <i className="bi bi-calendar3 me-2"></i>
                          Từ {new Date(household.creationDate).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="d-flex align-items-center p-3" style={{
                        background: 'rgba(79, 172, 254, 0.1)',
                        borderRadius: '15px',
                        border: '1px solid rgba(79, 172, 254, 0.2)'
                      }}>
                        <i className="bi bi-geo-alt-fill text-primary me-3" style={{ fontSize: '1.5rem' }}></i>
                        <div>
                          <div className="text-muted small">Địa chỉ</div>
                          <div className="fw-semibold">{household.address}</div>
                        </div>
                      </div>
                    </div>
                    {household.note && (
                      <div className="col-md-6">
                        <div className="d-flex align-items-center p-3" style={{
                          background: 'rgba(255, 193, 7, 0.1)',
                          borderRadius: '15px',
                          border: '1px solid rgba(255, 193, 7, 0.2)'
                        }}>
                          <i className="bi bi-sticky-fill text-warning me-3" style={{ fontSize: '1.5rem' }}></i>
                          <div>
                            <div className="text-muted small">Ghi chú</div>
                            <div className="fw-semibold">{household.note}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Col>
                
                <Col lg={4} className="text-end">
                  <Link
                    to={`/households/${household._id}/edit`}
                    className="btn btn-primary btn-lg rounded-pill px-4 py-3 shadow-sm"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <i className="bi bi-pencil-square me-2"></i> Chỉnh sửa thông tin
                  </Link>
                </Col>
              </Row>
            </div>
          </div>

          {/* Main Content Grid */}
          <Row className="g-4">
            {/* Residents Section */}
            <Col xl={8}>
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(15px)',
                borderRadius: '20px',
                padding: '30px',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
              }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 className="fw-bold text-dark d-flex align-items-center">
                    <i className="bi bi-people-fill me-3 text-primary" style={{ fontSize: '1.8rem' }}></i>
                    Cư dân ({residents.length})
                  </h3>
                  <Button 
                    variant="success" 
                    className="rounded-pill px-4 py-2 shadow-sm"
                    onClick={handleAddResident}
                    style={{ border: 'none' }}
                  >
                    <i className="bi bi-plus-circle me-2"></i> Thêm cư dân
                  </Button>
                </div>
                
                {residents.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-person-plus display-1 text-muted opacity-50"></i>
                    <h5 className="mt-3 text-muted">Chưa có cư dân nào</h5>
                    <p className="text-muted">Hãy thêm cư dân để bắt đầu quản lý</p>
                  </div>
                ) : (
                  <Row xs={1} md={2} className="g-4">
                    {residents.map((resident) => (
                      <Col key={resident._id}>
                        <div style={{
                          background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                          borderRadius: '18px',
                          padding: '20px',
                          height: '100%',
                          boxShadow: '0 8px 25px rgba(252, 182, 159, 0.3)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }} 
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0px)'}>
                          <div className="d-flex align-items-center mb-3">
                            <div style={{
                              width: '60px',
                              height: '60px',
                              background: resident.active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#6c757d',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '15px',
                              boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
                            }}>
                              <i className="bi bi-person-fill text-white" style={{ fontSize: '1.5rem' }}></i>
                            </div>
                            <div className="flex-grow-1">
                              <h5 className="mb-1 fw-bold text-dark d-flex align-items-center">
                                {resident._id === household.householdHead?._id && (
                                  <i className="bi bi-crown-fill text-warning me-2" title="Chủ hộ"></i>
                                )}
                                {resident.fullName}
                              </h5>
                              <p className="mb-0 text-muted">
                                <i className={`bi ${resident.gender === 'male' ? 'bi-gender-male' : 'bi-gender-female'} me-1`}></i>
                                {resident.gender === 'male' ? 'Nam' : 'Nữ'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <div className="text-muted small mb-1">CCCD/CMND</div>
                            <div className="fw-semibold text-dark">{resident.idCard || 'Chưa cập nhật'}</div>
                          </div>
                          
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              {resident.active ? (
                                <Badge bg="success" className="px-3 py-2">
                                  <i className="bi bi-check-circle me-1"></i>Hoạt động
                                </Badge>
                              ) : (
                                <Badge bg="secondary" className="px-3 py-2">
                                  <i className="bi bi-pause-circle me-1"></i>Tạm ngưng
                                </Badge>
                              )}
                            </div>
                            <Link to={`/residents/${resident._id}`}>
                              <Button variant="outline-dark" size="sm" className="rounded-pill">
                                <i className="bi bi-eye me-1"></i> Xem chi tiết
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
              </div>
              
              {/* Vehicles Section */}
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(15px)',
                borderRadius: '20px',
                padding: '30px',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                marginTop: '20px'
              }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 className="fw-bold text-dark d-flex align-items-center">
                    <i className="bi bi-car-front-fill me-3 text-primary" style={{ fontSize: '1.8rem' }}></i>
                    Phương tiện ({vehicles.length})
                  </h3>
                  <div className="d-flex gap-2">
                    <Link to={`/vehicles/create?household=${household._id}`}>
                      <Button 
                        variant="success" 
                        className="rounded-pill px-4 py-2 shadow-sm"
                        style={{ border: 'none' }}
                      >
                        <i className="bi bi-plus-circle me-2"></i> Thêm xe
                      </Button>
                    </Link>
                    <Link to={`/vehicles?household=${household._id}`}>
                      <Button 
                        variant="outline-primary" 
                        className="rounded-pill px-4 py-2"
                      >
                        <i className="bi bi-eye me-2"></i> Xem tất cả
                      </Button>
                    </Link>
                  </div>
                </div>
                
                {vehicles.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-car-front display-1 text-muted opacity-50"></i>
                    <h5 className="mt-3 text-muted">Chưa có phương tiện nào</h5>
                    <p className="text-muted">Hãy thêm phương tiện để bắt đầu quản lý</p>
                  </div>
                ) : (
                  <Row xs={1} md={2} className="g-4">
                    {vehicles.slice(0, 4).map((vehicle) => (
                      <Col key={vehicle._id}>
                        <div style={{
                          background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                          borderRadius: '18px',
                          padding: '20px',
                          height: '100%',
                          boxShadow: '0 8px 25px rgba(187, 222, 251, 0.3)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }} 
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0px)'}>
                          <div className="d-flex align-items-center mb-3">
                            <div style={{
                              width: '60px',
                              height: '60px',
                              background: vehicle.status === 'Đang sử dụng' ? 'linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%)' : '#6c757d',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '15px',
                              boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
                            }}>
                              <i className={`bi ${vehicle.vehicleType === 'Ô tô' ? 'bi-car-front-fill' : vehicle.vehicleType === 'Xe máy' ? 'bi-scooter' : vehicle.vehicleType === 'Xe đạp' ? 'bi-bicycle' : 'bi-lightning-charge-fill'} text-white`} style={{ fontSize: '1.5rem' }}></i>
                            </div>
                            <div className="flex-grow-1">
                              <h5 className="mb-1 fw-bold text-dark">
                                {vehicle.licensePlate}
                              </h5>
                              <p className="mb-0 text-muted">
                                <i className="bi bi-tag me-1"></i>
                                {vehicle.vehicleType}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <div className="text-muted small mb-1">Hãng & Mẫu</div>
                            <div className="fw-semibold text-dark">
                              {vehicle.brand} {vehicle.model && `- ${vehicle.model}`}
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <div className="text-muted small mb-1">Chủ sở hữu</div>
                            <div className="fw-semibold text-dark">{vehicle.owner?.fullName}</div>
                          </div>
                          
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              {vehicle.status === 'Đang sử dụng' ? (
                                <Badge bg="success" className="px-3 py-2">
                                  <i className="bi bi-check-circle me-1"></i>Đang sử dụng
                                </Badge>
                              ) : vehicle.status === 'Tạm ngưng' ? (
                                <Badge bg="warning" className="px-3 py-2">
                                  <i className="bi bi-pause-circle me-1"></i>Tạm ngưng
                                </Badge>
                              ) : (
                                <Badge bg="danger" className="px-3 py-2">
                                  <i className="bi bi-x-circle me-1"></i>Đã bán
                                </Badge>
                              )}
                            </div>
                            <Link to={`/vehicles/${vehicle._id}/edit`}>
                              <Button variant="outline-dark" size="sm" className="rounded-pill">
                                <i className="bi bi-pencil me-1"></i> Sửa
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
                {vehicles.length > 4 && (
                  <div className="text-center mt-4">
                    <Link to={`/vehicles?household=${household._id}`}>
                      <Button variant="outline-primary" className="rounded-pill">
                        <i className="bi bi-arrow-right me-2"></i>
                        Xem thêm {vehicles.length - 4} xe khác
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </Col>
            
            {/* Fee Status Section */}
            <Col xl={4}>
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(15px)',
                borderRadius: '20px',
                padding: '30px',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
              }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="fw-bold text-dark d-flex align-items-center">
                    <i className="bi bi-credit-card-fill me-3 text-success" style={{ fontSize: '1.5rem' }}></i>
                    Thanh toán
                  </h4>
                  <Link to={`/payments?household=${household._id}`} className="btn btn-outline-primary btn-sm rounded-pill">
                    <i className="bi bi-clock-history me-1"></i> Lịch sử
                  </Link>
                </div>
                
                {feeStatus.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-wallet2 display-4 text-muted opacity-50"></i>
                    <p className="mt-3 text-muted">Không có khoản phí nào</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {feeStatus.map((fee) => (
                      <div key={fee._id} style={{
                        background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                        borderRadius: '15px',
                        padding: '20px',
                        boxShadow: '0 5px 20px rgba(168, 237, 234, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <h6 className="mb-0 fw-bold text-dark">{fee.name}</h6>
                          <i className="bi bi-cash-coin text-success" style={{ fontSize: '1.2rem' }}></i>
                        </div>
                        
                        <div className="mb-3">
                          <div className="text-muted small mb-1">Số tiền</div>
                          <div className="fw-bold text-success fs-5">
                            {fee.amount.toLocaleString('vi-VN')} VND
                          </div>
                        </div>
                        
                        <div className="row g-2 mb-3">
                          <div className="col-12">
                            <div className="text-muted small">Tháng hiện tại</div>
                            {getStatusBadge(fee.currentMonthStatus)}
                          </div>
                          <div className="col-12">
                            <div className="text-muted small">Tháng trước</div>
                            <div className="d-flex align-items-center gap-2">
                              {getStatusBadge(fee.lastMonthStatus)}
                              {fee.lastMonthStatus === 'overdue' && (
                                <i className="bi bi-exclamation-triangle-fill text-danger"></i>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="d-flex gap-2 flex-wrap">
                          {fee.currentMonthStatus === 'pending' && (
                            <Button 
                              variant="success" 
                              size="sm"
                              className="rounded-pill flex-grow-1"
                              onClick={() => handleCreatePayment(fee._id)}
                            >
                              <i className="bi bi-credit-card me-1"></i> Thanh toán
                            </Button>
                          )}
                          {fee.lastMonthStatus === 'overdue' && fee.currentMonthStatus === 'paid' && (
                            <Button 
                              variant="warning" 
                              size="sm"
                              className="rounded-pill flex-grow-1"
                              onClick={() => handleCreatePayment(fee._id, true)}
                            >
                              <i className="bi bi-exclamation-triangle me-1"></i> Trả nợ
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </>
      ) : (
        <Message>Không tìm thấy hộ gia đình</Message>
      )}
    </div>
  );
};

export default HouseholdDetailScreen; 