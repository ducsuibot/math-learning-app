// Đặt tất cả mã JS của phần đếm ngón tay vào đây
const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const fingerCountElement = document.getElementById('finger_count');
// Lấy thêm các element của bài toán
const appleContainer = document.getElementById('apple_container'); 
const checkAnswerBtn = document.getElementById('check_answer_btn');
const feedbackMessage = document.getElementById('feedback_message');

let currentDetectedCount = 0; // Biến lưu trữ số ngón tay hiện tại
let correctAnswer; // Biến lưu trữ đáp án đúng, sẽ được random
let isChecking = true; // Biến trạng thái của nút: true = đang kiểm tra, false = chuyển câu hỏi

// ==========================================================
// Hàm ONRESULTS (Cập nhật nhỏ để tránh lỗi)
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
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
            drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });
            totalFingerCount += countFingers(landmarks, handedness);
        }
    }
    fingerCountElement.innerText = totalFingerCount;
    
    // Cập nhật số người dùng giơ (kiểm tra xem element có tồn tại không)
    const userInputCountElement = document.getElementById('user_input_count');
    if (userInputCountElement) {
        userInputCountElement.innerText = totalFingerCount;
    }
    currentDetectedCount = totalFingerCount;
    canvasCtx.restore();
}

// Khởi tạo MediaPipe Hands (Không thay đổi)
const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
hands.onResults(onResults);

// Khởi tạo camera (Không thay đổi)
const camera = new Camera(videoElement, { onFrame: async () => { await hands.send({ image: videoElement }); }, width: 640, height: 480 });
camera.start();

// HÀM COUNTFINGERS (Không thay đổi)
function countFingers(landmarks, handedness) {
    let count = 0;
    const tipIds = [4, 8, 12, 16, 20];
    for (let i = 1; i < 5; i++) {
        if (landmarks[tipIds[i]].y < landmarks[tipIds[i] - 2].y) {
            count++;
        }
    }
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
// LOGIC BÀI TẬP TOÁN (ĐÃ ĐƯỢC NÂNG CẤP)
// ==========================================================

// ==========================================================
// THAY THẾ TOÀN BỘ HÀM generateNewQuestion NÀY
// ==========================================================

function generateNewQuestion() {
    // 1. Tạo số ngẫu nhiên từ 1 đến 10
    correctAnswer = Math.floor(Math.random() * 10) + 1;

    // 2. Xóa các quả táo cũ và thông báo
    appleContainer.innerHTML = '';
    feedbackMessage.innerText = '';
    
    // 3. Tạo và hiển thị số táo mới
    for (let i = 0; i < correctAnswer; i++) {
        const appleImg = document.createElement('img');
        
        // ĐÂY LÀ DÒNG CÓ THAY ĐỔI: Dùng đường dẫn đến file ảnh cục bộ
        appleImg.src = '/static/img/apple.png'; // ✅ ĐÚNG
        
        appleImg.alt = 'Táo';
        appleImg.className = 'apple-img-challenge'; // Thêm class mới để tùy chỉnh CSS riêng cho táo bài tập
        appleContainer.appendChild(appleImg);
    }

    // 4. Thêm lại phần hiển thị số người dùng giơ
    const userInputDisplay = document.createElement('p');
    userInputDisplay.innerHTML = `Bạn đã giơ: <span id="user_input_count" class="user-input-highlight">0</span>`;
    appleContainer.appendChild(userInputDisplay);

    // 5. Đặt lại nút về trạng thái "Kiểm tra"
    checkAnswerBtn.innerText = "Kiểm tra đáp án";
    isChecking = true;
}

// ... (các phần còn lại của file hand_counter.js không thay đổi) ...

checkAnswerBtn.addEventListener('click', () => {
    if (isChecking) {
        if (currentDetectedCount === correctAnswer) {
            feedbackMessage.innerText = "Đúng rồi! Bé giỏi quá, hãy tiếp tục phát huy những lần sau =))";
            feedbackMessage.className = "feedback-correct";
        } else {
            feedbackMessage.innerText = `Chưa đúng. Bạn đã giơ ${currentDetectedCount} ngón, nhưng đáp án là ${correctAnswer}.`;
            feedbackMessage.className = "feedback-wrong";
        }
        checkAnswerBtn.innerText = "Câu hỏi tiếp theo";
        isChecking = false;
    } else {
        generateNewQuestion();
    }
});

generateNewQuestion();