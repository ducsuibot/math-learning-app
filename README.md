

# 🧮 HỌC TOÁN CÙNG DORAEMON 

**HỌC TOÁN CÙNG DORAEMON** là một ứng dụng web giúp **trẻ 3 – 4 tuổi học toán thông qua trò chơi**, kết hợp nhiều chức năng thông minh nhằm tăng hứng thú và hiệu quả học tập:
- 🎮 **Giao diện Web**
  
  ![Game học toán](https://raw.githubusercontent.com/ducsuibot/math-learning-app/main/Screenshot%20from%202025-12-16%2012-03-59.png)
- 🎮 **Học toán qua game tương tác**  
  ![Game học toán](https://raw.githubusercontent.com/ducsuibot/math-learning-app/main/Screenshot%20from%202025-12-16%2012-02-42.png)

- 🤖 **AI Chatbot hỗ trợ học tập**  
  Giải đáp câu hỏi, hướng dẫn học toán đơn giản cho trẻ  
  ![AI Chatbot](https://raw.githubusercontent.com/ducsuibot/math-learning-app/main/Screenshot%20from%202025-12-16%2010-39-21.png)

- 📊 **Báo cáo tiến độ học tập bằng AI**  
  Phân tích kết quả, đưa ra nhận xét và gợi ý cải thiện  
  ![AI Report](https://raw.githubusercontent.com/ducsuibot/math-learning-app/main/Screenshot%20from%202025-12-16%2011-53-03.png)
  ![AI Report](https://raw.githubusercontent.com/ducsuibot/math-learning-app/main/Screenshot%20from%202025-12-16%2011-52-56.png)

- ✋ **Nhận diện ngón tay bằng AI**  
  Hỗ trợ học đếm số trực quan thông qua camera  
  ![Finger Detection](https://raw.githubusercontent.com/ducsuibot/math-learning-app/main/Screenshot%20from%202025-12-16%2011-57-05.png)

- 🎁 **Hệ thống phần thưởng**  
  Tạo động lực học tập thông qua điểm số và thành tích  
  ![Reward System](https://raw.githubusercontent.com/ducsuibot/math-learning-app/main/Screenshot%20from%202025-12-16%2011-57-43.png)
  ![Reward System](https://raw.githubusercontent.com/ducsuibot/math-learning-app/main/Screenshot%20from%202025-12-16%2011-57-49.png)
- 🎁 **Hệ thống nhiệm vụ**  
  Tạo Nhiệm vụ để nhận phần thưởng  
  ![Reward System](https://raw.githubusercontent.com/ducsuibot/math-learning-app/main/Screenshot%20from%202025-12-16%2011-58-00.png)
---
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

---

## 📜 Giấy phép

Dự án phục vụ mục đích **học tập và nghiên cứu**.

---

