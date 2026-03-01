const BASE_URL = "http://localhost:5000";
let currentUser = JSON.parse(localStorage.getItem("user"));

/* ================= ALERT FUNCTION ================= */

function showAlert(message, type = "success") {
    const container = document.getElementById("alertContainer");
    if (!container) return;

    container.innerHTML = `
        <div class="alert alert-${type}">
            ${message}
        </div>
    `;

    setTimeout(() => {
        container.innerHTML = "";
    }, 4000);
}

/* ================= AUTH CHECK ================= */

function checkAuth() {
    const userString = localStorage.getItem("currentUser");

    if (!userString) {
        window.location.href = "login.html";
        return null;
    }

    try {
        return JSON.parse(userString);
    } catch {
        localStorage.clear();
        window.location.href = "login.html";
        return null;
    }
}

/* ================= INITIALIZE ================= */

async function initDashboard() {
    currentUser = checkAuth();
    if (!currentUser) return;

    const nameEl = document.getElementById("userName");
    const avatar = document.getElementById("userAvatar");

    if (nameEl)
        nameEl.textContent =
            currentUser.full_name?.split(" ")[0] || "User";

    if (avatar)
        avatar.textContent =
            currentUser.full_name?.charAt(0).toUpperCase() || "U";

    await loadDashboardStats();
    await loadRecentAlerts();
    setupEventListeners();
}
function timeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diff = Math.floor((now - past) / 1000);

    if (diff < 60) return "Just now";

    const minutes = Math.floor(diff / 60);
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;

    const days = Math.floor(hours / 24);
    return `${days} day ago`;
}
/* ================= LOAD STATS ================= */

async function loadDashboardStats() {
    try {
        // ✅ FIXED CONTACT ROUTE
        const contactsRes = await fetch(
            `${BASE_URL}/contacts/user/${currentUser.id}`
        );

        const contacts = await contactsRes.json();
        const contactCountEl = document.getElementById("contactCount");

        if (contactCountEl)
            contactCountEl.textContent = contacts.length;

        // ✅ FIXED ALERT ROUTE
        const alertsRes = await fetch(
            `${BASE_URL}/alert_history/${currentUser.id}`
        );

        const alerts = await alertsRes.json();
        const alertCountEl = document.getElementById("alertCount");

        if (alertCountEl)
            alertCountEl.textContent = alerts.length;

    } catch (error) {
        console.error("Dashboard stats error:", error);
    }
}


function displayAlerts(alerts) {

    const container = document.getElementById("recentAlerts");

    if (!container) return;

    if (!alerts.length) {
        container.innerHTML = "<p>No alerts found</p>";
        return;
    }

    container.innerHTML = alerts.map(alert => `
        <div class="alert-item">
            <strong>${alert.message}</strong><br>
            <small>${alert.created_at || ""}</small>
        </div>
    `).join("");
}
/* ================= RECENT ALERTS ================= */

async function loadRecentAlerts() {
    try {
        const res = await fetch(
            `${BASE_URL}/alert_history/${currentUser.id}`
        );

        const alerts = await res.json();
        displayAlerts(data);
        const container = document.getElementById("recentAlertsList");
        if (!container) return;

        if (!alerts || alerts.length === 0) {
            container.innerHTML = "<p>No alerts sent yet</p>";
            return;
        }

        container.innerHTML = alerts
            .slice(0, 5)
            .map(
                (alert) => `
                <div class="contact-item">
                    <strong>Emergency</strong>
                    <div>${alert.message}</div>
                    <small>${new Date(alert.created_at).toLocaleString()}</small>
                </div>
            `
            )
            .join("");

    } catch (error) {
        console.error("Recent alerts error:", error);
    }
}

/* ================= SEND EMERGENCY ================= */

async function sendEmergencyAlert(isSilent = false) {

    if (!currentUser || !currentUser.id) {
        showAlert("User session expired. Please login again.", "danger");
        return;
    }

    const messageInput = document.getElementById("alertMessage");
    const alertMessage =
        messageInput?.value.trim() ||
        `Emergency from ${currentUser.full_name}`;

    try {

        const response = await fetch("http://localhost:5000/alert_history", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_id: currentUser.id,   // ✅ FIXED HERE
                alert_message: alertMessage
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to send alert");
        }

        showAlert("Alert sent successfully!", "success");

        if (messageInput) messageInput.value = "";

        await loadDashboardStats();
        await loadRecentAlerts();

        // close modal
        document.getElementById("emergencyModal").style.display = "none";

    } catch (error) {
        console.error("Send alert error:", error);
        showAlert(error.message, "danger");
    }
}

async function loadContactsForModal() {

    const container = document.getElementById("contactsToNotify");

    if (!container || !currentUser) return;

    try {
        const res = await fetch(
            `${BASE_URL}/contacts/user/${currentUser.id}`
        );

        const contacts = await res.json();

        if (!contacts || contacts.length === 0) {
            container.innerHTML = "No emergency contacts found.";
            return;
        }

        container.innerHTML = contacts
            .map(c => `• ${c.contact_name} (${c.phone})`)
            .join("<br>");

    } catch (error) {
        console.error("Load contacts error:", error);
        container.innerHTML = "Failed to load contacts.";
    }
}
/* ================= EVENTS ================= */

function setupEventListeners() {
    const confirmBtn = document.getElementById("confirmAlert");
    const cancelBtn = document.getElementById("cancelAlert");
    const modal = document.getElementById("emergencyModal");

    if (confirmBtn) {
        confirmBtn.addEventListener("click", async () => {
            await sendEmergencyAlert(false);
            document.getElementById("emergencyModal").style.display = "none";
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });
    }
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn)
        logoutBtn.addEventListener("click", logout);

    const emergencyBtn = document.getElementById("emergencyButton");
    if (emergencyBtn)
        emergencyBtn.addEventListener("click", async () => {
            const modal = document.getElementById("emergencyModal");
            if (modal) {
                modal.style.display = "flex";
                await loadContactsForModal();
            }
        });


    const silentBtn = document.getElementById("silentAlertBtn");
    if (silentBtn)
        silentBtn.addEventListener("click", () => {
            sendEmergencyAlert(true);
        });

}


/* ================= LOGOUT ================= */

function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}

/* ================= START ================= */

document.addEventListener("DOMContentLoaded", initDashboard);