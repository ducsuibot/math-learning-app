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