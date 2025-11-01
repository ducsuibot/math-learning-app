// File: /static/js/chat_script.js
document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    /**
     * Hàm thêm tin nhắn vào giao diện (ĐÃ NÂNG CẤP ĐỂ LÀM SẠCH TEXT)
     * @param {string} sender - 'user' hoặc 'bot'
     * @param {string} text - Nội dung tin nhắn
     */
    function addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender); 

        // === Làm sạch text trước khi hiển thị ===
        let cleanedText = text.replace(/\*\*(.*?)\*\*/g, '$1'); // Xóa ** ** và giữ nội dung
        cleanedText = cleanedText.replace(/\*(.*?)\*/g, '$1');   // Xóa * * và giữ nội dung
        cleanedText = cleanedText.replace(/purr-purr|meow/gi, ''); // Xóa các biểu cảm (không phân biệt hoa thường)
        cleanedText = cleanedText.replace(/\s+/g, ' ').trim(); // Loại bỏ khoảng trắng thừa
        // =======================================

        if (sender === 'bot') {
            // Tạo cấu trúc có avatar cho bot
            const avatarImg = document.createElement('img');
            avatarImg.src = '/static/img/doraemon_avatar.png'; // Link tới ảnh avatar
            avatarImg.alt = 'D';
            avatarImg.classList.add('avatar');

            const textDiv = document.createElement('div');
            textDiv.classList.add('text');
            textDiv.innerText = cleanedText; // Sử dụng text đã được làm sạch

            messageDiv.appendChild(avatarImg);
            messageDiv.appendChild(textDiv);
        } else {
            // Tin nhắn người dùng chỉ cần text (cũng có thể làm sạch nếu muốn)
            const textDiv = document.createElement('div');
            textDiv.classList.add('text');
            textDiv.innerText = cleanedText; // Sử dụng text đã được làm sạch
            messageDiv.appendChild(textDiv);
        }

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Tự cuộn xuống
    }

    // Hàm gửi tin nhắn đến backend (không đổi)
    async function sendMessage() {
        const messageText = userInput.value.trim();
        if (messageText === '') return; 

        addMessage('user', messageText); // Tin nhắn user hiển thị ngay
        userInput.value = ''; 
        userInput.focus(); 

        try {
            const response = await fetch('/ask_doraemon', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText }),
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            addMessage('bot', data.reply); // Tin nhắn bot sẽ được làm sạch khi hiển thị
        } catch (error) {
            console.error('Error sending message:', error);
            addMessage('bot', 'Xin lỗi Nobita, tớ đang gặp chút trục trặc...'); 
        }
    }

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') sendMessage();
    });
    userInput.focus();
});