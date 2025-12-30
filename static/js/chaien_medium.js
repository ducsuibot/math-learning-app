document.addEventListener('DOMContentLoaded', () => {
    // === DOM ELEMENTS ===
    const timerDisplay = document.getElementById('timer');
    const scoreDisplay = document.getElementById('score');
    const questionText = document.getElementById('question-text');
    const answersArea = document.getElementById('answers-area');
    const feedbackDisplay = document.getElementById('game-feedback');
    const gameContainer = document.querySelector('.game-container');

    // === GAME VARS ===
    let score = 0;
    let timeLeft = 60; 
    let correctAnswer = 0;
    let timerInterval;
    let gameEnded = false;
    let isClickable = true;

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Tạo câu hỏi phép trừ (1 CHỮ SỐ)
     */
    function generateQuestion() {
        if (gameEnded) return;

        isClickable = true;
        feedbackDisplay.innerText = '';
        answersArea.innerHTML = '';

        // 1. Số bị trừ (num1) từ 2 đến 9
        // (Để đảm bảo là 1 chữ số và đủ lớn để trừ)
        let num1 = getRandomInt(2, 9);
        
        // 2. Số trừ (num2) từ 1 đến num1
        // (Để đảm bảo kết quả không âm và là 1 chữ số)
        let num2 = getRandomInt(1, num1);
        
        correctAnswer = num1 - num2;

        // Hiển thị câu hỏi
        questionText.innerText = `${num1} - ${num2} = ?`;

        // 3. Tạo 4 đáp án (gồm 1 đúng + 3 sai)
        let options = [correctAnswer];
        while (options.length < 4) {
            // Tạo đáp án sai lệch nhỏ (-3 đến +3)
            let offset = getRandomInt(-3, 3);
            let wrongAns = correctAnswer + offset;
            
            // Đảm bảo: 
            // - Khác đáp án đúng
            // - Không âm (>= 0)
            // - Là số có 1 chữ số (<= 9)
            if (wrongAns >= 0 && wrongAns <= 9 && !options.includes(wrongAns)) {
                options.push(wrongAns);
            }
        }

        // Trộn vị trí đáp án
        options.sort(() => Math.random() - 0.5);

        // Hiển thị nút bấm
        options.forEach(val => {
            const btn = document.createElement('div');
            btn.classList.add('answer-btn');
            btn.innerText = val;
            
            btn.addEventListener('click', () => checkAnswer(btn, val));
            answersArea.appendChild(btn);
        });
    }

    /**
     * Kiểm tra đáp án
     */
    function checkAnswer(btn, value) {
        if (!isClickable || gameEnded) return;
        isClickable = false;

        if (value === correctAnswer) {
            // ĐÚNG
            score += 10;
            scoreDisplay.innerText = score;
            feedbackDisplay.innerText = "Chính xác! Bé giỏi quá! 🎤";
            feedbackDisplay.style.color = "#4CAF50";
            btn.classList.add('correct');
        } else {
            // SAI
            feedbackDisplay.innerText = `Sai rồi! Kết quả là ${correctAnswer} nhé!`;
            feedbackDisplay.style.color = "#F44336";
            btn.classList.add('wrong');
            
            // Hiện đáp án đúng
            const allBtns = document.querySelectorAll('.answer-btn');
            allBtns.forEach(b => {
                if (parseInt(b.innerText) === correctAnswer) {
                    b.classList.add('correct');
                }
            });
        }

        // Chuyển câu sau 1.5 giây
        setTimeout(generateQuestion, 1500);
    }

    // Gửi điểm
    async function sendScoreToBackend(gameName, finalScore) {
        try {
            await fetch('/save_score', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ game_name: gameName, score: finalScore }),
            });
        } catch (error) { console.error(error); }
    }

    // Hết giờ
    function endGame() {
        clearInterval(timerInterval);
        gameEnded = true;
        sendScoreToBackend('Phép trừ đơn giản (Level 2)', score);
        
        gameContainer.innerHTML = `
            <a href="/learning" class="btn-exit-game">⬅ <span>Quay lại</span></a>
            <div style="text-align: center; padding: 40px;">
                <h2 style="color: #E65100; font-size: 2.5rem; margin-bottom: 20px;">Hết giờ!</h2>
                <p style="font-size: 1.2rem;">Điểm của bé:</p>
                <div style="font-size: 4rem; font-weight: 900; color: #1976D2; margin: 20px 0;">${score}</div>
                <button onclick="window.location.reload()" 
                        style="padding: 15px 30px; font-size: 1.2rem; background: #FF9800; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;">
                    Chơi lại
                </button>
            </div>
        `;
    }

    // Đồng hồ
    function startTimer() {
        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.innerText = timeLeft;
            if (timeLeft <= 10) timerDisplay.style.color = "red";
            if (timeLeft <= 0) endGame();
        }, 1000);
    }

    generateQuestion();
    startTimer();
});