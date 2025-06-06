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
      const [householdResponse, residentsResponse, feeStatusResponse] = await Promise.all([
        axios.get(`/api/households/${id}`, config),
        axios.get(`/api/households/${id}/residents`, config),
        axios.get(`/api/payments/household/${id}/fee-status`, config)
      ]);
      
      setHousehold(householdResponse.data);
      setResidents(residentsResponse.data);
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
        return <Badge bg="success">Đã thanh toán</Badge>;
      case 'pending':
        return <Badge bg="warning">Chưa thanh toán</Badge>;
      case 'overdue':
        return <Badge bg="danger">Quá hạn</Badge>;
      default:
        return <Badge bg="secondary">Không áp dụng</Badge>;
    }
  };
  
  return (
    <>
      <Link to='/households' className='btn btn-light my-3'>
        <i className="fas fa-arrow-left"></i> Quay lại Danh sách Hộ dân
      </Link>
      
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : household ? (
        <>
          <Row>
            <Col md={5}>
              <Card className="mb-4 shadow-lg border-info">
                <Card.Header className="bg-info text-white d-flex align-items-center">
                  <i className="fas fa-home fa-lg me-2"></i>
                  <h4 className="mb-0">Thông tin Hộ gia đình</h4>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3 text-center">
                    <span className="display-5 fw-bold text-info">
                      <i className="fas fa-door-open me-2"></i>{household.apartmentNumber}
                    </span>
                    <div className="mt-2">
                      <Badge bg={household.active ? 'success' : 'danger'} className="fs-6">
                        {household.active ? 'Đang hoạt động' : 'Không hoạt động'}
                      </Badge>
                    </div>
                  </div>
                  <ListGroup variant="flush">
                    <ListGroup.Item>
                      <i className="fas fa-map-marker-alt me-2 text-primary"></i>
                      <strong>Địa chỉ:</strong> {household.address}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <i className="fas fa-calendar-plus me-2 text-secondary"></i>
                      <strong>Ngày tạo:</strong> <span className="text-dark">{new Date(household.creationDate).toLocaleDateString()}</span>
                    </ListGroup.Item>
                    {household.note && (
                      <ListGroup.Item>
                        <i className="fas fa-sticky-note me-2 text-warning"></i>
                        <strong>Ghi chú:</strong> <span className="fst-italic text-muted">{household.note}</span>
                      </ListGroup.Item>
                    )}
                  </ListGroup>
                </Card.Body>
                <Card.Footer>
                  <Row>
                    <Col className="d-flex justify-content-end">
                      <Link
                        to={`/households/${household._id}/edit`}
                        className="btn btn-primary btn-sm shadow-sm"
                      >
                        <i className="fas fa-edit"></i> Chỉnh sửa
                      </Link>
                    </Col>
                  </Row>
                </Card.Footer>
              </Card>
            </Col>
            
            <Col md={7}>
              <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h4>Cư dân ({residents.length})</h4>
                  <Button 
                    variant="success" 
                    size="sm"
                    onClick={handleAddResident}
                  >
                    <i className="fas fa-plus"></i> Thêm cư dân
                  </Button>
                </Card.Header>
                <Card.Body>
                  {residents.length === 0 ? (
                    <Alert variant="info">
                      Không có cư dân trong hộ gia đình này. Hãy thêm cư dân để bắt đầu.
                    </Alert>
                  ) : (
                    <Row xs={1} md={2} className="g-3">
                      {residents.map((resident) => (
                        <Col key={resident._id}>
                          <Card className="h-100 shadow-sm border-primary">
                            <Card.Body>
                              <div className="d-flex align-items-center mb-2">
                                <div className="me-3">
                                  <i className={`fas fa-user-circle fa-2x ${resident.active ? 'text-success' : 'text-secondary'}`}></i>
                                </div>
                                <div>
                                  <Card.Title className="mb-0">
                                    {resident._id === household.householdHead?._id && (
                                      <i className="fas fa-crown text-warning me-1" title="Chủ hộ"></i>
                                    )}
                                    {resident.fullName}
                                  </Card.Title>
                                  <Card.Subtitle className="text-muted" style={{fontSize: '0.95em'}}>
                                    {resident.gender === 'male' ? 'Nam' : 'Nữ'}
                                  </Card.Subtitle>
                                </div>
                              </div>
                              <div className="mb-2">
                                <strong>CCCD/CMND:</strong> {resident.idCard || 'N/A'}
                              </div>
                              <div className="mb-2">
                                <strong>Trạng thái:</strong> {resident.active ? (
                                  <Badge bg="success">Đang hoạt động</Badge>
                                ) : (
                                  <Badge bg="danger">Không hoạt động</Badge>
                                )}
                              </div>
                            </Card.Body>
                            <Card.Footer className="bg-white border-0 d-flex justify-content-end">
                              <Link to={`/residents/${resident._id}`}>
                                <Button variant="outline-primary" className="btn-sm">
                                  <i className="fas fa-eye"></i> Xem
                                </Button>
                              </Link>
                            </Card.Footer>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row>
            <Col>
              <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h4>Trạng thái Thanh toán</h4>
                  <Link to={`/payments?household=${household._id}`} className="btn btn-info btn-sm">
                    <i className="fas fa-history"></i> Lịch sử thanh toán
                  </Link>
                </Card.Header>
                <Card.Body>
                  {feeStatus.length === 0 ? (
                    <Alert variant="info">
                      Không có khoản phí nào được áp dụng cho hộ gia đình này.
                    </Alert>
                  ) : (
                    <Row xs={1} md={2} lg={3} className="g-3">
                      {feeStatus.map((fee) => (
                        <Col key={fee._id}>
                          <Card className="h-100 border-info shadow-sm">
                            <Card.Body>
                              <div className="d-flex align-items-center mb-2">
                                <i className="fas fa-coins fa-lg text-info me-2"></i>
                                <Card.Title className="mb-0">{fee.name}</Card.Title>
                              </div>
                              <div className="mb-2">
                                <strong>Số tiền:</strong> <span className="text-primary">{fee.amount.toLocaleString('vi-VN')} VND</span>
                              </div>
                              <div className="mb-2">
                                <strong>Tháng hiện tại:</strong> {getStatusBadge(fee.currentMonthStatus)}
                              </div>
                              <div className="mb-2">
                                <strong>Tháng trước:</strong> {getStatusBadge(fee.lastMonthStatus)}
                                {fee.lastMonthStatus === 'overdue' && (
                                  <span className="ms-2 text-danger">
                                    <i className="fas fa-exclamation-triangle"></i>
                                  </span>
                                )}
                              </div>
                            </Card.Body>
                            <Card.Footer className="bg-white border-0 d-flex justify-content-end gap-2">
                              {fee.currentMonthStatus === 'pending' && (
                                <Button 
                                  variant="success" 
                                  size="sm"
                                  onClick={() => handleCreatePayment(fee._id)}
                                >
                                  <i className="fas fa-money-bill"></i> Thanh toán
                                </Button>
                              )}
                              {fee.lastMonthStatus === 'overdue' && fee.currentMonthStatus === 'paid' && (
                                <Button 
                                  variant="warning" 
                                  size="sm"
                                  onClick={() => handleCreatePayment(fee._id, true)}
                                >
                                  <i className="fas fa-exclamation-circle"></i> Thanh toán nợ
                                </Button>
                              )}
                            </Card.Footer>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <Message>Không tìm thấy hộ gia đình</Message>
      )}
    </>
  );
};

export default HouseholdDetailScreen; 