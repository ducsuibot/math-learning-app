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

    /**
     * Hàm tạo câu hỏi mới
     */
    function generateQuestion() {
        currentCount = 0;
        cartCountDisplay.innerText = currentCount;
        isClickable = true; // Cho phép click lại
        
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
        if (!isClickable) return; // Không cho click nếu đang chờ phản hồi
        currentCount++;
        cartCountDisplay.innerText = currentCount;
    }

    /**
     * Hàm xử lý khi nhấn nút "Thanh Toán"
     */
    function checkAnswer() {
        if (!isClickable) return; // Không cho click nếu đã click
        isClickable = false; // Khóa click
        
        feedbackModal.classList.add('active');

        if (currentCount === correctAnswer) {
            // === ĐÚNG ===
            score += 10; // Cộng 10 điểm
            scoreDisplay.innerText = score;
            suneoText.innerText = "Chuẩn luôn! Tớ sẽ khoe đống này với Nobita!";
            suneoImage.src = "/static/img/suneo.png";
            nextQuestionBtn.style.display = 'block';
            retryBtn.style.display = 'none';
        } else if (currentCount < correctAnswer) {
            // === SAI (Thiếu) ===
            suneoText.innerText = `Trời ơi! Cần ${correctAnswer} món mà cậu lấy có ${currentCount} món! Thiếu rồi! Làm lại đi!`;
            suneoImage.src = "/static/img/suneo.png";
            nextQuestionBtn.style.display = 'none';
            retryBtn.style.display = 'block';
        } else {
            // === SAI (Thừa) ===
            suneoText.innerText = `ôi! Tớ chỉ mang đủ tiền mua ${correctAnswer} món thôi! Lấy dư rồi! cậu Làm lại đi!`;
            suneoImage.src = "/static/img/suneo.png";
            nextQuestionBtn.style.display = 'none';
            retryBtn.style.display = 'block';
        }
    }

    /**
     * Hàm xử lý khi hết giờ
     */
    function endGame() {
        clearInterval(timerInterval); // Dừng đồng hồ
        isClickable = false; // Khóa game
        feedbackModal.classList.add('active'); // Hiện pop-up
        
        // Hiển thị thông báo hết giờ và điểm cuối cùng
        suneoText.innerText = `Hết giờ rồi! Điểm cuối cùng của cậu là ${score}. Muốn chơi lại không?`;
        suneoImage.src = "/static/img/suneo.png";
        
        nextQuestionBtn.style.display = 'none'; // Ẩn nút "Câu tiếp"
        retryBtn.style.display = 'block'; // Hiện nút "Làm lại"
        retryBtn.innerText = "Chơi lại"; // Đổi chữ nút
    }

    /**
     * Hàm bắt đầu đếm ngược thời gian
     */
    function startTimer() {
        timeLeft = 30; // Reset thời gian
        timerDisplay.innerText = timeLeft;
        timerDisplay.classList.remove('low-time'); // Xóa class cảnh báo
        
        clearInterval(timerInterval); // Xóa đồng hồ cũ (nếu có)

        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.innerText = timeLeft;
            
            if (timeLeft <= 10) {
                timerDisplay.classList.add('low-time'); // Thêm class cảnh báo khi còn 10 giây
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
    nextQuestionBtn.addEventListener('click', generateQuestion);
    
    // Nút "Làm lại" (khi trả lời sai)
    retryBtn.addEventListener('click', () => {
        if (timeLeft <= 0) {
            // Nếu hết giờ, "Làm lại" = Chơi lại game mới
            score = 0;
            scoreDisplay.innerText = score;
            generateQuestion();
            startTimer();
        } else {
            // Nếu chưa hết giờ, chỉ reset giỏ hàng
            currentCount = 0;
            cartCountDisplay.innerText = currentCount;
            feedbackModal.classList.remove('active');
            isClickable = true; // Cho phép click lại
        }
    });

    // === BẮT ĐẦU GAME ===
    generateQuestion();
    startTimer();
});