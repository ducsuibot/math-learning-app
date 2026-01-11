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

    // 1. KHAI BÁO BIẾN ĐẾM
    let correctCount = 0; 
    let wrongCount = 0;   

    function generateQuestion() {
        // Tạo 2 số ngẫu nhiên từ 1 đến 20
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
            // === ĐÚNG ===
            score += 10;
            correctCount++; 
            
            scoreDisplay.innerText = score;
            feedbackDisplay.innerText = 'Chính xác! Bé giỏi quá!';
            feedbackDisplay.className = 'correct';
        } else {
            // === SAI ===
            wrongCount++; 
            
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
        
        // 2. CẬP NHẬT MÀN HÌNH KẾT THÚC (ĐÃ SỬA MÀU SẮC & NỀN)
        gameContainer.innerHTML = `
            <div class="game-over-screen" style="
                background: rgba(255, 255, 255, 0.95); 
                padding: 40px; 
                border-radius: 20px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.3); 
                text-align: center;
                max-width: 500px;
                margin: 0 auto;">
                
                <h2 style="color: #D84315; font-size: 2.5rem; margin-bottom: 20px;">Hết giờ!</h2>
                
                <div style="font-size: 1.3rem; margin-bottom: 20px;">
                    <p style="color: #2E7D32; font-weight: bold; margin: 10px 0;">✅ Đúng: <b>${correctCount}</b> câu</p>
                    <p style="color: #C62828; font-weight: bold; margin: 10px 0;">❌ Sai: <b>${wrongCount}</b> câu</p>
                </div>

                <p style="font-size: 1.2rem; color: #333; margin-bottom: 5px;">Tổng điểm của bé:</p>
                <div class="final-score" style="font-size: 3.5rem; font-weight: 900; color: #1565C0; margin-bottom: 25px;">${score}</div>
                
                <button onclick="window.location.reload()" class="button-primary" style="padding: 12px 30px; font-size: 1.2rem; margin-right: 10px;">Chơi lại</button>
                <a href="/learning" class="button-secondary" style="padding: 12px 30px; font-size: 1.2rem; text-decoration: none; display: inline-block;">Thoát ra</a>
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