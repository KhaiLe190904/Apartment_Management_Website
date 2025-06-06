import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Row, Col, Form, InputGroup, Card } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate } from 'react-router-dom';
import Message from '../components/Message';
import Loader from '../components/Loader';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

const HouseholdListScreen = () => {
  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext);
  
  useEffect(() => {
    fetchHouseholds();
  }, [userInfo]);
  
  const fetchHouseholds = async () => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const { data } = await axios.get('/api/households', config);
      
      setHouseholds(data);
      setLoading(false);
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể tải danh sách hộ gia đình'
      );
      setLoading(false);
    }
  };
  
  const deleteHandler = async (id) => {
    setDeleteId(id);
    setShowConfirm(true);
  };
  
  const handleConfirmDelete = async () => {
    setShowConfirm(false);
    if (!deleteId) return;
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      await axios.delete(`/api/households/${deleteId}`, config);
      fetchHouseholds();
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể xóa hộ gia đình'
      );
      setLoading(false);
    }
    setDeleteId(null);
  };
  
  const filteredHouseholds = households.filter(
    (household) =>
      household.apartmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      household.address.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <>
      <Row className="align-items-center mb-3">
        <Col>
          <h1>Hộ Gia Đình</h1>
        </Col>
        <Col className="text-end">
          <Button className="my-3" onClick={() => navigate('/households/create')}>
            <i className="fas fa-plus"></i> Thêm Hộ Gia Đình
          </Button>
        </Col>
      </Row>
      
      <Row className="mb-3">
        <Col md={6}>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Tìm kiếm theo số căn hộ hoặc địa chỉ"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button 
                variant="outline-secondary" 
                onClick={() => setSearchTerm('')}
              >
                <i className="fas fa-times"></i>
              </Button>
            )}
          </InputGroup>
        </Col>
      </Row>
      
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <Card className="shadow-lg border-0 rounded-4">
          <Card.Header className="bg-white border-0 rounded-top-4 pb-2 d-flex align-items-center justify-content-between">
            <span className="fw-bold fs-5 text-primary"><i className="bi bi-building me-2"></i>Danh sách hộ gia đình</span>
            <span className="text-muted small">Tổng: {filteredHouseholds.length}</span>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 household-table">
                <thead className="table-light">
                  <tr>
                    <th className="fw-bold text-center">Căn Hộ</th>
                    <th className="fw-bold">Địa Chỉ</th>
                    <th className="fw-bold">Chủ Hộ</th>
                    <th className="fw-bold text-center">Trạng Thái</th>
                    <th className="fw-bold text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHouseholds.map((household) => (
                    <tr key={household._id} className="table-row-hover">
                      <td className="text-center align-middle">
                        <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 fs-6 rounded-pill">
                          <i className="bi bi-house-door me-2"></i>{household.apartmentNumber}
                        </span>
                      </td>
                      <td className="align-middle">{household.address}</td>
                      <td className="align-middle">
                        {household.householdHead
                          ? <span className="fw-semibold text-dark"><i className="bi bi-person-circle me-1"></i>{household.householdHead.fullName}</span>
                          : <span className="text-muted fst-italic">Chưa Gán</span>}
                      </td>
                      <td className="text-center align-middle">
                        {household.active ? (
                          <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill">
                            <i className="bi bi-check-circle me-1"></i>Hoạt Động
                          </span>
                        ) : (
                          <span className="badge bg-danger bg-opacity-10 text-danger px-3 py-2 rounded-pill">
                            <i className="bi bi-x-circle me-1"></i>Không Hoạt Động
                          </span>
                        )}
                      </td>
                      <td className="text-center align-middle">
                        <div className="d-flex justify-content-center gap-1">
                          <LinkContainer to={`/households/${household._id}`}>
                            <Button variant="light" className="btn-circle mx-1" title="Xem chi tiết">
                              Xem
                            </Button>
                          </LinkContainer>
                          <LinkContainer to={`/households/${household._id}/edit`}>
                            <Button variant="light" className="btn-circle mx-1" title="Chỉnh sửa">
                              Chỉnh sửa
                            </Button>
                          </LinkContainer>
                          {userInfo.role === 'admin' && (
                            <Button
                              variant="danger"
                              className="btn-circle mx-1"
                              onClick={() => deleteHandler(household._id)}
                              title="Xóa"
                            >
                              Xóa
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredHouseholds.length === 0 && (
              <Message>Không tìm thấy hộ gia đình nào</Message>
            )}
          </Card.Body>
        </Card>
      )}
      <ConfirmDeleteModal
        show={showConfirm}
        onHide={() => setShowConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa hộ gia đình"
        message="Bạn có chắc chắn muốn xóa hộ gia đình này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        loading={loading}
      />
    </>
  );
};

export default HouseholdListScreen; 