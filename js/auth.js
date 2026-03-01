const BASE_URL = "http://localhost:5000";

// ================= ALERT FUNCTION =================

function showAlert(message, type = "success") {
    const container = document.getElementById("alertContainer");
    if (!container) return;

    container.innerHTML = `
        <div class="alert alert-${type}">
            ${message}
        </div>
    `;

    // Auto remove alert after 3 seconds
    setTimeout(() => {
        container.innerHTML = "";
    }, 3000);
}

// ================= VALIDATION =================

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
    return /^[0-9]{10,}$/.test(phone);
}

function validatePassword(password) {
    return password.length >= 6;
}

// ================= REGISTER =================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const fullName = document.getElementById("fullName")?.value.trim();
        const email = document.getElementById("email")?.value.trim();
        const phone = document.getElementById("phone")?.value.trim();
        const password = document.getElementById("password")?.value;
        const confirmPassword = document.getElementById("confirmPassword")?.value;

        if (!fullName || !email || !phone || !password || !confirmPassword) {
            showAlert("Please fill all fields", "danger");
            return;
        }

        if (!validateEmail(email)) {
            showAlert("Invalid email format", "danger");
            return;
        }

        if (!validatePhone(phone)) {
            showAlert("Phone must be at least 10 digits", "danger");
            return;
        }

        if (!validatePassword(password)) {
            showAlert("Password must be at least 6 characters", "danger");
            return;
        }

        if (password !== confirmPassword) {
            showAlert("Passwords do not match", "danger");
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: fullName,
                    email,
                    phone,
                    password
                })
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                showAlert("Registration successful! Please login.", "success");

                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1500);
            } else {
                showAlert(data.message || "Registration failed", "danger");
            }

        } catch (error) {
            console.error("Register Error:", error);
            showAlert("Server error. Make sure backend is running.", "danger");
        }
    });
}

// ================= LOGIN =================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("email")?.value.trim();
        const password = document.getElementById("password")?.value;

        if (!email || !password) {
            showAlert("Please enter email and password", "danger");
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json().catch(() => ({}));

            // ✅ FIXED CONDITION
            if (response.ok && data.id) {

                localStorage.setItem("currentUser", JSON.stringify(data));
                localStorage.setItem("isLoggedIn", "true");

                showAlert("Login successful!", "success");

                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 1000);

            } else {
                showAlert(data.message || "Invalid credentials", "danger");
            }

        } catch (error) {
            console.error("Login Error:", error);
            showAlert("Server error. Make sure backend is running.", "danger");
        }
    });
}

// ================= AUTH CHECK =================

function checkAuth() {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const currentPage = window.location.pathname.split("/").pop();

    // If logged in, prevent access to login/register
    if (
        isLoggedIn === "true" &&
        (currentPage === "login.html" || currentPage === "register.html")
    ) {
        window.location.href = "dashboard.html";
    }

    // If NOT logged in, block dashboard
    if (
        isLoggedIn !== "true" &&
        currentPage === "dashboard.html"
    ) {
        window.location.href = "login.html";
    }
}

checkAuth();