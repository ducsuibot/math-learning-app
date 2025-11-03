document.addEventListener('DOMContentLoaded', () => {
    // === LẤY CÁC ELEMENT TỪ HTML ===
    const timerDisplay = document.getElementById('timer');
    const scoreDisplay = document.getElementById('score');
    const leftPanel = document.getElementById('left-panel');
    const rightPanel = document.getElementById('right-panel');
    const answerBox = document.getElementById('answer-box');
    const choiceButtons = document.querySelectorAll('.control-button');
    const feedbackDisplay = document.getElementById('game-feedback');
    const gameContainer = document.querySelector('.game-container');

    // === BIẾN TRẠNG THÁI CỦA GAME ===
    let score = 0;
    let timeLeft = 30;
    let leftNumber = 0;
    let rightNumber = 0;
    let timerInterval;
    let isClickable = true;

    // ==========================================================
    // === CẬP NHẬT 1: THÊM NHIỀU ẢNH HƠN VÀO ĐÂY ===
    // ==========================================================
    // (Hãy thêm các file ảnh của bạn vào /static/img/ và thêm vào danh sách này)
    const availableImages = [
        '/static/img/cat_icon.png',
        '/static/img/dog_icon.png', 
        '/static/img/apple.png',
        '/static/img/doraemon_icon.png', 
    ];
    // ==========================================================

    /**
     * Hàm tạo câu hỏi mới
     */
    function generateQuestion() {
        // 1. Tạo 2 số ngẫu nhiên từ 1 đến 10
        leftNumber = Math.floor(Math.random() * 10) + 1;
        rightNumber = Math.floor(Math.random() * 10) + 1;
        
        // 2. Chọn ngẫu nhiên 2 ảnh khác nhau
        let index1 = Math.floor(Math.random() * availableImages.length);
        let leftImageSrc = availableImages[index1];

        let index2;
        do {
            index2 = Math.floor(Math.random() * availableImages.length);
        } while (index1 === index2 && availableImages.length > 1); // Đảm bảo khác nhau nếu có > 1 ảnh
        let rightImageSrc = availableImages[index2];

        // Hàm phụ để tạo hình ảnh
        const populatePanel = (panel, number, imageUrl) => {
            panel.innerHTML = '';
            for (let i = 0; i < number; i++) {
                const img = document.createElement('img');
                img.src = imageUrl; 
                panel.appendChild(img);
            }
        };

        populatePanel(leftPanel, leftNumber, leftImageSrc);
        populatePanel(rightPanel, rightNumber, rightImageSrc);

        answerBox.innerText = '?';
        feedbackDisplay.innerText = '';
        isClickable = true;
    }

    /**
     * Hàm kiểm tra đáp án
     */
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
            feedbackDisplay.innerText = 'Đúng rồi, Bé giỏi quá!';
            feedbackDisplay.className = 'correct';
        } else {
            feedbackDisplay.innerText = 'Chưa đúng rồi, Bé hãy cố gắng làm lại!';
            feedbackDisplay.className = 'incorrect';
        }

        setTimeout(generateQuestion, 1500);
    }
    
    // ==========================================================
    // === CẬP NHẬT 2: THÊM HÀM LƯU ĐIỂM ===
    // ==========================================================
    /**
     * Hàm gửi điểm số lên server
     * @param {string} gameName - Tên game, ví dụ: 'compare_images'
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
            console.error('Lỗi khi gửi điểm:', error);
        }
    }
    // ==========================================================

    /**
     * Hàm xử lý khi hết giờ
     */
    function endGame() {
        clearInterval(timerInterval);
        isClickable = false;

        // === CẬP NHẬT 3: GỌI HÀM LƯU ĐIỂM KHI HẾT GIỜ ===
        sendScoreToBackend('compare_images', score);
        // ===========================================
        
        gameContainer.innerHTML = `
            <div class="game-over-screen">
                <h2>Hết giờ!</h2>
                <p>Điểm cuối cùng của bé là:</p>
                <div class="final-score">${score}</div>
                <button id="restart-btn" class="button-primary">Chơi lại</button>
                <a href="/learning" class="button-secondary" style="margin-top: 15px;">Quay lại</a>
            </div>
        `;

        document.getElementById('restart-btn').addEventListener('click', () => {
            window.location.reload();
        });
    }

    /**
     * Hàm bắt đầu đếm ngược thời gian
     */
    function startTimer() {
        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.innerText = timeLeft;
            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    // Gắn sự kiện click cho các nút lựa chọn
    choiceButtons.forEach(button => {
        button.addEventListener('click', () => {
            checkAnswer(button.dataset.choice);
        });
    });

    // === BẮT ĐẦU GAME ===
    generateQuestion();
    startTimer();
});