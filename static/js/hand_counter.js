// Đặt tất cả mã JS của phần đếm ngón tay vào đây
const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const fingerCountElement = document.getElementById('finger_count');

// Lấy thêm các element của bài toán
const appleContainer = document.getElementById('apple_container'); 
const checkAnswerBtn = document.getElementById('check_answer_btn');
const feedbackMessage = document.getElementById('feedback_message');

let currentDetectedCount = 0; 
let correctAnswer; 
let isSolved = false; // Biến trạng thái: true nếu đã trả lời đúng

// ==========================================================
// Hàm ONRESULTS (Xử lý hình ảnh và Logic game)
// ==========================================================
function onResults(results) {
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    let totalFingerCount = 0;
    
    if (results.multiHandLandmarks && results.multiHandedness) {
        for (let index = 0; index < results.multiHandLandmarks.length; index++) {
            const landmarks = results.multiHandLandmarks[index];
            const handedness = results.multiHandedness[index].label;
            
            // Vẽ xương tay
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
            drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });
            
            // Đếm ngón
            totalFingerCount += countFingers(landmarks, handedness);
        }
    }
    
    // Cập nhật giao diện số ngón tay
    fingerCountElement.innerText = totalFingerCount;
    currentDetectedCount = totalFingerCount;

    // --- LOGIC TỰ ĐỘNG KIỂM TRA ĐÁP ÁN TẠI ĐÂY ---
    // Chỉ kiểm tra nếu chưa giải xong câu này
    if (!isSolved) {
        // Cập nhật số hiển thị bên cạnh câu hỏi (để bé biết máy đang nhận bao nhiêu)
        const userInputCountElement = document.getElementById('user_input_count');
        if (userInputCountElement) {
            userInputCountElement.innerText = totalFingerCount;
            
            // Đổi màu số nếu đúng/sai để bé dễ nhận biết
            if (totalFingerCount === correctAnswer) {
                userInputCountElement.style.color = "#4CAF50"; // Màu xanh
            } else {
                userInputCountElement.style.color = "#FF0000"; // Màu đỏ
            }
        }

        // Nếu số ngón tay trùng với đáp án
        if (totalFingerCount === correctAnswer) {
            isSolved = true; // Đánh dấu là đã xong
            handleCorrectAnswer(); // Gọi hàm xử lý đúng
        }
    }

    canvasCtx.restore();
}

// ==========================================================
// HÀM XỬ LÝ KHI TRẢ LỜI ĐÚNG
// ==========================================================
function handleCorrectAnswer() {
    // 1. Hiện thông báo chúc mừng
    feedbackMessage.innerText = "Chính xác! Bé giỏi quá! 🎉";
    feedbackMessage.className = "feedback-correct";
    
    // 2. Hiện nút "Câu hỏi tiếp theo"
    checkAnswerBtn.style.display = "inline-block"; 
    checkAnswerBtn.innerText = "Câu hỏi tiếp theo ➡️";
    
    // 3. (Tùy chọn) Thêm hiệu ứng âm thanh hoặc animation ở đây nếu muốn
}

// Khởi tạo MediaPipe Hands
const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
hands.onResults(onResults);

// Khởi tạo camera
const camera = new Camera(videoElement, { onFrame: async () => { await hands.send({ image: videoElement }); }, width: 640, height: 480 });
camera.start();

// HÀM ĐẾM NGÓN TAY (Logic giữ nguyên)
function countFingers(landmarks, handedness) {
    let count = 0;
    const tipIds = [4, 8, 12, 16, 20];
    
    // 4 ngón dài
    for (let i = 1; i < 5; i++) {
        if (landmarks[tipIds[i]].y < landmarks[tipIds[i] - 2].y) {
            count++;
        }
    }
    
    // Ngón cái (xử lý trái/phải)
    if (handedness === 'Right') {
        if (landmarks[tipIds[0]].x < landmarks[tipIds[0] - 2].x) {
            count++;
        }
    } else {
        if (landmarks[tipIds[0]].x > landmarks[tipIds[0] - 2].x) {
            count++;
        }
    }
    return count;
}

// ==========================================================
// LOGIC TẠO CÂU HỎI MỚI
// ==========================================================
function generateNewQuestion() {
    // 1. Reset trạng thái
    isSolved = false; 
    
    // 2. Ẩn nút đi (chờ bé làm đúng mới hiện lại)
    checkAnswerBtn.style.display = "none";
    
    // 3. Reset thông báo
    feedbackMessage.innerText = "Bé hãy giơ tay để trả lời nhé...";
    feedbackMessage.className = "";

    // 4. Tạo số ngẫu nhiên từ 1 đến 10
    correctAnswer = Math.floor(Math.random() * 10) + 1;

    // 5. Xóa ảnh cũ
    appleContainer.innerHTML = '';
    
    // 6. Tạo ảnh minh họa (Táo/Mèo...)
    for (let i = 0; i < correctAnswer; i++) {
        const appleImg = document.createElement('img');
        appleImg.src = '/static/img/apple.png'; // Đảm bảo đường dẫn ảnh đúng
        appleImg.alt = 'Vật đếm';
        appleImg.className = 'apple-img-challenge'; 
        appleImg.style.animationDelay = `${i * 0.1}s`; // Hiệu ứng xuất hiện lần lượt
        appleContainer.appendChild(appleImg);
    }

    // 7. Thêm dòng hiển thị số người dùng đang giơ
    const userInputDisplay = document.createElement('p');
    userInputDisplay.style.width = "100%";
    userInputDisplay.style.textAlign = "center";
    userInputDisplay.innerHTML = `Bé đang giơ: <span id="user_input_count" style="font-size: 1.5rem; font-weight: bold; transition: color 0.3s;">0</span> ngón`;
    appleContainer.appendChild(userInputDisplay);
}

// Sự kiện click nút (Chỉ dùng để chuyển câu)
checkAnswerBtn.addEventListener('click', () => {
    generateNewQuestion();
});

// Bắt đầu game
generateNewQuestion();