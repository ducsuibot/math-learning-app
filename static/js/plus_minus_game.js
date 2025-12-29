document.addEventListener('DOMContentLoaded', () => {
    // === LẤY CÁC ELEMENT TỪ HTML ===
    const timerDisplay = document.getElementById('timer');
    const scoreDisplay = document.getElementById('score');
    const num1Display = document.getElementById('num1');
    const operatorDisplay = document.getElementById('operator');
    const num2Display = document.getElementById('num2');
    const optionButtons = document.querySelectorAll('.option-button');
    
    // Modal feedback
    const feedbackModal = document.getElementById('chaien-feedback-modal');
    const feedbackText = document.getElementById('feedback-text');
    const closeFeedbackBtn = document.getElementById('close-feedback-btn');
    const chaienImage = document.getElementById('chaien-image');

    // === BIẾN TRẠNG THÁI CỦA GAME ===
    let score = 0;
    let timeLeft = 60; 
    let correctAnswer;
    let timerInterval;
    let isClickable = true; 

    /**
     * Hàm hiển thị pop-up của Chaien
     */
    function showChaienFeedback(isCorrect) {
        if (isCorrect) {
            feedbackText.innerText = "Bé trả lời đúng rồi, tốt lắm!";
            feedbackText.style.color = "#4CAF50"; // Màu xanh lá (Giữ nguyên)
            chaienImage.src = '/static/img/gian.png'; 
        } else {
            feedbackText.innerText = "Sai rồi! Chaien sẽ hát tặng bé 1 bài nhé!";
            feedbackText.style.color = "#F44336"; // Màu đỏ (Giữ nguyên)
            chaienImage.src = '/static/img/chaa.png'; 
        }
        feedbackModal.classList.add('active');
    }

    // Đóng pop-up và qua câu mới
    closeFeedbackBtn.addEventListener('click', () => {
        feedbackModal.classList.remove('active');
        generateQuestion(); 
    });

    /**
     * Hàm tạo câu hỏi mới (CHỈ CỘNG 1 CHỮ SỐ)
     */
    function generateQuestion() {
        optionButtons.forEach(btn => {
            btn.className = 'option-button'; 
        });
        isClickable = true;

        operatorDisplay.innerText = '+';

        // Random số từ 1 đến 9
        let num1 = Math.floor(Math.random() * 9) + 1;
        let num2 = Math.floor(Math.random() * 9) + 1;
        
        correctAnswer = num1 + num2;

        num1Display.innerText = num1;
        num2Display.innerText = num2;

        // Tạo đáp án nhiễu
        const answers = [correctAnswer];
        while (answers.length < 4) {
            let wrongAnswer = correctAnswer + (Math.floor(Math.random() * 7) - 3);
            if (wrongAnswer >= 0 && !answers.includes(wrongAnswer)) {
                answers.push(wrongAnswer);
            }
        }

        answers.sort(() => Math.random() - 0.5);

        optionButtons.forEach((button, index) => {
            button.innerText = answers[index];
            button.onclick = null; 
            button.onclick = () => checkAnswer(button, answers[index]);
        });
    }

    /**
     * Hàm kiểm tra đáp án
     */
    function checkAnswer(btn, chosenAnswer) {
        if (timeLeft <= 0 || !isClickable) return; 
        isClickable = false; 

        if (chosenAnswer === correctAnswer) {
            score += 10;
            scoreDisplay.innerText = score;
            btn.classList.add('correct'); 
            setTimeout(() => showChaienFeedback(true), 500);
        } else {
            btn.classList.add('wrong'); 
            setTimeout(() => showChaienFeedback(false), 500);
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
        } catch (error) { console.error('Lỗi khi gửi điểm:', error); }
    }
    
    /**
     * Hàm bắt đầu đếm ngược
     */
    function startTimer() {
        timeLeft = 60; 
        timerDisplay.innerText = timeLeft;
        
        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.innerText = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                isClickable = false; 
                
                sendScoreToBackend('Cộng đơn giản (Level 1)', score);
                
                // === ĐÃ SỬA MÀU SẮC Ở ĐÂY CHO HỢP THEME BIỂN ===
                document.querySelector('.game-container-space').innerHTML = `
                    <div style="text-align: center; color: #01579B;"> <h2 style="font-size: 3rem; margin-bottom: 20px;">Hết giờ!</h2>
                        <p style="font-size: 1.5rem;">Điểm của bé là:</p>
                        <div style="font-size: 5rem; font-weight: 900; color: #E65100; margin: 20px 0;">${score}</div>
                        
                        <button onclick="window.location.reload()" 
                                style="padding: 15px 40px; font-size: 1.5rem; background: #0288D1; color: white; border: none; border-radius: 30px; cursor: pointer; font-weight: bold; box-shadow: 0 5px 0 #01579B;">
                            Chơi lại
                        </button>
                    </div>`;
            }
        }, 1000);
    }

    // === BẮT ĐẦU GAME ===
    generateQuestion();
    startTimer();
});