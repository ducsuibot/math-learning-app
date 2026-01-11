document.addEventListener('DOMContentLoaded', () => {
    // === DOM ELEMENTS ===
    const mathDisplay = document.getElementById('math-display');
    const optionsArea = document.getElementById('options-area');
    const timerDisplay = document.getElementById('timer');
    const scoreDisplay = document.getElementById('score');
    
    // Modal Elements
    const feedbackModal = document.getElementById('suneo-feedback-modal');
    const suneoImage = document.getElementById('suneo-image');
    const suneoText = document.getElementById('suneo-text');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const retryBtn = document.getElementById('retry-btn');

    // === GAME VARIABLES ===
    let score = 0;
    let timeLeft = 60; // 60 giây
    let correctAnswer = 0;
    let timerInterval; 
    let gameEnded = false; 
    
    // 1. KHAI BÁO BIẾN ĐẾM MỚI
    let correctCount = 0; // <--- MỚI: Đếm số câu đúng
    let wrongCount = 0;   // <--- MỚI: Đếm số câu sai

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
     * LOGIC MỚI: CHỈ CỘNG, TỔNG <= 10
     */
    function generateQuestion() {
        if (gameEnded) return;

        // 1. Tạo số ngẫu nhiên
        let num1 = getRandomInt(1, 5);
        let maxNum2 = 10 - num1;
        let num2 = getRandomInt(1, maxNum2);
        
        correctAnswer = num1 + num2;
        
        // Hiển thị phép tính
        mathDisplay.innerText = `${num1} + ${num2} = ?`;

        // 2. Tạo 4 đáp án (1 đúng + 3 sai)
        let options = [correctAnswer];
        
        while (options.length < 4) { 
            let offset = getRandomInt(-3, 3);
            if (offset === 0) offset = 1; 
            
            let wrongAns = correctAnswer + offset;
            
            if (!options.includes(wrongAns) && wrongAns >= 0 && wrongAns <= 15) {
                options.push(wrongAns);
            }
        }

        shuffleArray(options);

        // 3. Render ra giao diện
        optionsArea.innerHTML = ''; 
        options.forEach(num => {
            const card = document.createElement('div');
            card.classList.add('hard-mode-card');
            card.innerText = num;
            
            card.onclick = () => checkAnswer(num);
            
            optionsArea.appendChild(card);
        });
        
        feedbackModal.classList.remove('active');
    }

    function checkAnswer(selectedNum) {
        if (gameEnded) return; 

        feedbackModal.classList.add('active');

        if (selectedNum === correctAnswer) {
            // === ĐÚNG ===
            score += 10; 
            correctCount++; // <--- MỚI: Tăng số câu đúng
            
            scoreDisplay.innerText = score;
            suneoText.innerText = "Chính xác! Cậu giỏi quá!";
            
            nextQuestionBtn.style.display = 'block';
            retryBtn.style.display = 'none';
        } else {
            // === SAI ===
            wrongCount++; // <--- MỚI: Tăng số câu sai
            
            suneoText.innerText = `Ôi sai rồi! ${mathDisplay.innerText.replace('?', correctAnswer)} mới đúng nhé!`;
            
            nextQuestionBtn.style.display = 'none';
            retryBtn.style.display = 'block';
            retryBtn.innerText = "Thử lại nào";
        }
    }

    // === HÀM GỬI ĐIỂM ===
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
        
        // 2. HIỂN THỊ KẾT QUẢ CHI TIẾT
        // Sử dụng innerHTML để xuống dòng cho đẹp
        suneoText.innerHTML = `Hết giờ!<br>
        <b>Đúng:</b> ${correctCount} câu<br>
        <b>Sai:</b> ${wrongCount} câu<br>
        <b>Tổng điểm:</b> ${score}`;
        
        nextQuestionBtn.style.display = 'none'; 
        retryBtn.style.display = 'block'; 
        retryBtn.innerText = "Chơi lại từ đầu";

        sendScoreToBackend('Thử thách số lớn (Level 3)', score);
    }

    function startTimer() {
        timeLeft = 60; 
        gameEnded = false; 
        timerDisplay.innerText = timeLeft;
        timerDisplay.classList.remove('low-time'); 
        timerDisplay.style.color = "#d32f2f"; 
        
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
            // 3. RESET CÁC BIẾN KHI CHƠI LẠI
            score = 0;
            correctCount = 0; // <--- MỚI
            wrongCount = 0;   // <--- MỚI
            
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