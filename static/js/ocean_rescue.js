document.addEventListener('DOMContentLoaded', () => {
    // === SETUP ELEMENTS ===
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 400;

    const questionModal = document.getElementById('question-modal');
    const gameOverModal = document.getElementById('game-over-modal');
    const winModal = document.getElementById('win-modal');

    const questionText = document.getElementById('question-text');
    const optionButtonsContainer = document.querySelector('.question-options');
    const progressFill = document.getElementById('progress-fill');
    
    // THÊM ELEMENT MỚI
    const scoreDisplay = document.getElementById('score-display');
    const timerDisplay = document.getElementById('timer-display');
    
    const restartBtnLose = document.getElementById('restart-btn-lose');
    const restartBtnWin = document.getElementById('restart-btn-win');
    const loseButtonsContainer = document.getElementById('lose-buttons');
    const winButtonsContainer = document.getElementById('win-buttons');

    // Tải ảnh (Giữ nguyên)
    const playerRunImg = new Image(); playerRunImg.src = '/static/img/doraemon_run.png';
    const playerJumpImg = new Image(); playerJumpImg.src = '/static/img/doraemon_jump.png';
    const playerStandImg = new Image(); playerStandImg.src = '/static/img/doraemon_stand.png';
    const mimiImg = new Image(); mimiImg.src = '/static/img/mimi.png';
    const obstacleImg = new Image(); obstacleImg.src = '/static/img/obstacle_box.png';
    const backgroundImg = new Image(); backgroundImg.src = '/static/img/ocean_background.jpg';

    // === BIẾN GAME MỚI ===
    let gameState = 'loading';
    let score = 0; 
    let timeLeft = 30;
    let timerInterval; 
    const worldSpeed = 3;
    const gravity = 0.5;
    const jumpPower = -12;
    let winModalShown = false; 

    let player = {
        x: 100, y: 300,
        width: 60, height: 80,
        dy: 0,
        isJumping: false,
        image: playerRunImg
    };

    let obstacles = [];
    
    function generateObstacles() {
        obstacles = [];
        for (let i = 1; i <= 10; i++) {
            obstacles.push({
                x: i * 400 + 300,
                y: 320,
                width: 80, height: 80,
                triggered: false
            });
        }
    }

    function showQuestion() {
        // [Logic tạo câu hỏi giữ nguyên]
        gameState = 'paused';
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
        const answers = [correctAnswer];
        while (answers.length < 3) {
            let wrongAnswer = correctAnswer + (Math.floor(Math.random() * 5) - 2);
            if (wrongAnswer >= 0 && !answers.includes(wrongAnswer)) {
                answers.push(wrongAnswer);
            }
        }
        answers.sort(() => Math.random() - 0.5);
        optionButtonsContainer.innerHTML = '';
        answers.forEach(answer => {
            const button = document.createElement('button');
            button.className = 'option-button';
            button.innerText = answer;
            button.onclick = () => checkAnswer(answer, correctAnswer);
            optionButtonsContainer.appendChild(button);
        });
        questionModal.style.display = 'flex';
    }

    function checkAnswer(chosenAnswer, correctAnswer) {
        questionModal.style.display = 'none';
        
        if (chosenAnswer === correctAnswer) {
            score += 10;
            scoreDisplay.innerText = score; 
            
            // Cập nhật thanh tiến độ
            const progressPercentage = Math.min(100, (score / 100) * 100); 
            progressFill.style.width = `${progressPercentage}%`;
            
            if (score >= 100) { 
                clearInterval(timerInterval); // <<< DỪNG ĐỒNG HỒ KHI THẮNG
                gameState = 'win';
            } else {
                player.isJumping = true;
                player.dy = jumpPower;
                player.image = playerJumpImg;
                gameState = 'running';
            }
        } else {
            // Sai: Trừ thời gian
            timeLeft -= 5; 
            if (timeLeft < 0) timeLeft = 0;
            timerDisplay.innerText = timeLeft;
            if (timeLeft === 0) { // Nếu hết sạch thời gian
                clearInterval(timerInterval);
                gameState = 'gameOver';
                gameOverModal.style.display = 'flex';
            }
            gameState = 'running';
        }
    }
    
    // HÀM ĐẾM NGƯỢC THỜI GIAN
    function startTimer() {
        clearInterval(timerInterval); 
        timeLeft = 40; // 60 GIÂY
        timerDisplay.innerText = timeLeft;
        timerDisplay.classList.remove('low-time');

        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.innerText = timeLeft;

            if (timeLeft <= 10) {
                timerDisplay.classList.add('low-time');
            }

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                gameState = 'gameOver';
                gameOverModal.style.display = 'flex'; 
            }
        }, 1000);
    }

    function resetGame() {
        score = 0;
        scoreDisplay.innerText = score;
        
        progressFill.style.width = '0%';
        
        player.x = 100;
        player.y = 300;
        player.dy = 0;
        player.isJumping = false;
        player.image = playerRunImg;
        winModalShown = false;
        generateObstacles();
        
        gameOverModal.style.display = 'none';
        winModal.style.display = 'none';
        
        if (loseButtonsContainer) loseButtonsContainer.style.display = 'none';
        if (winButtonsContainer) winButtonsContainer.style.display = 'none';
        
        startTimer();
        gameState = 'running';
        requestAnimationFrame(gameLoop);
    }

    // Gắn sự kiện cho các nút "Chơi lại"
    restartBtnLose.addEventListener('click', resetGame);
    restartBtnWin.addEventListener('click', resetGame);

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

        // --- XỬ LÝ TRẠNG THÁI WIN ---
        if (gameState === 'win') {
            const mimiX = 650;
            const targetX = mimiX - player.width;

            ctx.drawImage(mimiImg, mimiX, 300, 80, 80);

            if (player.x < targetX) {
                player.x += worldSpeed;
                player.image = playerRunImg;
            } else {
                player.image = playerStandImg;
                if (!winModalShown) {
                    winModal.style.display = 'flex';
                    winModalShown = true;
                    // Hiện nút sau 5 giây
                    if (winButtonsContainer) winButtonsContainer.style.display = 'none';
                    setTimeout(() => { if (winButtonsContainer) winButtonsContainer.style.display = 'flex'; }, 5000);
                }
            }
            ctx.drawImage(player.image, player.x, player.y, player.width, player.height);

            // Vẽ thông báo
            ctx.shadowColor = 'white'; ctx.shadowBlur = 15;
            ctx.fillStyle = '#ff69b4'; ctx.font = '60px Pacifico';
            ctx.textAlign = 'center'; ctx.fillText('Bé đã giải cứu được Mimi!', canvas.width / 2, 80);
            ctx.shadowBlur = 0; 
        
        // --- XỬ LÝ TRẠNG THÁI CHẠY (RUNNING/PAUSED) ---
        } else {
            ctx.drawImage(player.image, player.x, player.y, player.width, player.height);

            if (gameState === 'running') {
                obstacles.forEach(obs => {
                    obs.x -= worldSpeed;
                    if (obs.x < player.x + player.width + 50 && obs.x > player.x && !obs.triggered) {
                        obs.triggered = true;
                        showQuestion();
                    }
                });

                // Xử lý nhảy
                if (player.isJumping) {
                    player.y += player.dy;
                    player.dy += gravity;
                    if (player.y >= 300) {
                        player.y = 300;
                        player.isJumping = false;
                        player.dy = 0;
                        player.image = playerRunImg;
                    }
                }
            }

            // Luôn vẽ các chướng ngại vật
            obstacles.forEach(obs => {
                ctx.drawImage(obstacleImg, obs.x, obs.y, obs.width, obs.height);
            });
        }
        
        // Tiếp tục vòng lặp
        if (gameState !== 'gameOver' && !winModalShown) {
            requestAnimationFrame(gameLoop);
        }
    } 

    // Chờ tất cả ảnh tải xong mới bắt đầu game
    let imagesLoaded = 0;
    const totalImages = 6;
    [playerRunImg, playerJumpImg, playerStandImg, mimiImg, obstacleImg, backgroundImg].forEach(img => {
        img.onload = () => {
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
                generateObstacles();
                startTimer();
                gameState = 'running'; 
                requestAnimationFrame(gameLoop); 
            }
        };
        img.onerror = () => { console.error(`Không thể tải ảnh: ${img.src}`); }
    });
});