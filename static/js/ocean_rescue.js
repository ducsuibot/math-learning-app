document.addEventListener('DOMContentLoaded', () => {
    // === 1. SETUP ELEMENTS (KHỞI TẠO) ===
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 400;

    // Các modal thông báo
    const questionModal = document.getElementById('question-modal');
    const gameOverModal = document.getElementById('game-over-modal');
    const winModal = document.getElementById('win-modal');

    // Nội dung câu hỏi
    const questionText = document.getElementById('question-text');
    const optionButtonsContainer = document.querySelector('.question-options');
    
    // Hiển thị điểm và thanh tiến độ
    const progressFill = document.getElementById('progress-fill');
    const scoreDisplay = document.getElementById('score-display');
    const timerDisplay = document.getElementById('timer-display');
    
    // Nút bấm
    const restartBtnLose = document.getElementById('restart-btn-lose');
    const restartBtnWin = document.getElementById('restart-btn-win');
    const loseButtonsContainer = document.getElementById('lose-buttons');
    const winButtonsContainer = document.getElementById('win-buttons');

    // === 2. TẢI ẢNH (ASSETS) ===
    const playerRunImg = new Image(); playerRunImg.src = '/static/img/doraemon_run.png';
    const playerJumpImg = new Image(); playerJumpImg.src = '/static/img/doraemon_run.png';
    const playerStandImg = new Image(); playerStandImg.src = '/static/img/doraemon_stand.png';
    const mimiImg = new Image(); mimiImg.src = '/static/img/mimi.png';
    const obstacleImg = new Image(); obstacleImg.src = '/static/img/obstacle_box.png';
    const backgroundImg = new Image(); backgroundImg.src = '/static/img/ocean_background.jpg';

    // === 3. BIẾN GAME ===
    let gameState = 'loading';
    let score = 0; 
    let timeLeft = 60; 
    let timerInterval; 
    const worldSpeed = 5; // Tăng tốc độ cho mượt
    const gravity = 0.6;
    const jumpPower = -14; // Nhảy cao hơn chút
    let winModalShown = false; 

    let player = {
        x: 100, y: 300,
        width: 60, height: 80,
        dy: 0,
        isJumping: false,
        image: playerRunImg
    };

    let obstacles = [];
    
    // Tạo chướng ngại vật
    function generateObstacles() {
        obstacles = [];
        for (let i = 1; i <= 15; i++) {
            obstacles.push({
                x: i * 600 + 400, // Khoảng cách xa
                y: 320,
                width: 70, height: 70,
                triggered: false
            });
        }
    }

    // === 4. XỬ LÝ CÂU HỎI & TRẢ LỜI ===
    function showQuestion() {
        gameState = 'paused'; // Dừng game để hỏi
        
        // Random cộng hoặc trừ
        const isAddition = Math.random() > 0.5;
        let num1, num2, correctAnswer;
        
        if (isAddition) {
            num1 = Math.floor(Math.random() * 10) + 1;
            num2 = Math.floor(Math.random() * 10) + 1;
            correctAnswer = num1 + num2;
            questionText.innerText = `${num1} + ${num2} = ?`;
        } else {
            num1 = Math.floor(Math.random() * 10) + 5;
            num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
            correctAnswer = num1 - num2;
            questionText.innerText = `${num1} - ${num2} = ?`;
        }

        // Tạo 3 đáp án (1 đúng, 2 sai)
        const answers = [correctAnswer];
        while (answers.length < 3) {
            let wrongAnswer = correctAnswer + (Math.floor(Math.random() * 7) - 3);
            if (wrongAnswer >= 0 && !answers.includes(wrongAnswer)) {
                answers.push(wrongAnswer);
            }
        }
        answers.sort(() => Math.random() - 0.5);

        // Hiển thị nút
        optionButtonsContainer.innerHTML = '';
        answers.forEach(answer => {
            const button = document.createElement('button');
            button.className = 'option-button';
            button.innerText = answer;
            // Gắn sự kiện click
            button.onclick = () => checkAnswer(answer, correctAnswer);
            optionButtonsContainer.appendChild(button);
        });
        
        // Hiện Modal
        questionModal.style.display = 'flex';
    }

    function checkAnswer(chosenAnswer, correctAnswer) {
        // Ẩn bảng câu hỏi ngay lập tức
        questionModal.style.display = 'none';
        
        if (chosenAnswer === correctAnswer) {
            // === TRẢ LỜI ĐÚNG ===
            score += 10;
            scoreDisplay.innerText = score; 
            
            // Cập nhật thanh tiến độ
            const progressPercentage = Math.min(100, (score / 100) * 100); 
            progressFill.style.width = `${progressPercentage}%`;
            
            if (score >= 100) { 
                handleWin();
            } else {
                // CHO NHẢY
                performJump();
            }
        } else {
            // === TRẢ LỜI SAI === (SỬA LỖI TẠI ĐÂY)
            timeLeft -= 10; // Phạt trừ 10 giây
            if (timeLeft < 0) timeLeft = 0;
            timerDisplay.innerText = timeLeft;
            
            // Rung lắc đồng hồ báo hiệu trừ giờ
            timerDisplay.classList.add('low-time');
            setTimeout(() => timerDisplay.classList.remove('low-time'), 500);

            if (timeLeft <= 0) {
                // Nếu trừ xong mà hết giờ -> THUA LUÔN
                handleGameOver();
            } else {
                // Nếu vẫn còn giờ -> VẪN CHO NHẢY (Để qua chướng ngại vật)
                performJump();
            }
        }
    }

    // Hàm thực hiện nhảy (Dùng chung cho cả Đúng và Sai)
    function performJump() {
        player.isJumping = true;
        player.dy = jumpPower;
        player.image = playerJumpImg;
        gameState = 'running'; // Tiếp tục chạy
    }
    
    // === 5. XỬ LÝ THUA & THẮNG ===
    
    function handleGameOver() {
        clearInterval(timerInterval);
        gameState = 'gameOver';
        
        // Gửi điểm về server (nếu cần)
        sendScoreToBackend('Giải cứu Mimi', score); 
        
        // HIỆN MODAL THUA
        gameOverModal.style.display = 'flex';
        
        // QUAN TRỌNG: BẮT BUỘC HIỆN NÚT CHƠI LẠI
        if (loseButtonsContainer) {
            loseButtonsContainer.style.display = 'flex';
        }
    }

    function handleWin() {
        clearInterval(timerInterval);
        gameState = 'win';
        sendScoreToBackend('Giải cứu Mimi', score);
    }

    // === 6. ĐỒNG HỒ ĐẾM NGƯỢC ===
    function startTimer() {
        clearInterval(timerInterval); 
        timeLeft = 60; // 60 giây
        timerDisplay.innerText = timeLeft;
        timerDisplay.classList.remove('low-time');

        timerInterval = setInterval(() => {
            if (gameState === 'running') {
                timeLeft--;
                timerDisplay.innerText = timeLeft;

                // Cảnh báo khi sắp hết giờ
                if (timeLeft <= 10) timerDisplay.classList.add('low-time');

                if (timeLeft <= 0) {
                    handleGameOver(); // Hết giờ -> Gọi hàm thua
                }
            }
        }, 1000);
    }

    // === 7. RESET GAME (CHƠI LẠI) ===
    function resetGame() {
        score = 0;
        scoreDisplay.innerText = score;
        progressFill.style.width = '0%';
        
        player.x = 100; player.y = 300; player.dy = 0;
        player.isJumping = false; player.image = playerRunImg;
        
        winModalShown = false;
        generateObstacles();
        
        // Ẩn hết modal
        gameOverModal.style.display = 'none';
        winModal.style.display = 'none';
        questionModal.style.display = 'none';
        
        // Ẩn nút để lần sau hiện lại
        if (loseButtonsContainer) loseButtonsContainer.style.display = 'none';
        if (winButtonsContainer) winButtonsContainer.style.display = 'none';
        
        startTimer();
        gameState = 'running';
        requestAnimationFrame(gameLoop);
    }

    // Gắn sự kiện click cho nút Chơi lại
    if (restartBtnLose) restartBtnLose.onclick = resetGame;
    if (restartBtnWin) restartBtnWin.onclick = resetGame;

    // === 8. GỬI ĐIỂM (Backend) ===
    async function sendScoreToBackend(gameName, finalScore) {
        try {
            await fetch('/save_score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ game_name: gameName, score: finalScore }),
            });
        } catch (error) { console.error('Lỗi gửi điểm:', error); }
    }

    // === 9. GAME LOOP (VÒNG LẶP CHÍNH) ===
    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

        // --- A. KHI THẮNG ---
        if (gameState === 'win') {
            const mimiX = 650;
            ctx.drawImage(mimiImg, mimiX, 300, 80, 80);

            if (player.x < mimiX - 60) {
                player.x += worldSpeed;
                player.image = playerRunImg;
            } else {
                player.image = playerStandImg;
                if (!winModalShown) {
                    winModalShown = true;
                    winModal.style.display = 'flex';
                    // Hiện nút thắng sau 1s
                    setTimeout(() => { 
                        if (winButtonsContainer) winButtonsContainer.style.display = 'flex'; 
                    }, 3000);
                }
            }
            ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
        
        // --- B. KHI ĐANG CHƠI ---
        } else {
            ctx.drawImage(player.image, player.x, player.y, player.width, player.height);

            if (gameState === 'running') {
                // Di chuyển chướng ngại vật
                obstacles.forEach(obs => {
                    obs.x -= worldSpeed;
                    
                    // Va chạm -> Hiện câu hỏi
                    if (obs.x < player.x + 50 && obs.x > player.x && !obs.triggered) {
                        obs.triggered = true;
                        showQuestion(); // Dừng game, hiện câu hỏi
                    }
                });

                // Xử lý nhảy
                if (player.isJumping) {
                    player.y += player.dy;
                    player.dy += gravity;
                    if (player.y >= 300) {
                        player.y = 300; player.isJumping = false; player.dy = 0;
                        player.image = playerRunImg;
                    }
                }
            }

            // Vẽ chướng ngại vật
            obstacles.forEach(obs => {
                ctx.drawImage(obstacleImg, obs.x, obs.y, obs.width, obs.height);
            });
        }
        
        // Tiếp tục lặp nếu chưa thua
        if (gameState !== 'gameOver') {
            requestAnimationFrame(gameLoop);
        }
    } 

    // === 10. LOAD ẢNH & START ===
    let imagesLoaded = 0;
    const totalImages = 6;
    [playerRunImg, playerJumpImg, playerStandImg, mimiImg, obstacleImg, backgroundImg].forEach(img => {
        img.onload = () => {
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
                resetGame();
            }
        };
        img.onerror = () => { console.error(`Lỗi tải ảnh: ${img.src}`); }
    });
});