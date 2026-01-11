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
    const worldSpeed = 5; 
    const gravity = 0.6;
    const jumpPower = -14; 
    let winModalShown = false; 

    // 1. KHAI BÁO BIẾN ĐẾM MỚI
    let correctCount = 0; // <--- MỚI
    let wrongCount = 0;   // <--- MỚI

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
                x: i * 600 + 400, 
                y: 320,
                width: 70, height: 70,
                triggered: false
            });
        }
    }

    // === 4. XỬ LÝ CÂU HỎI & TRẢ LỜI ===
    function showQuestion() {
        gameState = 'paused'; 
        
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
            button.onclick = () => checkAnswer(answer, correctAnswer);
            optionButtonsContainer.appendChild(button);
        });
        
        questionModal.style.display = 'flex';
    }

    function checkAnswer(chosenAnswer, correctAnswer) {
        questionModal.style.display = 'none';
        
        if (chosenAnswer === correctAnswer) {
            // === TRẢ LỜI ĐÚNG ===
            score += 10;
            correctCount++; // <--- MỚI: Tăng số câu đúng
            
            scoreDisplay.innerText = score; 
            
            const progressPercentage = Math.min(100, (score / 100) * 100); 
            progressFill.style.width = `${progressPercentage}%`;
            
            if (score >= 100) { 
                handleWin();
            } else {
                performJump();
            }
        } else {
            // === TRẢ LỜI SAI ===
            wrongCount++; // <--- MỚI: Tăng số câu sai
            
            timeLeft -= 10; 
            if (timeLeft < 0) timeLeft = 0;
            timerDisplay.innerText = timeLeft;
            
            timerDisplay.classList.add('low-time');
            setTimeout(() => timerDisplay.classList.remove('low-time'), 500);

            if (timeLeft <= 0) {
                handleGameOver();
            } else {
                performJump();
            }
        }
    }

    function performJump() {
        player.isJumping = true;
        player.dy = jumpPower;
        player.image = playerJumpImg;
        gameState = 'running'; 
    }
    
    // === 5. XỬ LÝ THUA & THẮNG ===
    
    // Hàm phụ: Hiển thị thống kê vào Modal (Tự động chèn nếu chưa có)
    function injectStatsToModal(modalElement) {
        let statsDiv = modalElement.querySelector('.game-stats-display');
        if (!statsDiv) {
            statsDiv = document.createElement('div');
            statsDiv.className = 'game-stats-display';
            statsDiv.style.fontSize = "1.2rem";
            statsDiv.style.marginBottom = "15px";
            statsDiv.style.color = "#333";
            
            // Chèn vào trước danh sách nút bấm
            const buttons = modalElement.querySelector('.modal-buttons') || modalElement.querySelector('#lose-buttons') || modalElement.querySelector('#win-buttons');
            if(buttons) {
                modalElement.insertBefore(statsDiv, buttons);
            } else {
                modalElement.appendChild(statsDiv);
            }
        }
        
        // Cập nhật nội dung
        statsDiv.innerHTML = `
            <p>✅ Trả lời đúng: <b>${correctCount}</b></p>
            <p>❌ Trả lời sai: <b>${wrongCount}</b></p>
            <p style="margin-top:5px; color:#E65100; font-weight:bold;">Tổng điểm: ${score}</p>
        `;
    }

    function handleGameOver() {
        clearInterval(timerInterval);
        gameState = 'gameOver';
        
        sendScoreToBackend('Giải cứu Mimi', score); 
        
        // HIỆN MODAL THUA & CẬP NHẬT THỐNG KÊ
        gameOverModal.style.display = 'flex';
        injectStatsToModal(gameOverModal); // <--- MỚI
        
        if (loseButtonsContainer) {
            loseButtonsContainer.style.display = 'flex';
        }
    }

    function handleWin() {
        clearInterval(timerInterval);
        gameState = 'win';
        sendScoreToBackend('Giải cứu Mimi', score);
        
        // Cập nhật thống kê cho Modal Thắng (sẽ hiện sau animation)
        injectStatsToModal(winModal); // <--- MỚI
    }

    // === 6. ĐỒNG HỒ ĐẾM NGƯỢC ===
    function startTimer() {
        clearInterval(timerInterval); 
        timeLeft = 60; 
        timerDisplay.innerText = timeLeft;
        timerDisplay.classList.remove('low-time');

        timerInterval = setInterval(() => {
            if (gameState === 'running') {
                timeLeft--;
                timerDisplay.innerText = timeLeft;

                if (timeLeft <= 10) timerDisplay.classList.add('low-time');

                if (timeLeft <= 0) {
                    handleGameOver(); 
                }
            }
        }, 1000);
    }

    // === 7. RESET GAME (CHƠI LẠI) ===
    function resetGame() {
        score = 0;
        correctCount = 0; // <--- MỚI: Reset đếm đúng
        wrongCount = 0;   // <--- MỚI: Reset đếm sai
        
        scoreDisplay.innerText = score;
        progressFill.style.width = '0%';
        
        player.x = 100; player.y = 300; player.dy = 0;
        player.isJumping = false; player.image = playerRunImg;
        
        winModalShown = false;
        generateObstacles();
        
        gameOverModal.style.display = 'none';
        winModal.style.display = 'none';
        questionModal.style.display = 'none';
        
        if (loseButtonsContainer) loseButtonsContainer.style.display = 'none';
        if (winButtonsContainer) winButtonsContainer.style.display = 'none';
        
        startTimer();
        gameState = 'running';
        requestAnimationFrame(gameLoop);
    }

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
                    // Đã gọi injectStatsToModal ở handleWin, nên modal sẽ có số liệu
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
                obstacles.forEach(obs => {
                    obs.x -= worldSpeed;
                    
                    if (obs.x < player.x + 50 && obs.x > player.x && !obs.triggered) {
                        obs.triggered = true;
                        showQuestion(); 
                    }
                });

                if (player.isJumping) {
                    player.y += player.dy;
                    player.dy += gravity;
                    if (player.y >= 300) {
                        player.y = 300; player.isJumping = false; player.dy = 0;
                        player.image = playerRunImg;
                    }
                }
            }

            obstacles.forEach(obs => {
                ctx.drawImage(obstacleImg, obs.x, obs.y, obs.width, obs.height);
            });
        }
        
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