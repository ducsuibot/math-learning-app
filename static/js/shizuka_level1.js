document.addEventListener('DOMContentLoaded', () => {
    const timerDisplay = document.getElementById('timer');
    const scoreDisplay = document.getElementById('score');
    const leftPanel = document.getElementById('left-panel');
    const rightPanel = document.getElementById('right-panel');
    const answerBox = document.getElementById('answer-box');
    const choiceButtons = document.querySelectorAll('.control-button');
    const feedbackDisplay = document.getElementById('game-feedback');
    const gameContainer = document.querySelector('.game-container');

    let score = 0;
    let timeLeft = 30;
    let leftNumber = 0;
    let rightNumber = 0;
    let timerInterval;
    let isClickable = true;

    function generateQuestion() {
        // Tạo 2 số ngẫu nhiên từ 1 đến 20 (Khác với đếm ảnh chỉ đến 10)
        leftNumber = Math.floor(Math.random() * 20) + 1;
        rightNumber = Math.floor(Math.random() * 20) + 1;
        
        // Hiển thị trực tiếp số thay vì ảnh
        leftPanel.innerHTML = `<div class="big-number">${leftNumber}</div>`;
        rightPanel.innerHTML = `<div class="big-number">${rightNumber}</div>`;

        answerBox.innerText = '?';
        feedbackDisplay.innerText = '';
        feedbackDisplay.className = '';
        isClickable = true;
    }

    function checkAnswer(playerChoice) {
        if (!isClickable || timeLeft <= 0) return;
        isClickable = false;

        let correctAnswer;
        if (leftNumber > rightNumber) correctAnswer = '>';
        else if (leftNumber < rightNumber) correctAnswer = '<';
        else correctAnswer = '=';

        answerBox.innerText = playerChoice;

        if (playerChoice === correctAnswer) {
            score += 10;
            scoreDisplay.innerText = score;
            feedbackDisplay.innerText = 'Chính xác! Bé giỏi quá!';
            feedbackDisplay.className = 'correct';
        } else {
            feedbackDisplay.innerText = 'Sai rồi! Thử lại câu sau nhé!';
            feedbackDisplay.className = 'incorrect';
        }

        setTimeout(generateQuestion, 1500);
    }
    
    // Gửi điểm về server
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
        isClickable = false;
        sendScoreToBackend('So sánh hai số (Level 1)', score);
        
        gameContainer.innerHTML = `
            <div class="game-over-screen">
                <h2>Hết giờ!</h2>
                <p>Điểm của bé: <span class="final-score">${score}</span></p>
                <button onclick="window.location.reload()" class="button-primary">Chơi lại</button>
                <a href="/learning" class="button-secondary" style="margin-top: 15px;">Thoát ra</a>
            </div>
        `;
    }

    function startTimer() {
        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.innerText = timeLeft;
            if (timeLeft <= 0) endGame();
        }, 1000);
    }

    choiceButtons.forEach(button => {
        button.addEventListener('click', () => {
            checkAnswer(button.dataset.choice);
        });
    });

    generateQuestion();
    startTimer();
});