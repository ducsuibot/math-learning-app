document.addEventListener('DOMContentLoaded', () => {
    // === LẤY CÁC ELEMENT ===
    const timerDisplay = document.getElementById('timer');
    const scoreDisplay = document.getElementById('score');
    const bubbleContainer = document.getElementById('bubble-container');
    const feedbackDisplay = document.getElementById('game-feedback');
    const gameContainer = document.querySelector('.game-container');

    // === BIẾN GAME ===
    let score = 0;
    let timeLeft = 60; 
    let currentSequence = []; 
    let sortedSequence = [];  
    let currentStep = 0;      
    let timerInterval;
    let gameEnded = false;

    // 1. KHAI BÁO BIẾN ĐẾM
    let correctCount = 0; // <--- MỚI
    let wrongCount = 0;   // <--- MỚI

    /**
     * Hàm tạo mảng số ngẫu nhiên không trùng nhau
     */
    function getUniqueRandomNumbers(count, min, max) {
        const nums = new Set();
        while(nums.size < count) {
            nums.add(Math.floor(Math.random() * (max - min + 1)) + min);
        }
        return Array.from(nums);
    }

    /**
     * Tạo câu hỏi mới
     */
    function generateQuestion() {
        if (gameEnded) return;

        // Reset trạng thái
        currentStep = 0;
        bubbleContainer.innerHTML = '';
        feedbackDisplay.innerText = '';
        
        // Lấy 4 số ngẫu nhiên từ 0 đến 9 (1 chữ số)
        currentSequence = getUniqueRandomNumbers(4, 0, 9);
        
        // Tạo đáp án đúng
        sortedSequence = [...currentSequence].sort((a, b) => a - b);

        // Hiển thị các bong bóng số
        currentSequence.forEach(num => {
            const bubble = document.createElement('div');
            bubble.classList.add('number-bubble');
            bubble.innerText = num;
            bubble.dataset.value = num;
            
            bubble.addEventListener('click', () => handleBubbleClick(bubble, num));
            
            bubbleContainer.appendChild(bubble);
        });
    }

    /**
     * Xử lý khi bấm vào bong bóng
     */
    function handleBubbleClick(bubbleElement, value) {
        if (gameEnded || bubbleElement.classList.contains('clicked')) return;

        // Kiểm tra xem số vừa bấm có phải là số nhỏ nhất TRONG CÁC SỐ CÒN LẠI không?
        if (value === sortedSequence[currentStep]) {
            // === ĐÚNG BƯỚC NÀY ===
            bubbleElement.classList.add('clicked');
            currentStep++; 

            // Nếu đã chọn hết 4 số (Hoàn thành màn chơi)
            if (currentStep === sortedSequence.length) {
                score += 10; 
                correctCount++; // <--- MỚI: Chỉ tính là 1 câu đúng khi xếp xong cả dãy
                
                scoreDisplay.innerText = score;
                feedbackDisplay.innerText = "Giỏi quá! Đúng thứ tự rồi!";
                feedbackDisplay.className = 'correct';
                
                setTimeout(generateQuestion, 1000);
            } else {
                feedbackDisplay.innerText = "Đúng rồi! Tìm số lớn hơn tiếp theo nào.";
                feedbackDisplay.className = 'correct';
            }
        } else {
            // === SAI ===
            wrongCount++; // <--- MỚI: Tăng số lần bấm sai
            
            feedbackDisplay.innerText = `Sai rồi! Số ${value} chưa phải là số bé nhất đâu!`;
            feedbackDisplay.className = 'incorrect';
            
            // Hiệu ứng rung lắc
            bubbleElement.classList.add('shake');
            setTimeout(() => bubbleElement.classList.remove('shake'), 400);
        }
    }

    // === GỬI ĐIỂM ===
    async function sendScoreToBackend(gameName, finalScore) {
        try {
            await fetch('/save_score', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ game_name: gameName, score: finalScore }),
            });
        } catch (error) { console.error(error); }
    }

    /**
     * Hết giờ
     */
    function endGame() {
        clearInterval(timerInterval);
        gameEnded = true;
        sendScoreToBackend('Sắp xếp dãy số (Level 3)', score);
        
        // 2. CẬP NHẬT GIAO DIỆN KẾT THÚC VỚI THỐNG KÊ CHI TIẾT
        gameContainer.innerHTML = `
            <a href="/learning" class="btn-exit-game">⬅ <span>Quay lại</span></a>
            <div style="text-align: center; padding: 40px;">
                <h2 style="color: #D32F2F; font-size: 2.5rem; margin-bottom: 10px;">Hết giờ!</h2>
                
                <div style="font-size: 1.2rem; margin-bottom: 20px;">
                    <p>✅ Hoàn thành: <b>${correctCount}</b> dãy số</p>
                    <p>❌ Bấm sai: <b>${wrongCount}</b> lần</p>
                </div>

                <p style="font-size: 1.2rem;">Tổng điểm của bé:</p>
                <div style="font-size: 4rem; font-weight: 900; color: #0288D1; margin: 10px 0;">${score}</div>
                
                <button onclick="window.location.reload()" class="button-primary" style="font-size: 1.2rem; padding: 15px 30px;">Chơi lại</button>
            </div>
        `;
    }

    /**
     * Đồng hồ đếm ngược
     */
    function startTimer() {
        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.innerText = timeLeft;
            
            if (timeLeft <= 10) {
                timerDisplay.style.color = "#D32F2F"; 
            }
            
            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    // Start game
    generateQuestion();
    startTimer();
});