const BASE_URL = "http://localhost:5000";

/* ================= AUTH CHECK ================= */

function checkAuth() {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const currentUser = localStorage.getItem("currentUser");

    if (isLoggedIn !== "true" || !currentUser || currentUser === "undefined") {
        window.location.href = "login.html";
        return false;
    }

    return true;
}

/* ================= GET CURRENT USER ================= */

function getCurrentUser() {
    const userString = localStorage.getItem("currentUser");
    if (!userString) return null;

    try {
        return JSON.parse(userString);
    } catch (err) {
        console.error("User parse error:", err);
        localStorage.removeItem("currentUser");
        return null;
    }
}

/* ================= LOAD PROFILE INFO ================= */

function loadProfileInfo() {
    const user = getCurrentUser();
    if (!user) return;

    const nameEl = document.getElementById("profileName");
    const emailEl = document.getElementById("profileEmail");
    const phoneEl = document.getElementById("profilePhone");
    const regDateEl = document.getElementById("profileRegDate");

    if (nameEl) nameEl.textContent = user.full_name || "N/A";
    if (emailEl) emailEl.textContent = user.email || "N/A";
    if (phoneEl) phoneEl.textContent = user.phone || "N/A";

    if (regDateEl && user.registration_date) {
        const date = new Date(user.registration_date);
        regDateEl.textContent = isNaN(date)
            ? "N/A"
            : date.toLocaleDateString();
    }
}

/* ================= LOAD CONTACT STATS ================= */

async function loadAccountStats() {
    const user = getCurrentUser();
    if (!user || !user.id) return;

    try {
        const response = await fetch(
            `${BASE_URL}/contacts/user/${user.id}`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch contacts");
        }

        const data = await response.json().catch(() => []);

        const contacts = Array.isArray(data) ? data : [];

        const totalContactsEl =
            document.getElementById("totalContacts");

        if (totalContactsEl) {
            totalContactsEl.textContent = contacts.length;
        }
    } catch (error) {
        console.error("Error loading account stats:", error);
    }
}

/* ================= LOGOUT ================= */

function logout() {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("isLoggedIn");
    window.location.href = "login.html";
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
    if (!checkAuth()) return;

    loadProfileInfo();
    loadAccountStats();

    document
        .getElementById("logoutBtn")
        ?.addEventListener("click", logout);
});