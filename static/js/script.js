// Đảm bảo mã chạy sau khi trang web đã tải xong
document.addEventListener('DOMContentLoaded', function() {

    // Lấy các element cần thiết từ HTML
    const aboutLink = document.getElementById('about-link');
    const aboutModal = document.getElementById('about-modal');
    const closeButton = document.querySelector('.close-button');

    // Chỉ chạy nếu các element tồn tại
    if (aboutLink && aboutModal && closeButton) {
        
        // Sự kiện: Khi nhấn vào link "Về chúng tôi"
        aboutLink.addEventListener('click', function(event) {
            event.preventDefault(); // Ngăn trình duyệt nhảy trang
            aboutModal.classList.add('active'); // Hiện pop-up
        });

        // Sự kiện: Khi nhấn vào nút 'X' để đóng
        closeButton.addEventListener('click', function() {
            aboutModal.classList.remove('active'); // Ẩn pop-up
        });

        // Sự kiện: Khi nhấn vào lớp nền mờ bên ngoài để đóng
        aboutModal.addEventListener('click', function(event) {
            if (event.target === aboutModal) {
                aboutModal.classList.remove('active'); // Ẩn pop-up
            }
        });
    }

});
// Đảm bảo mã chạy sau khi trang web đã tải xong
document.addEventListener('DOMContentLoaded', function() {

    // === LOGIC CHO POP-UP "VỀ CHÚNG TÔI" ===
    const aboutLink = document.getElementById('about-link');
    const aboutModal = document.getElementById('about-modal');
    
    // Chỉ chạy logic này nếu tìm thấy element của pop-up
    if (aboutLink && aboutModal) {
        const closeButton = aboutModal.querySelector('.close-button');

        aboutLink.addEventListener('click', function(event) {
            event.preventDefault();
            aboutModal.classList.add('active');
        });
        
        closeButton.addEventListener('click', function() {
            aboutModal.classList.remove('active');
        });

        aboutModal.addEventListener('click', function(event) {
            if (event.target === aboutModal) {
                aboutModal.classList.remove('active');
            }
        });
    }

    // === LOGIC CHO MENU HỌC TẬP (CHỈ CHẠY TRÊN TRANG LEARNING.HTML) ===
    const categoryCards = document.querySelectorAll('.category-card');
    const submenus = document.querySelectorAll('.submenu');

    // Chỉ chạy logic này nếu tìm thấy các thẻ danh mục
    if (categoryCards.length > 0 && submenus.length > 0) {
        categoryCards.forEach(card => {
            card.addEventListener('click', function() {
                const targetId = card.dataset.target;
                const targetSubmenu = document.getElementById(targetId);

                categoryCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');

                submenus.forEach(submenu => submenu.classList.remove('active'));
                if (targetSubmenu) {
                    targetSubmenu.classList.add('active');
                }
            });
        });
    }
});

// Thêm vào cuối file /static/js/script.js

// === LOGIC CHO HERO SLIDER (PHIÊN BẢN LẶP VÔ TẬN - SỬA LỖI & 1 GIÂY) ===
const sliderContainer = document.querySelector('#hero'); 
const slidesContainer = document.querySelector('.hero-slides');
let slides = document.querySelectorAll('.hero-slide'); 
const dotsContainer = document.querySelector('.hero-dots');
let dots = document.querySelectorAll('.dot'); 

let currentSlide = 0;
const slideInterval = 2000; // <<< THAY ĐỔI: Chuyển thành 1000ms (1 giây)
let slideTimer;
const transitionDuration = 500; // Thời gian chuyển slide CSS (0.5s) - Giữ nguyên

// Chỉ thực hiện nếu có slider
if (slidesContainer && slides.length > 1) {
    const numOriginalSlides = slides.length;

    // 1. Clone slide đầu tiên và thêm vào cuối
    const firstSlideClone = slides[0].cloneNode(true);
    firstSlideClone.classList.remove('active'); 
    slidesContainer.appendChild(firstSlideClone);

    // Cập nhật lại danh sách slides 
    slides = document.querySelectorAll('.hero-slide'); 
    const numTotalSlidesIncludingClone = slides.length;

    // 2. Cập nhật CSS Widths (Quan trọng - Phải khớp với CSS)
    slidesContainer.style.width = `${numTotalSlidesIncludingClone * 100}%`;
    slides.forEach(slide => {
        slide.style.width = `${100 / numTotalSlidesIncludingClone}%`;
    });

    function goToSlide(slideIndex, instant = false) {
        // Tắt/bật transition CSS
        slidesContainer.style.transition = instant ? 'none' : `transform ${transitionDuration / 1000}s ease-in-out`;
        
        // Di chuyển container
        slidesContainer.style.transform = `translateX(-${slideIndex * (100 / numTotalSlidesIncludingClone)}%)`;

        // Cập nhật dấu chấm active (chỉ cho slide gốc)
        if (dots.length > 0) { // Check if dots exist
            dots.forEach(dot => dot.classList.remove('active'));
            const dotIndex = slideIndex % numOriginalSlides; 
            if (dots[dotIndex]) {
                dots[dotIndex].classList.add('active');
            }
        }

        currentSlide = slideIndex;
    }

    function nextSlide() {
        let nextIndex = currentSlide + 1;
        
        // Chuyển đến slide tiếp theo (kể cả clone)
        goToSlide(nextIndex); 

        // Xử lý bước nhảy lặp vô tận:
        // Khi transition đến slide clone KẾT THÚC...
        if (nextIndex === numOriginalSlides) { 
            // ...đợi đúng bằng thời gian transition...
            setTimeout(() => {
                // ...rồi nhảy tức thì về slide gốc đầu tiên mà không có hiệu ứng chuyển động.
                goToSlide(0, true); 
            }, transitionDuration); 
        }
    }

    function startSlider() {
       // Xóa timer cũ (nếu có) trước khi tạo timer mới
       clearInterval(slideTimer); 
       slideTimer = setInterval(nextSlide, slideInterval);
    }

    // Dừng slider khi di chuột vào
    sliderContainer.addEventListener('mouseenter', () => clearInterval(slideTimer));
    // Khởi động lại khi di chuột ra
    sliderContainer.addEventListener('mouseleave', () => startSlider());

    // Xử lý khi nhấn vào dấu chấm
    if (dotsContainer) { // Check if dots exist
        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const slideIndex = parseInt(dot.dataset.slide);
                goToSlide(slideIndex);
                // Reset timer sau khi nhấn dot
                startSlider(); 
            });
        });
    }

    // Khởi động slider ban đầu
    startSlider();
}
// === KẾT THÚC LOGIC HERO SLIDER ===

// Thêm vào cuối file /static/js/script.js

// === LOGIC CHO USER DROPDOWN MENU ===
const userMenuToggle = document.getElementById('user-menu-toggle');
const userDropdown = document.getElementById('user-dropdown');
const userMenuContainer = document.querySelector('.user-menu-container');

if (userMenuToggle && userDropdown && userMenuContainer) {
    userMenuToggle.addEventListener('click', function(event) {
        event.preventDefault(); // Ngăn link # nhảy trang
        // Thêm/xóa class 'open' để hiện/ẩn menu và xoay mũi tên
        userMenuContainer.classList.toggle('open'); 
    });

    // Đóng menu nếu click ra ngoài
    document.addEventListener('click', function(event) {
        // Kiểm tra xem click có nằm ngoài container của menu không
        if (!userMenuContainer.contains(event.target)) {
            userMenuContainer.classList.remove('open');
        }
    });
}
// === KẾT THÚC USER DROPDOWN MENU ===

// Thêm vào cuối file /static/js/script.js

// === LOGIC CHO NHIỀU DORAEMON CHẠY NGHỊCH NGỢM (NÂNG CẤP) ===
// Thêm vào cuối file /static/js/script.js

// === LOGIC CHO NHIỀU DORAEMON CHẠY NGHỊCH NGỢM (ĐÃ SỬA LỖI LẶP) ===
// Thêm vào cuối file /static/js/script.js

// === LOGIC CHO NHIỀU DORAEMON CHẠY NGHỊCH NGỢM (ĐÃ SỬA LỖI LẶP) ===
// Thêm vào cuối file /static/js/script.js

// === LOGIC CHO NHIỀU DORAEMON CHẠY NGHỊCH NGỢM (NÂNG CẤP) ===
document.addEventListener('DOMContentLoaded', () => {
    
    // === CÁC THAY ĐỔI Ở ĐÂY ===
    const NUM_DORAEMONS = 6; // Số lượng Doraemon bạn muốn (tăng từ 3 lên 6)
    const MIN_RUN_SPEED = 6; // Tốc độ chạy tối thiểu (giây)
    const MAX_RUN_SPEED = 12; // Tốc độ chạy tối đa (giây)
    const MIN_DELAY_BETWEEN_RUNS = 500; // Độ trễ tối thiểu (giảm từ 2000ms xuống 500ms)
    const MAX_DELAY_BETWEEN_RUNS = 2000; // Độ trễ tối đa (giảm từ 6000ms xuống 2000ms)
    // ===========================

    const MIN_BOTTOM_PERCENT = 5; 
    const MAX_BOTTOM_PERCENT = 40; 

    for (let i = 0; i < NUM_DORAEMONS; i++) {
        createDoraemonRunner();
    }

    function createDoraemonRunner() {
        const doraemon = document.createElement('div');
        doraemon.classList.add('doraemon-runner'); 
        document.body.appendChild(doraemon);

        function runDoraemon() {
            // 1. Random vị trí (chiều cao)
            const randomBottom = Math.random() * (MAX_BOTTOM_PERCENT - MIN_BOTTOM_PERCENT) + MIN_BOTTOM_PERCENT; 
            doraemon.style.bottom = `${randomBottom}%`;
            
            // 2. Random tốc độ
            const randomSpeed = Math.random() * (MAX_RUN_SPEED - MIN_RUN_SPEED) + MIN_RUN_SPEED; 
            doraemon.style.animationDuration = `${randomSpeed}s`;
            
            // 3. Random hướng chạy VÀ Xoay ảnh đúng hướng
            if (Math.random() > 0.5) {
                // --- Chạy từ TRÁI sang PHẢI ---
                doraemon.style.left = '-120px'; 
                doraemon.style.right = 'auto'; 
                doraemon.style.transform = 'scaleX(1)'; // Quay mặt sang phải
                doraemon.style.animationName = 'run-across-left';
            } else {
                // --- Chạy từ PHẢI sang TRÁI ---
                doraemon.style.right = '-120px'; 
                doraemon.style.left = 'auto'; 
                doraemon.style.transform = 'scaleX(-1)'; // Lật ngược ảnh, quay mặt sang trái
                doraemon.style.animationName = 'run-across-right';
            }
            
            // 4. Thêm class 'running' để bắt đầu chạy
            doraemon.classList.add('running');
            doraemon.style.opacity = 1; 
        }

        // 5. Lắng nghe khi Doraemon chạy xong
        doraemon.addEventListener('animationend', () => {
            doraemon.classList.remove('running'); 
            doraemon.style.opacity = 0; 
            
            // Đợi ngẫu nhiên rồi chạy lại
            const randomDelay = Math.random() * (MAX_DELAY_BETWEEN_RUNS - MIN_DELAY_BETWEEN_RUNS) + MIN_DELAY_BETWEEN_RUNS; 
            setTimeout(runDoraemon, randomDelay);
        });

        // 6. Bắt đầu chạy lần đầu tiên sau một độ trễ ngẫu nhiên ban đầu
        const initialDelay = Math.random() * 2000; 
        setTimeout(runDoraemon, initialDelay);
    }
});
// === KẾT THÚC LOGIC NHIỀU DORAEMON CHẠY ===