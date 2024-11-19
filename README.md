# ChronoX: Ứng dụng Mạng xã hội Di động Full Stack

ChronoX là một ứng dụng mạng xã hội di động hiện đại được phát triển bằng React Native và Expo cho frontend, kết hợp với Appwrite làm Backend-as-a-Service. Ứng dụng tập trung vào trải nghiệm người dùng với giao diện thân thiện và các tính năng tương tác xã hội.

## Tính năng Chính

1. **Xác thực & Bảo mật**
   - Đăng nhập/Đăng ký với email và Google
   - Xác thực email
   - Quản lý phiên đăng nhập với token
   - Đổi mật khẩu và quên mật khẩu

2. **Tương tác Người dùng**
   - Đăng bài viết với hình ảnh
   - Like và bình luận
   - Theo dõi người dùng
   - Nhắn tin trực tiếp
   - Thông báo realtime

3. **Quản lý Hồ sơ**
   - Chỉnh sửa thông tin cá nhân
   - Upload và thay đổi avatar
   - Xem thống kê (bài viết, người theo dõi, đang theo dõi)

## Công nghệ Sử dụng

### Frontend
- React Native & Expo
- Redux Toolkit
- NativeWind (TailwindCSS)
- Expo Router
- React Native UI Lib

### Backend & Services
- Appwrite
- Firebase Cloud Messaging
- Google OAuth

## Cài đặt và Chạy Ứng dụng

1. **Clone Repository**
```bash
git clone https://github.com/phoprono1/ChronoX_Expo.git
cd ChronoX_Expo
```

2. **Cài đặt Dependencies**
```bash
npm install
```

3. **Cấu hình Môi trường**
Tạo file `.env` và thêm các biến môi trường cần thiết:
```env
EXPO_PUBLIC_APPWRITE_ENDPOINT=your_endpoint
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
```

4. **Chạy Ứng dụng**
```bash
npx expo start
```

## Cấu trúc Project
```
ChronoX_Expo/
├── app/                 # Expo Router navigation
├── components/          # React components
├── constants/          # App configurations
├── hooks/             # Custom hooks
├── services/          # API services
└── store/             # Redux store
```

## Tài liệu API
- [Appwrite Documentation](https://appwrite.io/docs)
- [Expo Documentation](https://docs.expo.dev/)

## Đóng góp
Mọi đóng góp đều được chào đón. Vui lòng:
1. Fork project
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## Tác giả
- [phoprono1](https://github.com/phoprono1)

## License
MIT License

[Link to repository](https://github.com/phoprono1/ChronoX_Expo)