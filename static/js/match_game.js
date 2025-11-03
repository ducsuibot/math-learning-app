document.addEventListener('DOMContentLoaded', () => {
    // === LẤY CÁC ELEMENT TỪ HTML ===
    const itemsPool = document.getElementById('items-pool');
    const dropZonesContainer = document.getElementById('drop-zones');
    const scoreDisplay = document.getElementById('score');
    const questionCounterDisplay = document.getElementById('question-counter');
    const feedbackModal = document.getElementById('xeko-feedback-modal');
    const xekoImage = document.getElementById('xeko-image');
    const xekoText = document.getElementById('xeko-text');
    const nextQuestionBtn = document.getElementById('next-question-btn');

    // === BIẾN TRẠNG THÁI CỦA GAME ===
    let score = 0;
    let currentQuestion = 1;
    const totalQuestions = 5;
    let correctMatches = 0; // Đếm số lượng ghép đúng trong 1 câu
    let numbersToMatch = []; // Mảng chứa các số của câu hỏi hiện tại

    // Danh sách các món đồ chơi (thêm ảnh vào /static/img/)
    const toyImages = [
        '/static/img/toy_robot.png',
        '/static/img/toy_car.png',
        '/static/img/toy_train.png',
        '/static/img/toy_dinosaur.png'
    ];

    /**
     * Hàm tạo câu hỏi mới (ví dụ: 3 số)
     */
    function generateQuestion() {
        itemsPool.innerHTML = '';
        dropZonesContainer.innerHTML = '';
        correctMatches = 0;
        numbersToMatch = [];
        const questionSize = 3; // Tạo câu hỏi 3 số

        // 1. Tạo các số ngẫu nhiên (từ 1 đến 5)
        while (numbersToMatch.length < questionSize) {
            let num = Math.floor(Math.random() * 5) + 1;
            if (!numbersToMatch.includes(num)) {
                numbersToMatch.push(num);
            }
        }
        
        // 2. Tạo các ô thả (drop zones)
        for (const num of numbersToMatch) {
            const dropZone = document.createElement('div');
            dropZone.classList.add('drop-zone');
            dropZone.dataset.number = num; // Gán số cần thả vào
            dropZone.innerText = num;
            dropZonesContainer.appendChild(dropZone);
            addDropZoneListeners(dropZone);
        }

        // 3. Tạo các món đồ chơi (items)
        // Trộn mảng số để thứ tự đồ chơi khác thứ tự ô số
        const shuffledNumbers = [...numbersToMatch].sort(() => Math.random() - 0.5);
        
        for (const num of shuffledNumbers) {
            const item = document.createElement('div');
            item.classList.add('draggable-item');
            item.draggable = true; // Cho phép kéo
            item.dataset.number = num; // Gán số lượng của món đồ này
            
            // Tạo hình ảnh bên trong
            let itemContent = '';
            // Chọn 1 ảnh ngẫu nhiên từ kho
            const randomToyImg = toyImages[Math.floor(Math.random() * toyImages.length)];
            for (let i = 0; i < num; i++) {
                itemContent += `<img src="${randomToyImg}" alt="đồ chơi">`;
            }
            item.innerHTML = itemContent;
            itemsPool.appendChild(item);
            addDraggableListeners(item);
        }
        
        questionCounterDisplay.innerText = `${currentQuestion} / ${totalQuestions}`;
    }

    /**
     * Gắn sự kiện cho món đồ kéo được
     */
    function addDraggableListeners(item) {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', item.dataset.number);
            setTimeout(() => item.classList.add('dragging'), 0);
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
        });
    }

    /**
     * Gắn sự kiện cho ô thả
     */
    function addDropZoneListeners(zone) {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault(); // Cho phép thả
            zone.classList.add('hovered');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('hovered');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('hovered');
            
            const droppedNumber = e.dataTransfer.getData('text/plain');
            const zoneNumber = zone.dataset.number;

            // Lấy món đồ đã kéo
            const draggedItem = document.querySelector(`.draggable-item[data-number='${droppedNumber}'].dragging`);

            if (droppedNumber === zoneNumber && draggedItem) {
                // === GHÉP ĐÚNG ===
                zone.classList.add('dropped');
                zone.innerHTML = ''; // Xóa số đi
                zone.appendChild(draggedItem); // Đặt món đồ vào
                draggedItem.draggable = false; // Không cho kéo nữa
                draggedItem.classList.remove('dragging');
                draggedItem.style.cursor = 'default';
                
                correctMatches++;
                score += 10;
                scoreDisplay.innerText = score;

                // Kiểm tra xem đã hoàn thành câu hỏi chưa
                if (correctMatches === numbersToMatch.length) {
                    showXekoFeedback(true);
                }
            } else {
                // === GHÉP SAI ===
                showXekoFeedback(false);
            }
        });
    }

    /**
     * Hiển thị phản hồi của Xeko
     */
    function showXekoFeedback(isCorrect) {
        if (isCorrect) {
            xekoText.innerText = "Chuẩn rồi! Đồ chơi của tớ phải thế chứ!";
            xekoImage.src = "/static/img/suneo_happy.png"; // Cần ảnh Xeko vui
            nextQuestionBtn.style.display = 'block'; // Hiện nút câu tiếp
        } else {
            xekoText.innerText = "Sai rồi! Đó không phải món đồ tương ứng!";
            xekoImage.src = "/static/img/suneo_sad.png"; // Cần ảnh Xeko buồn
            nextQuestionBtn.style.display = 'none'; // Ẩn nút, cho bé thử lại
        }
        feedbackModal.classList.add('active');
    }

    // Nút "Câu tiếp theo" trong pop-up
    nextQuestionBtn.addEventListener('click', () => {
        feedbackModal.classList.remove('active');
        currentQuestion++;
        if (currentQuestion > totalQuestions) {
            // Hoàn thành game
            alert(`Chúc mừng! Bạn đã hoàn thành game với ${score} điểm!`);
            // Reset game
            score = 0;
            currentQuestion = 1;
            scoreDisplay.innerText = score;
        }
        generateQuestion();
    });
    
    // Đóng modal khi nhấn ra ngoài (cho trường hợp trả lời sai)
    feedbackModal.addEventListener('click', (e) => {
        if (e.target === feedbackModal) {
            feedbackModal.classList.remove('active');
        }
    });

    // === BẮT ĐẦU GAME ===
    generateQuestion();
});