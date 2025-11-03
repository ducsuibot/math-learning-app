document.addEventListener('DOMContentLoaded', () => {
    // === LẤY CÁC ELEMENT TỪ HTML ===
    const timerDisplay = document.getElementById('timer');
    const scoreDisplay = document.getElementById('score');
    const num1Display = document.getElementById('num1');
    const operatorDisplay = document.getElementById('operator');
    const num2Display = document.getElementById('num2');
    const optionButtons = document.querySelectorAll('.option-button');
    const feedbackModal = document.getElementById('chaien-feedback-modal');
    const feedbackText = document.getElementById('feedback-text');
    const closeFeedbackBtn = document.getElementById('close-feedback-btn');
    const chaienImage = document.getElementById('chaien-image'); // Lấy element ảnh của Chaien

    // === BIẾN TRẠNG THÁI CỦA GAME ===
    let score = 0;
    let timeLeft = 60; // Bạn có thể đổi lại 30s nếu muốn
    let correctAnswer;
    let timerInterval;

    /**
     * Hàm hiển thị pop-up của Chaien
     */
    function showChaienFeedback(isCorrect) {
        if (isCorrect) {
            feedbackText.innerText = "Bé trả lời đúng rồi, tốt lắm!"; // Sửa lại icon :)
            chaienImage.src = '/static/img/chaien_dung.png'; // Giả sử bạn có ảnh này
        } else {
            feedbackText.innerText = "Bé trả lời sai rồi, Chaien tặng bé 1 bài hát nhé!"; // Sửa lại icon
            chaienImage.src = '/static/img/chaien_sai.png'; // Giả sử bạn có ảnh này
        }
        feedbackModal.classList.add('active');
    }

    // Đóng pop-up
    closeFeedbackBtn.addEventListener('click', () => {
        feedbackModal.classList.remove('active');
        generateQuestion(); // Tạo câu hỏi mới sau khi đóng pop-up
    });

    /**
     * Hàm tạo câu hỏi mới
     */
    function generateQuestion() {
        const isAddition = Math.random() > 0.5;
        let num1, num2;

        if (isAddition) {
            num1 = Math.floor(Math.random() * 10) + 1;
            num2 = Math.floor(Math.random() * 10) + 1;
            correctAnswer = num1 + num2;
            operatorDisplay.innerText = '+';
        } else {
            num1 = Math.floor(Math.random() * 10) + 5;
            num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
            correctAnswer = num1 - num2;
            operatorDisplay.innerText = '-';
        }

        num1Display.innerText = num1;
        num2Display.innerText = num2;

        const answers = [correctAnswer];
        while (answers.length < 4) {
            let wrongAnswer = correctAnswer + (Math.floor(Math.random() * 5) - 2);
            if (wrongAnswer >= 0 && !answers.includes(wrongAnswer) && wrongAnswer !== correctAnswer) {
                answers.push(wrongAnswer);
            }
        }

        answers.sort(() => Math.random() - 0.5);

        optionButtons.forEach((button, index) => {
            button.innerText = answers[index];
            button.onclick = () => checkAnswer(answers[index]);
        });
    }

    /**
     * Hàm kiểm tra đáp án
     */
    function checkAnswer(chosenAnswer) {
        if (timeLeft <= 0) return; // Không cho trả lời nếu đã hết giờ

        if (chosenAnswer === correctAnswer) {
            score += 10;
            scoreDisplay.innerText = score;
            showChaienFeedback(true);
        } else {
            showChaienFeedback(false);
        }
    }
    
    // ==========================================================
    // === THÊM HÀM LƯU ĐIỂM VÀO ĐÂY ===
    // ==========================================================
    /**
     * Hàm gửi điểm số lên server
     * @param {string} gameName - Tên game
     * @param {number} finalScore - Điểm số cuối cùng
     */
    async function sendScoreToBackend(gameName, finalScore) {
        try {
            const response = await fetch('/save_score', { // Gọi đến route /save_score trong app.py
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    game_name: gameName,
                    score: finalScore
                }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Server response:', result.message); // In ra "Lưu điểm thành công!"
            } else {
                console.error('Không thể lưu điểm lên server.');
            }
        } catch (error) {
            // Không làm gì nếu bị lỗi (ví dụ: user chưa đăng nhập), để game tiếp tục
            console.error('Lỗi khi gửi điểm:', error);
        }
    }
    // ==========================================================
    
    /**
     * Hàm bắt đầu đếm ngược
     */
    function startTimer() {
        timeLeft = 60; // Đặt lại thời gian
        timerDisplay.innerText = timeLeft;
        
        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.innerText = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                
                // === GỌI HÀM LƯU ĐIỂM KHI HẾT GIỜ ===
                sendScoreToBackend('plus-minus-game', score);
                // ===================================
                
                // Hiển thị màn hình kết thúc
                document.querySelector('.game-container-space').innerHTML = `
                    <div class="game-over-screen"><h2>Hết giờ!</h2><p>Điểm của bé là:</p><div class="final-score">${score}</div><button onclick="window.location.reload()" class="button-primary">Chơi lại</button></div>`;
            }
        }, 1000);
    }

    // === BẮT ĐẦU GAME ===
    generateQuestion();
    startTimer();
});