document.addEventListener('DOMContentLoaded', () => {
    // === LẤY CÁC ELEMENT TỪ HTML ===
    const questionText = document.getElementById('question-text');
    const optionsArea = document.getElementById('options-area');
    
    const timerDisplay = document.getElementById('timer');
    const scoreDisplay = document.getElementById('score');
    
    const feedbackModal = document.getElementById('suneo-feedback-modal');
    const suneoImage = document.getElementById('suneo-image');
    const suneoText = document.getElementById('suneo-text');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const retryBtn = document.getElementById('retry-btn');

    // === DANH SÁCH SỐ BẰNG CHỮ (0 - 10) ===
    // Index của mảng sẽ trùng với giá trị số (ví dụ: index 1 là "một")
    const numberWords = [
        "không", "một", "hai", "ba", "bốn", 
        "năm", "sáu", "bảy", "tám", "chín", "mười"
    ];

    // === BIẾN TRẠNG THÁI ===
    let score = 0;
    let timeLeft = 60;
    let targetNumber = 0;
    let timerInterval; 
    let gameEnded = false; 

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    /**
     * Hàm tạo câu hỏi mới
     */
    function generateQuestion() {
        if (gameEnded) return;

        // 1. Chọn số cần tìm (từ 1 đến 10)
        targetNumber = getRandomInt(1, 10);

        // 2. HIỂN THỊ CÂU HỎI BẰNG CHỮ TIẾNG VIỆT
        // Thay vì hiện số, ta lấy chữ trong mảng numberWords
        questionText.innerText = numberWords[targetNumber]; 

        // 3. Tạo danh sách các lựa chọn (Vẫn hiển thị số trên thẻ để bé chọn)
        let options = [targetNumber];
        
        while (options.length < 3) { 
            let wrongNum = getRandomInt(1, 10);
            if (!options.includes(wrongNum)) {
                options.push(wrongNum);
            }
        }

        shuffleArray(options);

        // 4. Render ra giao diện
        optionsArea.innerHTML = ''; 
        options.forEach(num => {
            const card = document.createElement('div');
            card.classList.add('number-card');
            
            // Trên thẻ bài thì vẫn hiện số (1, 2, 3...)
            card.innerText = num;
            
            card.onclick = () => checkAnswer(num);
            optionsArea.appendChild(card);
        });
        
        feedbackModal.classList.remove('active');
    }

    /**
     * Kiểm tra đáp án
     */
    function checkAnswer(selectedNum) {
        if (gameEnded) return; 

        feedbackModal.classList.add('active');

        if (selectedNum === targetNumber) {
            // === ĐÚNG ===
            score += 10;
            scoreDisplay.innerText = score;
            
            // Lời khen cũng dùng chữ tiếng Việt cho tự nhiên
            suneoText.innerText = `Giỏi quá! Đúng là số "${numberWords[targetNumber]}" rồi!`;
            
            nextQuestionBtn.style.display = 'block';
            retryBtn.style.display = 'none';
        } else {
            // === SAI ===
            suneoText.innerText = `Sai rồi! Cậu vừa chọn số ${selectedNum}, nhưng tớ cần tìm số "${numberWords[targetNumber]}" cơ!`;
            
            nextQuestionBtn.style.display = 'none';
            retryBtn.style.display = 'block';
            retryBtn.innerText = "Chọn lại đi";
        }
    }

    // === HÀM LƯU ĐIỂM ===
    async function sendScoreToBackend(gameName, finalScore) {
        try {
            const response = await fetch('/save_score', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ game_name: gameName, score: finalScore }),
            });
            if (response.ok) console.log('Đã lưu điểm.');
        } catch (error) {
            console.error('Lỗi gửi điểm:', error);
        }
    }

    function endGame() {
        clearInterval(timerInterval); 
        gameEnded = true; 
        
        feedbackModal.classList.add('active');
        suneoText.innerText = `Hết giờ rồi! Cậu đạt được ${score} điểm.`;
        
        nextQuestionBtn.style.display = 'none'; 
        retryBtn.style.display = 'block'; 
        retryBtn.innerText = "Chơi lại từ đầu";

        sendScoreToBackend('Làm quen số (Level 1)', score);
    }

    function startTimer() {
        timeLeft = 60; 
        gameEnded = false; 
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

    // === EVENT LISTENERS ===
    nextQuestionBtn.addEventListener('click', () => {
        if (!gameEnded) generateQuestion();
    });
    
    retryBtn.addEventListener('click', () => {
        if (retryBtn.innerText === "Chơi lại từ đầu") {
            score = 0;
            scoreDisplay.innerText = score;
            startTimer();
            generateQuestion();
        } else {
            feedbackModal.classList.remove('active');
        }
    });

    // START
    generateQuestion();
    startTimer();
});