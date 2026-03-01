// Main JavaScript for Landing Page

document.addEventListener('DOMContentLoaded', function () {

    // ===============================
    // Mobile Menu Toggle
    // ===============================
    const mobileMenuIcon = document.querySelector('.mobile-menu-icon');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuIcon && navLinks) {
        mobileMenuIcon.addEventListener('click', function () {
            navLinks.classList.toggle('active');
        });
    }

    // ===============================
    // Smooth Scrolling
    // ===============================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');

            // Prevent error for empty #
            if (targetId.length > 1) {
                e.preventDefault();
                const target = document.querySelector(targetId);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // ===============================
    // Scroll Animation (Intersection Observer)
    // ===============================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.features, .how-it-works, .use-cases, .cta-section')
        .forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(section);
        });

    // ===============================
    // Demo Emergency Button
    // ===============================
    const demoBtn = document.querySelector('.emergency-btn-demo');

    if (demoBtn) {
        demoBtn.addEventListener('click', function () {
            this.style.transform = 'scale(0.95)';

            setTimeout(() => {
                this.style.transform = 'scale(1)';
                showDemoAlert();
            }, 100);
        });
    }

    function showDemoAlert() {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-info';
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.maxWidth = '300px';
        alertDiv.style.transition = 'opacity 0.3s ease';

        alertDiv.innerHTML = `
            <i class="fas fa-info-circle"></i>
            This is a demo. Create an account to use the real emergency alert system!
        `;

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.style.opacity = '0';
            setTimeout(() => alertDiv.remove(), 300);
        }, 3000);
    }

    // ===============================
    // Navbar Shadow on Scroll
    // ===============================
    window.addEventListener('scroll', function () {
        const navbar = document.querySelector('.navbar');

        if (navbar) {
            if (window.scrollY > 50) {
                navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
            } else {
                navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
            }
        }
    });

});