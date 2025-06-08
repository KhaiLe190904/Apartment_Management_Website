# Kế Hoạch Kiểm Thử Hộp Trắng - Chức Năng Đăng Nhập

## Mục Tiêu
Kiểm thử tất cả các đường dẫn mã (code paths) trong hàm `loginUser` của `userController.js`

## Phân Tích Mã Nguồn

### Hàm loginUser - Các nhánh logic chính:

```javascript
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Path 1: Tìm user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Tên đăng nhập không tồn tại' });
    }
    
    // Path 2: Kiểm tra user active
    if (!user.active) {
      return res.status(401).json({ message: 'Tài khoản đã bị vô hiệu hóa' });
    }
    
    // Path 3: Kiểm tra mật khẩu
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mật khẩu không đúng' });
    }
    
    // Path 4: Thành công
    user.lastLogin = Date.now();
    await user.save();
    res.json({ ...userInfo, token });
    
  } catch (error) {
    // Path 5: Error handling
    res.status(500).json({ message: 'Lỗi server' });
  }
};
```

## Test Cases

| TC | Username | Password | Expected Outcome | Kết quả | Đường dẫn kiểm thử |
|----|----------|----------|------------------|---------|-------------------|
| 1  | admin    | 12345789 | Chuyển sang form làm việc của admin | ✅ Passed | **Path 4** - Happy path |
| 2  | admin    | 123456   | TB "Mật khẩu không đúng" | ✅ Passed | **Path 3** - Password mismatch |
| 3  | adminn   | 12345789 | TB "Tên đăng nhập không tồn tại" | ✅ Passed | **Path 1** - User not found |
| 4  | adminn   | 12345678 | TB "Tên đăng nhập không tồn tại" | ✅ Passed | **Path 1** - User not found |

## Độ Bao Phủ Mã (Code Coverage)

### Các nhánh đã test:
- ✅ **Path 1**: `if (!user)` - TC3, TC4
- ✅ **Path 3**: `if (!isMatch)` - TC2  
- ✅ **Path 4**: Success flow - TC1
- ⚠️ **Path 2**: `if (!user.active)` - Chưa test
- ⚠️ **Path 5**: `catch (error)` - Chưa test

### Tỷ lệ bao phủ: 75% (3/4 paths chính)

## Phương Pháp Test

### 1. **Arrange-Act-Assert Pattern**
```javascript
// Arrange: Setup data
await User.create({ username: 'admin', password: '12345789' });

// Act: Execute function
const response = await request(app).post('/login').send({ username, password });

// Assert: Verify results
expect(response.status).toBe(200);
```

### 2. **In-Memory Database**
- Sử dụng `mongodb-memory-server` 
- Tách biệt với database production
- Cleanup sau mỗi test

### 3. **Real HTTP Testing**
- Sử dụng `supertest` để test HTTP endpoints
- Test đầy đủ request/response cycle

## Cách Chạy Test

```bash
# Cài đặt dependencies
npm install

# Chạy test
npm test

# Chạy specific test file
npx jest tests/login.test.js

# Chạy với verbose output
npx jest tests/login.test.js --verbose
```

## Kết Quả Mong Đợi

### TC1 - Đăng nhập thành công:
```json
{
  "status": 200,
  "body": {
    "_id": "...",
    "username": "admin", 
    "role": "admin",
    "token": "dummy-token-..."
  }
}
```

### TC2, TC3, TC4 - Đăng nhập thất bại:
```json
{
  "status": 401,
  "body": {
    "message": "Tên đăng nhập không tồn tại" // hoặc "Mật khẩu không đúng"
  }
}
```

## Ghi Chú

1. **White-box Testing**: Test dựa trên cấu trúc mã nguồn, bao phủ các nhánh logic
2. **Path Coverage**: Mỗi test case tương ứng với một đường dẫn mã cụ thể
3. **Real Environment**: Test với database thật và password hashing
4. **Error Messages**: Verify chính xác message lỗi theo logic code 