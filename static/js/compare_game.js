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
    // === THAY ĐỔI 1: TẠO MỘT DANH SÁCH CÁC HÌNH ẢNH ===
    // ==========================================================
    const availableImages = [
        '/static/img/cat_icon.png',
        '/static/img/dog_icon.png', // Thêm ảnh chú chó
        // Thêm bao nhiêu ảnh bạn muốn vào đây
    ];
    // ==========================================================

    /**
     * Hàm tạo câu hỏi mới
     */
    function generateQuestion() {
        // 1. Tạo 2 số ngẫu nhiên từ 1 đến 10
        leftNumber = Math.floor(Math.random() * 10) + 1;
        rightNumber = Math.floor(Math.random() * 10) + 1;
        
        // ==========================================================
        // === THAY ĐỔI 2: CHỌN NGẪU NHIÊN 2 ẢNH KHÁC NHAU ===
        // ==========================================================
        // Chọn ảnh thứ nhất
        let index1 = Math.floor(Math.random() * availableImages.length);
        let leftImageSrc = availableImages[index1];

        // Chọn ảnh thứ hai, đảm bảo nó khác ảnh thứ nhất
        let index2;
        do {
            index2 = Math.floor(Math.random() * availableImages.length);
        } while (index1 === index2);
        let rightImageSrc = availableImages[index2];
        // ==========================================================

        // Hàm phụ để tạo hình ảnh, đã được cập nhật
        const populatePanel = (panel, number, imageUrl) => {
            panel.innerHTML = '';
            for (let i = 0; i < number; i++) {
                const img = document.createElement('img');
                img.src = imageUrl; // Sử dụng URL ảnh được truyền vào
                panel.appendChild(img);
            }
        };

        // Gọi hàm với URL ảnh tương ứng
        populatePanel(leftPanel, leftNumber, leftImageSrc);
        populatePanel(rightPanel, rightNumber, rightImageSrc);

        // Reset giao diện
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
    
    /**
     * Hàm xử lý khi hết giờ
     */
    function endGame() {
        clearInterval(timerInterval);
        isClickable = false;
        
        gameContainer.innerHTML = `
            <div class="game-over-screen">
                <h2>Hết giờ!</h2>
                <p>Điểm cuối cùng của bé là:</p>
                <div class="final-score">${score}</div>
                <button id="restart-btn" class="button-primary">Chơi lại</button>
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