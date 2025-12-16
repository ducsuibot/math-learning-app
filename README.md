

# 🧮 HỌC TOÁN CÙNG DORAEMON 

**HỌC TOÁN CÙNG DORAEMON** là một ứng dụng web giúp **trẻ 3 - 4 tuổi học toán thông qua trò chơi**, kết hợp hệ thống **AI Chatbot hỗ trợ học tập**, đồng thời có các chức năng như **Báo cáo bằng AI**, **Nhận diện ngón tay bằng AI**, **Hệ thống phần thưởng**,... .
## 👨‍💻 Nhóm thực hiện : Nhóm 19

* **Nguyễn Minh Đức 20233331**
* **Phạm Trung Dũng 20233349**
* Đồ án học phần : Kĩ thuật phần mềm ứng dụng
* GVHD : Thầy Hoàng Quang Huy Bme
---

## 🎯 Mục tiêu dự án

* Tạo môi trường học toán **trực quan – vui nhộn – dễ tiếp cận**
* Kết hợp **game + AI** để tăng hứng thú học tập
* Cung cấp **dashboard theo dõi tiến độ** 
* Đảm bảo hệ thống **đơn giản, bảo mật và dễ mở rộng**

---

## 👥 Đối tượng sử dụng (Actors)

* **Quản trị viên (Admin):** Quản lý hệ thống, người dùng và dữ liệu
* **Học sinh:** Chơi game học toán, chat với AI

---

## 🚀 Chức năng chính

* 🔐 Đăng ký / Đăng nhập (phân quyền theo vai trò)
* 🎮 Game học toán (cộng, trừ, tính điểm theo thời gian)
* 🤖 AI Chatbot hỗ trợ học toán
* 🤖 Báo cáo, thống kê bằng AI
* 🤖 Nhận diện đếm số bằng ngón tay sử dụng AI
* 📊 Hệ thống phân cấp phần thưởng
* 📊 Lưu và hiển thị lịch sử điểm số
* ☁️ Deploy và sử dụng qua Internet

---

## 🛠 Công nghệ sử dụng

### Backend

* **Python – Flask, JavaScript**
* Flask-Login (quản lý phiên đăng nhập)
* SQLite / PostgreSQL (CSDL quan hệ)
* Werkzeug Security (hash mật khẩu)

### Frontend

* **HTML, CSS**
* Canvas API cho game
* Responsive UI đơn giản, thân thiện

### AI

* Google Generative AI (Chatbot)
* MediaPipe (hỗ trợ xử lý AI)

### Deploy

* Render (Cloud Platform)

---

## 🗂 Cấu trúc thư mục

```bash
math-learning-app/
│
├── app.py                 # Entry point Flask
├── templates/             # HTML templates
├── static/
│   ├── css/               # CSS
│   ├── js/                # JavaScript
│   └── img/               # Hình ảnh game
├── requirements.txt
├── doraemon_math.db├└── README.md
```

---

## ⚙️ Hướng dẫn cài đặt

### 1️⃣ Clone project

```bash
git clone https://github.com/ducsuibot/math-learning-app.git
cd math-learning-app
```

### 2️⃣ Tạo môi trường ảo

```bash
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows
```

### 3️⃣ Cài đặt thư viện

```bash
pip install -r requirements.txt
```

### 4️⃣ Thiết lập biến môi trường

Tạo file `.env`:

```env
SECRET_KEY=your_secret_key
GOOGLE_API_KEY=your_google_api_key
DATABASE_URL=sqlite:///database.db
```

---

## ▶️ Chạy ứng dụng

```bash
python app.py
```

Truy cập:

```
http://127.0.0.1:5000
```

---

## 🧪 Kiểm thử

* Đăng nhập sai mật khẩu
* Trả lời đúng/sai trong game
* Hết giờ → hiển thị popup thua
* Kiểm tra lưu điểm vào database
* Gửi câu hỏi không liên quan toán cho AI

---

## 🔐 Bảo mật

* Mật khẩu được **hash**
* Phân quyền rõ ràng theo vai trò
* Không lưu thông tin nhạy cảm ở frontend

---

## 📈 Khả năng mở rộng

* Dễ dàng thêm game mới
* Có thể chuyển sang PostgreSQL khi scale
* Mở rộng dashboard và báo cáo học tập
* Tách AI service riêng trong tương lai

---


## 📜 Giấy phép

Dự án phục vụ mục đích **học tập và nghiên cứu**.

---

