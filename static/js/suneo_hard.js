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
        // Chọn số thứ nhất (từ 1 đến 5 để đảm bảo số thứ hai có không gian chọn)
        let num1 = getRandomInt(1, 5);
        
        // Chọn số thứ hai sao cho tổng không vượt quá 10
        // Ví dụ: num1 = 4, thì max của num2 là 10 - 4 = 6. num2 sẽ random từ 1 đến 6.
        let maxNum2 = 10 - num1;
        let num2 = getRandomInt(1, maxNum2);
        
        correctAnswer = num1 + num2;
        
        // Hiển thị phép tính
        mathDisplay.innerText = `${num1} + ${num2} = ?`;

        // 2. Tạo 4 đáp án (1 đúng + 3 sai)
        let options = [correctAnswer];
        
        while (options.length < 4) { 
            // Tạo đáp án sai lệch trong khoảng -3 đến +3
            let offset = getRandomInt(-3, 3);
            if (offset === 0) offset = 1; 
            
            let wrongAns = correctAnswer + offset;
            
            // Đảm bảo: 
            // - Không trùng đáp án đã có
            // - Không âm (>= 0)
            // - Không quá lớn (<= 15 cho bé đỡ rối)
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
            score += 10; // 10 điểm mỗi câu
            scoreDisplay.innerText = score;
            suneoText.innerText = "Chính xác! Cậu giỏi quá!";
            
            // Nếu có ảnh vui/buồn thì uncomment dòng dưới
            // suneoImage.src = "/static/img/suneo_happy.png";
            
            nextQuestionBtn.style.display = 'block';
            retryBtn.style.display = 'none';
        } else {
            // === SAI ===
            suneoText.innerText = `Ôi sai rồi! ${mathDisplay.innerText.replace('?', correctAnswer)} mới đúng nhé!`;
            // suneoImage.src = "/static/img/suneo_sad.png";
            
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
        suneoText.innerText = `Hết giờ! Cậu đạt được ${score} điểm!`;
        
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