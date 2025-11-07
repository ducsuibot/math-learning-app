document.addEventListener('DOMContentLoaded', () => {
    // === LẤY CÁC ELEMENT TỪ HTML ===
    const questionText = document.getElementById('question-text');
    const toyItems = document.querySelectorAll('.toy-item');
    const cartCountDisplay = document.getElementById('cart-count');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    // Thêm element cho điểm và thời gian
    const timerDisplay = document.getElementById('timer');
    const scoreDisplay = document.getElementById('score');
    
    // Element của Pop-up
    const feedbackModal = document.getElementById('suneo-feedback-modal');
    const suneoImage = document.getElementById('suneo-image');
    const suneoText = document.getElementById('suneo-text');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const retryBtn = document.getElementById('retry-btn');

    // === BIẾN TRẠNG THÁI CỦA GAME ===
    let score = 0;
    let timeLeft = 30; // 30 giây
    let currentCount = 0;
    let correctAnswer = 0;
    let timerInterval; // Biến giữ bộ đếm
    let isClickable = true; // Biến cờ ngăn click nhiều lần
    let gameEnded = false; // Cờ kiểm tra game đã kết thúc chưa

    /**
     * Hàm tạo câu hỏi mới
     */
    function generateQuestion() {
        if (gameEnded) return; // Không tạo câu hỏi mới nếu đã hết giờ

        currentCount = 0;
        cartCountDisplay.innerText = currentCount;
        isClickable = true; // Cho phép click lại
        checkoutBtn.disabled = false; // Mở lại nút
        
        const isAddition = Math.random() > 0.3;
        let num1, num2;

        if (isAddition) {
            num1 = Math.floor(Math.random() * 5) + 1;
            num2 = Math.floor(Math.random() * 5) + 1;
            correctAnswer = num1 + num2;
            questionText.innerText = `${num1} + ${num2}`;
        } else {
            num1 = Math.floor(Math.random() * 5) + 5;
            num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
            correctAnswer = num1 - num2;
            questionText.innerText = `${num1} - ${num2}`;
        }
        
        feedbackModal.classList.remove('active');
    }

    /**
     * Hàm xử lý khi nhấp vào món đồ chơi
     */
    function pickItem() {
        if (!isClickable || gameEnded) return; // Không cho click nếu đang chờ phản hồi hoặc game hết giờ
        currentCount++;
        cartCountDisplay.innerText = currentCount;
    }

    /**
     * Hàm xử lý khi nhấn nút "Thanh Toán"
     */
    function checkAnswer() {
        if (!isClickable || gameEnded) return; 
        isClickable = false; // Khóa click
        checkoutBtn.disabled = true; // Khóa nút thanh toán
        
        feedbackModal.classList.add('active');

        if (currentCount === correctAnswer) {
            // === ĐÚNG ===
            score += 10; // Cộng 10 điểm
            scoreDisplay.innerText = score;
            suneoText.innerText = "Chuẩn luôn! Tớ sẽ khoe đống này với Nobita!";
            suneoImage.src = "/static/img/suneo.png"; // Ảnh Xeko vui
            nextQuestionBtn.style.display = 'block';
            retryBtn.style.display = 'none';
        } else {
            // === SAI (Thiếu hoặc Thừa) ===
            let message = '';
            let imageSrc = "/static/img/suneo.png"; // Ảnh Xeko buồn
            
            if (currentCount < correctAnswer) {
                message = `Trời ơi! Cần ${correctAnswer} món mà cậu lấy có ${currentCount} món! Thiếu rồi! Làm lại đi!`;
            } else {
                message = `Thôi chết! Tớ chỉ mang đủ tiền mua ${correctAnswer} món thôi! Lấy dư ${currentCount} món rồi! Làm lại mau!`;
            }

            suneoText.innerText = message;
            suneoImage.src = imageSrc;
            nextQuestionBtn.style.display = 'none';
            retryBtn.style.display = 'block';
            retryBtn.innerText = "Làm lại"; // Đổi chữ nút
        }
    }

    // ==========================================================
    // === THÊM HÀM LƯU ĐIỂM VÀO ĐÂY ===
    // ==========================================================
    /**
     * Hàm gửi điểm số lên server
     * @param {string} gameName - Tên game
     * @param {number} finalScore - Điểm số cuối cùng
     */
    async function sendScoreToBackend(gameName, finalScore) {
        try {
            const response = await fetch('/save_score', { // Gọi đến route /save_score trong app.py
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    game_name: gameName,
                    score: finalScore
                }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Server response:', result.message); // In ra "Lưu điểm thành công!"
            } else {
                console.error('Không thể lưu điểm lên server.');
            }
        } catch (error) {
            // Không làm gì nếu bị lỗi (ví dụ: user chưa đăng nhập), để game tiếp tục
            console.error('Lỗi khi gửi điểm:', error);
        }
    }
    // ==========================================================

    /**
     * Hàm xử lý khi hết giờ
     */
    function endGame() {
        clearInterval(timerInterval); 
        isClickable = false; 
        gameEnded = true; 
        checkoutBtn.disabled = true; 
        
        feedbackModal.classList.add('active');
        
        suneoText.innerText = `Hết giờ rồi! Điểm cuối cùng của cậu là ${score}. Muốn chơi lại không?`;
        suneoImage.src = "/static/img/suneo.png";
        
        nextQuestionBtn.style.display = 'none'; 
        retryBtn.style.display = 'block'; 
        retryBtn.innerText = "Chơi lại";

        // === GỌI HÀM LƯU ĐIỂM KHI HẾT GIỜ ===
        sendScoreToBackend('Siêu thị Xeko', score);
        // ===================================
    }

    /**
     * Hàm bắt đầu đếm ngược thời gian
     */
    function startTimer() {
        timeLeft = 30; 
        gameEnded = false; 
        isClickable = true;
        checkoutBtn.disabled = false;
        
        timerDisplay.innerText = timeLeft;
        timerDisplay.classList.remove('low-time'); 
        
        clearInterval(timerInterval); 

        timerInterval = setInterval(() => {
            if (gameEnded) { 
                clearInterval(timerInterval);
                return;
            }
            timeLeft--;
            timerDisplay.innerText = timeLeft;
            
            if (timeLeft <= 10) {
                timerDisplay.classList.add('low-time'); 
            }

            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    // === GẮN SỰ KIỆN ===
    toyItems.forEach(item => {
        item.addEventListener('click', pickItem);
    });

    checkoutBtn.addEventListener('click', checkAnswer);

    // Nút "Câu tiếp theo" (khi trả lời đúng)
    nextQuestionBtn.addEventListener('click', () => {
        if (gameEnded) return; // Nếu hết giờ rồi thì không làm gì
        generateQuestion();
    });
    
    // Nút "Làm lại" (khi trả lời sai hoặc hết giờ)
    retryBtn.addEventListener('click', () => {
        if (retryBtn.innerText === "Chơi lại") {
            // Nếu hết giờ, "Chơi lại" = Chơi lại game mới
            score = 0;
            scoreDisplay.innerText = score;
            startTimer(); // Bắt đầu lại đồng hồ
        } 
        
        // Luôn tạo câu hỏi mới (hoặc reset giỏ hàng)
        generateQuestion();
    });

    // === BẮT ĐẦU GAME ===
    generateQuestion();
    startTimer();
});