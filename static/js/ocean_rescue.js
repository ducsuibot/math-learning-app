document.addEventListener('DOMContentLoaded', () => {
    // === SETUP ===
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 400;

    const questionModal = document.getElementById('question-modal');
    const gameOverModal = document.getElementById('game-over-modal');
    const winModal = document.getElementById('win-modal'); // Pop-up thắng

    const questionText = document.getElementById('question-text');
    const optionButtonsContainer = document.querySelector('.question-options');
    const progressFill = document.getElementById('progress-fill');

    // Lấy các nút bấm "Chơi lại"
    const restartBtnLose = document.getElementById('restart-btn-lose');
    const restartBtnWin = document.getElementById('restart-btn-win');

    // Lấy container chứa các nút trong modal (Đảm bảo HTML có các ID này)
    const loseButtonsContainer = document.getElementById('lose-buttons');
    const winButtonsContainer = document.getElementById('win-buttons');

    // Tải ảnh
    const playerRunImg = new Image(); playerRunImg.src = '/static/img/doraemon_run.png';
    const playerJumpImg = new Image(); playerJumpImg.src = '/static/img/doraemon_jump.png';
    const playerStandImg = new Image(); playerStandImg.src = '/static/img/doraemon_stand.png';
    const mimiImg = new Image(); mimiImg.src = '/static/img/mimi.png';
    const obstacleImg = new Image(); obstacleImg.src = '/static/img/obstacle_box.png';
    const backgroundImg = new Image(); backgroundImg.src = '/static/img/ocean_background.jpg';

    // === BIẾN GAME ===
    let gameState = 'loading'; // Thêm trạng thái loading ban đầu
    let score = 0;
    const worldSpeed = 3;
    const gravity = 0.5;
    const jumpPower = -12;
    let winModalShown = false; // Cờ để chỉ hiện modal thắng 1 lần

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
            score++;
            progressFill.style.width = `${score * 10}%`;
            if (score >= 10) {
                gameState = 'win'; // Chuyển sang trạng thái thắng
            } else {
                player.isJumping = true;
                player.dy = jumpPower;
                player.image = playerJumpImg;
                gameState = 'running';
            }
        } else {
            gameState = 'gameOver';
            gameOverModal.style.display = 'flex'; // Hiện pop-up thua ngay

            // ĐỢI 5 GIÂY RỒI MỚI HIỆN NÚT
            if (loseButtonsContainer) loseButtonsContainer.style.display = 'none'; // Ẩn nút trước
            setTimeout(() => {
                if (loseButtonsContainer) {
                    loseButtonsContainer.style.display = 'flex';
                }
            }, 5000); // 5000 milliseconds = 5 giây
        }
    }

    function resetGame() {
        score = 0;
        progressFill.style.width = '0%';
        player.x = 100;
        player.y = 300;
        player.dy = 0;
        player.isJumping = false;
        player.image = playerRunImg;
        winModalShown = false; // Reset cờ modal thắng
        generateObstacles();
        // Ẩn tất cả các pop-up và các nút bên trong
        gameOverModal.style.display = 'none';
        winModal.style.display = 'none';
        if (loseButtonsContainer) loseButtonsContainer.style.display = 'none';
        if (winButtonsContainer) winButtonsContainer.style.display = 'none';

        gameState = 'running';
        requestAnimationFrame(gameLoop); // Khởi động lại vòng lặp game
    }

    // Gắn sự kiện cho các nút "Chơi lại"
    restartBtnLose.addEventListener('click', resetGame);
    restartBtnWin.addEventListener('click', resetGame);

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

        // --- XỬ LÝ TRẠNG THÁI CHIẾN THẮNG ---
        if (gameState === 'win') {
            const mimiX = 650; // Vị trí cố định của Mimi
            const targetX = mimiX - player.width; // Vị trí Doraemon cần đến

            // Vẽ Mimi đứng yên
            ctx.drawImage(mimiImg, mimiX, 300, 80, 80);

            if (player.x < targetX) {
                // Doraemon tiếp tục chạy đến gần Mimi
                player.x += worldSpeed;
                player.image = playerRunImg;
            } else {
                // Khi đến nơi, Doraemon đứng yên
                player.image = playerStandImg;
                // Chỉ hiện pop-up thắng một lần sau khi đã đến nơi
                if (!winModalShown) {
                    winModal.style.display = 'flex'; // Hiện pop-up thắng ngay
                    winModalShown = true;

                    // ĐỢI 5 GIÂY RỒI MỚI HIỆN NÚT
                    if (winButtonsContainer) winButtonsContainer.style.display = 'none'; // Ẩn nút trước
                    setTimeout(() => {
                        if (winButtonsContainer) {
                            winButtonsContainer.style.display = 'flex';
                        }
                    }, 5000); // 5000 milliseconds = 5 giây
                }
            }
            // Vẽ Doraemon
            ctx.drawImage(player.image, player.x, player.y, player.width, player.height);

            // Vẽ các chướng ngại vật (chỉ để giữ nguyên khung cảnh)
            obstacles.forEach(obs => {
                 ctx.drawImage(obstacleImg, obs.x, obs.y, obs.width, obs.height);
            });

            // Vẽ thông báo chiến thắng (vị trí đã sửa)
            ctx.shadowColor = 'white';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#ff69b4';
            ctx.font = '60px Pacifico';
            ctx.textAlign = 'center';
            ctx.fillText('Bé đã giải cứu được Mimi!', canvas.width / 2, 80);
            ctx.shadowBlur = 0; // Reset lại hiệu ứng đổ bóng

        // --- XỬ LÝ CÁC TRẠNG THÁI KHÁC ---
        } else {
            // Vẽ Doraemon
            ctx.drawImage(player.image, player.x, player.y, player.width, player.height);

            // Chỉ di chuyển và kiểm tra khi game đang chạy
            if (gameState === 'running') {
                obstacles.forEach(obs => {
                    obs.x -= worldSpeed; // Di chuyển chướng ngại vật
                    // Kiểm tra để hiện câu hỏi
                    if (obs.x < player.x + player.width + 50 && obs.x > player.x && !obs.triggered) {
                        obs.triggered = true;
                        showQuestion();
                    }
                });

                // Xử lý nhảy
                if (player.isJumping) {
                    player.y += player.dy;
                    player.dy += gravity;
                    if (player.y >= 300) { // Chạm đất
                        player.y = 300;
                        player.isJumping = false;
                        player.dy = 0;
                        player.image = playerRunImg;
                    }
                }
            } // Kết thúc if (gameState === 'running')

            // Luôn vẽ các chướng ngại vật (kể cả khi paused)
            obstacles.forEach(obs => {
                ctx.drawImage(obstacleImg, obs.x, obs.y, obs.width, obs.height);
            });

        } // Kết thúc else (không phải win)

        // Tiếp tục vòng lặp nếu game chưa kết thúc hoàn toàn
        if (gameState !== 'gameOver' && !winModalShown) {
            requestAnimationFrame(gameLoop);
        }
    } // Kết thúc hàm gameLoop

    // Chờ tất cả ảnh tải xong mới bắt đầu game
    let imagesLoaded = 0;
    const totalImages = 6;
    [playerRunImg, playerJumpImg, playerStandImg, mimiImg, obstacleImg, backgroundImg].forEach(img => {
        img.onload = () => {
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
                generateObstacles();
                gameState = 'running'; // Bắt đầu chạy sau khi tải xong
                requestAnimationFrame(gameLoop); // Bắt đầu game loop
            }
        };
        img.onerror = () => { console.error(`Không thể tải ảnh: ${img.src}`); }
    });
});