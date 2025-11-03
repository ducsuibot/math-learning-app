document.addEventListener('DOMContentLoaded', () => {
    // === SETUP ELEMENTS ===
    const sortArea = document.getElementById('sort-area');
    const checkBtn = document.getElementById('check-sort-btn');
    const timerDisplay = document.getElementById('timer');
    const scoreDisplay = document.getElementById('score');
    const levelDisplay = document.getElementById('level');
    const instructionText = document.getElementById('instruction-text');
    const feedbackModal = document.getElementById('game-feedback-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalNextBtn = document.getElementById('modal-next-btn');
    
    // === BIẾN TRẠNG THÁI GAME ===
    let score = 0;
    let level = 1;
    let timeLeft = 30;
    let timerInterval;
    let correctOrder = []; // Thứ tự đúng (sắp xếp)
    let currentDrag = null; // Element đang được kéo

    // === HÀM CHÍNH ===

    /**
     * Hàm tạo ra một câu hỏi mới
     */
    function generateQuestion() {
        if (level > 5) {
            endGame(true); // Thắng sau 5 cấp độ
            return;
        }

        sortArea.innerHTML = '';
        checkBtn.disabled = true;
        
        // 1. Tạo 4 số ngẫu nhiên không trùng nhau (từ 10 đến 99)
        let numbers = new Set();
        while (numbers.size < 4) {
            numbers.add(Math.floor(Math.random() * 90) + 10);
        }
        numbers = Array.from(numbers);

        // 2. Xác định thứ tự đúng và hướng sắp xếp
        const isAscending = Math.random() > 0.5; // Ngẫu nhiên tăng dần hoặc giảm dần
        
        if (isAscending) {
            correctOrder = [...numbers].sort((a, b) => a - b); // Tăng dần
            instructionText.innerText = "Sắp xếp các mốc thời gian TĂNG DẦN!";
        } else {
            correctOrder = [...numbers].sort((a, b) => b - a); // Giảm dần
            instructionText.innerText = "Sắp xếp các mốc thời gian GIẢM DẦN!";
        }

        // 3. Trộn mảng số để hiển thị ban đầu
        const shuffledNumbers = numbers.sort(() => Math.random() - 0.5);

        // 4. Tạo các ô số (draggable elements)
        shuffledNumbers.forEach(num => {
            const numDiv = document.createElement('div');
            numDiv.classList.add('sortable-number');
            numDiv.innerText = num;
            numDiv.draggable = true;
            numDiv.dataset.value = num;
            sortArea.appendChild(numDiv);
        });
        
        addDragDropListeners();
        startTimer(); // Khởi động lại đồng hồ cho câu hỏi mới
        levelDisplay.innerText = level;
    }
    
    /**
     * Hàm kiểm tra thứ tự sắp xếp của các ô số
     */
    function checkSortOrder() {
        clearInterval(timerInterval); // Dừng đồng hồ

        // Lấy tất cả các giá trị hiện tại trong khu vực sắp xếp
        const currentElements = Array.from(sortArea.querySelectorAll('.sortable-number'));
        const currentValues = currentElements.map(el => parseInt(el.dataset.value));

        // So sánh với thứ tự đúng
        const isCorrect = currentValues.every((val, index) => val === correctOrder[index]);

        if (isCorrect) {
            score += 10;
            scoreDisplay.innerText = score;
            currentElements.forEach(el => el.classList.add('correct'));
            showFeedbackModal('ĐÚNG!', 'Tuyệt vời! Doraemon đã vượt qua thành công! Mốc thời gian tiếp theo là gì nhỉ?', true);
        } else {
            showFeedbackModal('SAI!', 'Ôi không! Dòng thời gian bị xáo trộn mất rồi! Thử lại câu này nhé.', false);
        }
    }

    /**
     * Bắt đầu đồng hồ đếm ngược
     */
    function startTimer() {
        timeLeft = 30;
        timerDisplay.innerText = `${timeLeft}s`;
        clearInterval(timerInterval);

        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.innerText = `${timeLeft}s`;
            
            if (timeLeft <= 5) {
                timerDisplay.classList.add('low-time');
            }

            if (timeLeft <= 0) {
                endGame(false); // Hết giờ = Thua
            }
        }, 1000);
    }

    /**
     * Hiển thị modal phản hồi
     */
    function showFeedbackModal(title, message, isCorrect) {
        modalTitle.innerText = title;
        modalMessage.innerText = message;
        
        if (isCorrect) {
            modalNextBtn.innerText = "Câu tiếp theo";
            modalNextBtn.onclick = nextLevel;
        } else {
            modalNextBtn.innerText = "Thử lại";
            modalNextBtn.onclick = generateQuestion; // Quay lại câu hỏi cũ
        }
        feedbackModal.classList.add('active');
        checkBtn.disabled = true; // Vô hiệu hóa kiểm tra khi modal hiện
    }
    
    /**
     * Chuyển sang cấp độ tiếp theo
     */
    function nextLevel() {
        level++;
        feedbackModal.classList.remove('active');
        generateQuestion();
    }
    
    /**
     * Kết thúc game
     */
    function endGame(isWin) {
        clearInterval(timerInterval);
        modalTitle.innerText = isWin ? 'CHIẾN THẮNG!' : 'HẾT GIỜ!';
        modalMessage.innerText = isWin ? 
            `Chúc mừng! Bạn đã hoàn thành tất cả các mốc thời gian và đạt được ${score} điểm!` :
            `Rất tiếc! Hết giờ rồi. Điểm cuối cùng của bạn là ${score}.`;
        
        modalNextBtn.innerText = "Chơi lại";
        modalNextBtn.onclick = () => {
            feedbackModal.classList.remove('active');
            score = 0;
            level = 1;
            generateQuestion();
        };
        feedbackModal.classList.add('active');
    }


    // === LOGIC KÉO VÀ THẢ ===

    function addDragDropListeners() {
        const numbers = sortArea.querySelectorAll('.sortable-number');
        numbers.forEach(number => {
            number.addEventListener('dragstart', handleDragStart);
            number.addEventListener('dragover', handleDragOver);
            number.addEventListener('dragleave', handleDragLeave);
            number.addEventListener('drop', handleDrop);
        });
        
        // Thêm event listener cho khu vực sắp xếp
        sortArea.addEventListener('dragover', handleContainerDragOver);
        sortArea.addEventListener('drop', handleContainerDrop);
    }

    function handleDragStart(e) {
        currentDrag = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
        e.dataTransfer.setData('text/plain', e.target.dataset.value); // Lưu giá trị
    }

    // Cho phép thả vào chính container
    function handleContainerDragOver(e) {
        e.preventDefault(); 
        const draggingElement = document.querySelector('.dragging');
        if (draggingElement) {
             // Logic tự sắp xếp: Tìm vị trí gần nhất để di chuyển element
            const afterElement = getDragAfterElement(sortArea, e.clientX);
            if (afterElement == null) {
                sortArea.appendChild(draggingElement);
            } else {
                sortArea.insertBefore(draggingElement, afterElement);
            }
        }
    }
    
    // Hàm tìm element cần chèn vào trước (dùng cho drag-over)
    function getDragAfterElement(container, x) {
        const draggableElements = [...container.querySelectorAll('.sortable-number:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function handleDragOver(e) {
        e.preventDefault(); 
        e.target.closest('.sortable-number').classList.add('hovered');
    }
    
    function handleDragLeave(e) {
        e.target.closest('.sortable-number').classList.remove('hovered');
    }
    
    function handleDrop(e) {
        e.target.classList.remove('hovered');
        // Sau khi drop, gọi hàm kiểm tra (sẽ được kích hoạt bởi nút)
        checkBtn.disabled = false;
    }
    
    function handleContainerDrop(e) {
        e.preventDefault();
        checkBtn.disabled = false;
    }
    
    // Gắn sự kiện cho nút kiểm tra
    checkBtn.addEventListener('click', checkSortOrder);

    // === KHỞI CHẠY ===
    generateQuestion();
});