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
     * Tạo câu hỏi Tính Nhanh (Cộng hoặc Trừ, 1 Chữ số)
     */
    function generateQuestion() {
        if (gameEnded) return;

        isClickable = true;
        feedbackDisplay.innerText = '';
        answersArea.innerHTML = '';

        // Random chọn phép tính: 0 = Cộng, 1 = Trừ
        const operator = Math.random() > 0.5 ? '+' : '-';
        let num1, num2;

        if (operator === '+') {
            // PHÉP CỘNG: Hai số 1 chữ số (0-9)
            num1 = getRandomInt(0, 9);
            num2 = getRandomInt(0, 9);
            correctAnswer = num1 + num2;
        } else {
            // PHÉP TRỪ: Hai số 1 chữ số
            // Đảm bảo số bị trừ >= số trừ để không ra âm
            num1 = getRandomInt(1, 9);
            num2 = getRandomInt(0, num1);
            correctAnswer = num1 - num2;
        }

        // Hiển thị câu hỏi
        questionText.innerText = `${num1} ${operator} ${num2} = ?`;

        // Tạo 4 đáp án (1 đúng, 3 sai)
        let options = [correctAnswer];
        while (options.length < 4) {
            // Sai lệch từ -5 đến +5
            let offset = getRandomInt(-5, 5);
            let wrongAns = correctAnswer + offset;
            
            // Đảm bảo: Khác đáp án đúng, Không âm
            if (wrongAns >= 0 && !options.includes(wrongAns)) {
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
            feedbackDisplay.innerText = "Tuyệt vời! Tính nhanh quá! ⚡";
            feedbackDisplay.style.color = "#00C853";
            btn.classList.add('correct');
        } else {
            // SAI
            feedbackDisplay.innerText = `Chậm một chút! Đáp án là ${correctAnswer}.`;
            feedbackDisplay.style.color = "#D50000";
            btn.classList.add('wrong');
            
            // Hiện đáp án đúng
            const allBtns = document.querySelectorAll('.answer-btn');
            allBtns.forEach(b => {
                if (parseInt(b.innerText) === correctAnswer) {
                    b.classList.add('correct');
                }
            });
        }

        // Chuyển câu nhanh hơn (1.2s) vì là game tính nhanh
        setTimeout(generateQuestion, 1200);
    }

    async function sendScoreToBackend(gameName, finalScore) {
        try {
            await fetch('/save_score', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ game_name: gameName, score: finalScore }),
            });
        } catch (error) { console.error(error); }
    }

    function endGame() {
        clearInterval(timerInterval);
        gameEnded = true;
        sendScoreToBackend('Tính cộng trừ (Level 3)', score);
        
        gameContainer.innerHTML = `
            <a href="/learning" class="btn-exit-game">⬅ <span>Quay lại</span></a>
            <div style="text-align: center; padding: 40px;">
                <h2 style="color: #D84315; font-size: 2.5rem; margin-bottom: 20px;">Hết giờ!</h2>
                <p style="font-size: 1.2rem;">Điểm cao của bé:</p>
                <div style="font-size: 4rem; font-weight: 900; color: #BF360C; margin: 20px 0;">${score}</div>
                <button onclick="window.location.reload()" 
                        style="padding: 15px 30px; font-size: 1.2rem; background: #FF5722; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;">
                    Chơi lại
                </button>
            </div>
        `;
    }

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