document.addEventListener('DOMContentLoaded', () => {
    // === LẤY CÁC ELEMENT TỪ HTML ===
    const questionText = document.getElementById('question-text');
    const toyItems = document.querySelectorAll('.toy-item');
    const cartCountDisplay = document.getElementById('cart-count');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    const timerDisplay = document.getElementById('timer');
    const scoreDisplay = document.getElementById('score');
    
    // Element của Pop-up
    const feedbackModal = document.getElementById('suneo-feedback-modal');
    const suneoImage = document.getElementById('suneo-image');
    const suneoText = document.getElementById('suneo-text');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const retryBtn = document.getElementById('retry-btn');

    // === TỪ ĐIỂN SỐ -> CHỮ ===
    const numberWords = [
        "không", "một", "hai", "ba", "bốn", 
        "năm", "sáu", "bảy", "tám", "chín", "mười"
    ];

    // === BIẾN TRẠNG THÁI ===
    let score = 0;
    let timeLeft = 45; // Tăng thời gian lên xíu vì phải đọc chữ
    let currentCount = 0;
    let correctAnswer = 0;
    let timerInterval; 
    let isClickable = true; 
    let gameEnded = false; 

    /**
     * LOGIC MỚI: CHỈ HIỂN THỊ SỐ DẠNG CHỮ (KHÔNG CỘNG TRỪ)
     */
    function generateQuestion() {
        if (gameEnded) return;

        currentCount = 0;
        cartCountDisplay.innerText = currentCount;
        isClickable = true; 
        checkoutBtn.disabled = false; 
        
        // 1. Chọn ngẫu nhiên một số từ 1 đến 10
        correctAnswer = Math.floor(Math.random() * 10) + 1;

        // 2. Chuyển số đó thành chữ tiếng Việt
        let word = numberWords[correctAnswer];

        // 3. Hiển thị chữ lên màn hình
        // Kết quả sẽ là: "Tớ muốn mua chính xác [tám] món đồ chơi!"
        questionText.innerText = word; 
        
        feedbackModal.classList.remove('active');
    }

    /**
     * Xử lý khi bấm vào đồ chơi (Bỏ vào giỏ)
     */
    function pickItem() {
        if (!isClickable || gameEnded) return;
        currentCount++;
        cartCountDisplay.innerText = currentCount;
    }

    /**
     * Xử lý khi bấm "Thanh Toán"
     */
    function checkAnswer() {
        if (!isClickable || gameEnded) return; 
        isClickable = false; 
        checkoutBtn.disabled = true; 
        
        feedbackModal.classList.add('active');

        // Lấy chữ của đáp án đúng để hiện trong thông báo (ví dụ: "tám")
        let correctWord = numberWords[correctAnswer];

        if (currentCount === correctAnswer) {
            // === ĐÚNG ===
            score += 10; 
            scoreDisplay.innerText = score;
            suneoText.innerText = `Chuẩn luôn! Đúng là ${correctWord} món rồi!`;
            // suneoImage.src = "/static/img/suneo_happy.png"; 
            
            nextQuestionBtn.style.display = 'block';
            retryBtn.style.display = 'none';
        } else {
            // === SAI ===
            let message = '';
            // suneoImage.src = "/static/img/suneo_sad.png"; 
            
            if (currentCount < correctAnswer) {
                message = `Thiếu rồi! Tớ cần mua ${correctWord} món, mà cậu mới lấy có ${currentCount} món thôi.`;
            } else {
                message = `Nhiều quá! Tớ chỉ cần ${correctWord} món thôi, cậu lấy tới ${currentCount} món rồi!`;
            }

            suneoText.innerText = message;
            nextQuestionBtn.style.display = 'none';
            retryBtn.style.display = 'block';
            retryBtn.innerText = "Làm lại"; 
        }
    }

    // === GỬI ĐIỂM ===
    async function sendScoreToBackend(gameName, finalScore) {
        try {
            const response = await fetch('/save_score', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ game_name: gameName, score: finalScore }),
            });
            if (response.ok) console.log('Đã lưu điểm.');
        } catch (error) { console.error('Lỗi:', error); }
    }

    // === HẾT GIỜ ===
    function endGame() {
        clearInterval(timerInterval); 
        isClickable = false; 
        gameEnded = true; 
        checkoutBtn.disabled = true; 
        
        feedbackModal.classList.add('active');
        suneoText.innerText = `Hết giờ! Điểm của cậu: ${score}.`;
        // suneoImage.src = "/static/img/suneo.png";
        
        nextQuestionBtn.style.display = 'none'; 
        retryBtn.style.display = 'block'; 
        retryBtn.innerText = "Chơi lại";

        sendScoreToBackend('Chọn số lượng (Level 2)', score);
    }

    // === ĐỒNG HỒ ĐẾM NGƯỢC ===
    function startTimer() {
        timeLeft = 45; 
        gameEnded = false; 
        isClickable = true;
        checkoutBtn.disabled = false;
        
        timerDisplay.innerText = timeLeft;
        timerDisplay.classList.remove('low-time'); 
        
        clearInterval(timerInterval); 
        timerInterval = setInterval(() => {
            if (gameEnded) { clearInterval(timerInterval); return; }
            timeLeft--;
            timerDisplay.innerText = timeLeft;
            if (timeLeft <= 10) timerDisplay.classList.add('low-time'); 
            if (timeLeft <= 0) endGame();
        }, 1000);
    }

    // === SỰ KIỆN ===
    toyItems.forEach(item => { item.addEventListener('click', pickItem); });
    checkoutBtn.addEventListener('click', checkAnswer);

    nextQuestionBtn.addEventListener('click', () => { if (!gameEnded) generateQuestion(); });
    
    retryBtn.addEventListener('click', () => {
        if (retryBtn.innerText === "Chơi lại") {
            score = 0; 
            scoreDisplay.innerText = score;
            startTimer(); 
        } 
        generateQuestion();
    });

    // START
    generateQuestion();
    startTimer();
});