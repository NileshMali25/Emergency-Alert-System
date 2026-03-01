const API_BASE = "http://localhost:5000";

let currentUser = null;
let allContacts = [];
let editingContactId = null;



/* ================= ALERT ================= */

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
    }, 3000);
}

/* ================= AUTH ================= */

function checkAuth() {
    const userString = localStorage.getItem("currentUser");

    if (!userString || userString === "undefined") {
        window.location.href = "login.html";
        return null;
    }

    try {
        return JSON.parse(userString);
    } catch (error) {
        localStorage.removeItem("currentUser");
        window.location.href = "login.html";
        return null;
    }
}

/* ================= VALIDATION ================= */

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
    return /^[0-9]{10,}$/.test(phone.replace(/\D/g, ""));
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {
    currentUser = checkAuth();
    if (!currentUser) return;

    const avatar = document.getElementById("userAvatar");
    if (avatar && currentUser.full_name) {
        avatar.textContent =
            currentUser.full_name.charAt(0).toUpperCase();
    }

    document
        .getElementById("addContactBtn")
        ?.addEventListener("click", showAddContactModal);

    document
        .getElementById("logoutBtn")
        ?.addEventListener("click", logout);

    document
        .getElementById("contactForm")
        ?.addEventListener("submit", saveContact);

    document
        .getElementById("cancelContact")
        ?.addEventListener("click", () => {
            document.getElementById("contactForm")?.reset();
            document
                .getElementById("contactModal")
                ?.classList.remove("active");
        });

    document
        .getElementById("searchContact")
        ?.addEventListener("input", filterContacts);

    document
        .getElementById("filterRelationship")
        ?.addEventListener("change", filterContacts);

    await loadContacts();
});

/* ================= LOAD CONTACTS ================= */

async function loadContacts() {

    if (!currentUser || !currentUser.id) {
        console.log("User not loaded yet");
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE}/contacts/user/${currentUser.id}`
        );

        if (!response.ok)
            throw new Error("Failed to fetch contacts");

        const data = await response.json();

        allContacts = Array.isArray(data) ? data : [];

        updateStats();
        displayContacts(allContacts);

    } catch (error) {
        console.error("Load error:", error);
        showAlert("Failed to load contacts", "danger");
    }
}

/* ================= DISPLAY ================= */

function displayContacts(contacts) {
    const list = document.getElementById("contactsList");
    if (!list) return;

    if (!contacts.length) {
        list.innerHTML =
            "<p style='text-align:center'>No contacts found</p>";
        return;
    }

    list.innerHTML = contacts
        .map(
            (c) => `
        <div class="contact-item">
            <div class="contact-info">
                <strong>${c.contact_name}</strong><br>
                ${c.phone || "-"} | ${c.email || "-"}<br>
                ${c.relationship || "-"} | Priority: ${c.priority || 1}
            </div>
            <div class="contact-actions">
                <button onclick="editContact(${c.id})">Edit</button>
                <button onclick="showDeleteModal(${c.id})">Delete</button>
            </div>
        </div>
    `
        )
        .join("");
}

function updateStats() {
    const total = document.getElementById("totalContacts");
    if (total) total.textContent = allContacts.length;
}

/* ================= ADD / EDIT ================= */

function showAddContactModal() {
    editingContactId = null;
    document.getElementById("contactForm")?.reset();
    document
        .getElementById("contactModal")
        ?.classList.add("active");
}

function editContact(id) {
    const contact = allContacts.find((x) => x.id === id);
    if (!contact) return;

    editingContactId = id;

    document.getElementById("contactName").value =
        contact.contact_name || "";
    document.getElementById("contactPhone").value =
        contact.phone || "";
    document.getElementById("contactEmail").value =
        contact.email || "";
    document.getElementById("contactRelationship").value =
        contact.relationship || "";
    document.getElementById("contactPriority").value =
        contact.priority || 1;

    document
        .getElementById("contactModal")
        ?.classList.add("active");
}

async function saveContact(e) {
    e.preventDefault();

    const name =
        document.getElementById("contactName").value.trim();
    const phone =
        document.getElementById("contactPhone").value.trim();
    const email =
        document.getElementById("contactEmail").value.trim();

    if (!name || !phone) {
        showAlert("Name and phone are required", "danger");
        return;
    }

    if (!validatePhone(phone)) {
        showAlert("Invalid phone number", "danger");
        return;
    }

    if (email && !validateEmail(email)) {
        showAlert("Invalid email format", "danger");
        return;
    }

    const contactData = {
        user_id: currentUser.id,
        contact_name: name,
        phone: phone,
        email: email,
        relationship:
            document.getElementById("contactRelationship")
                .value || "",
        priority: Number(
            document.getElementById("contactPriority").value
        ) || 1,
    };

    try {
        let res;

        if (editingContactId) {
            res = await fetch(
                `${API_BASE}/contacts/${editingContactId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(contactData),
                }
            );
        } else {
            res = await fetch(`${API_BASE}/contacts`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(contactData),
            });
        }

        if (res.ok) {
            showAlert("Contact saved successfully");
            document.getElementById("contactForm")?.reset();
            document
                .getElementById("contactModal")
                ?.classList.remove("active");
            await loadContacts();
        } else {
            const data = await res.json().catch(() => ({}));
            showAlert(
                data.message || "Failed to save contact",
                "danger"
            );
        }
    } catch (err) {
        console.error(err);
        showAlert("Server error", "danger");
    }
}

/* ================= DELETE ================= */

function showDeleteModal(id) {
    if (confirm("Delete this contact?")) {
        deleteContact(id);
    }
}

async function deleteContact(id) {
    try {
        const res = await fetch(
            `${API_BASE}/contacts/${id}`,
            { method: "DELETE" }
        );

        if (res.ok) {
            showAlert("Deleted successfully");
            await loadContacts();
        } else {
            showAlert("Delete failed", "danger");
        }
    } catch (err) {
        console.error(err);
        showAlert("Server error", "danger");
    }
}

/* ================= FILTER ================= */

function filterContacts() {
    const search =
        document
            .getElementById("searchContact")
            ?.value.toLowerCase() || "";

    const relationship =
        document.getElementById("filterRelationship")
            ?.value || "";

    let filtered = [...allContacts];

    if (search) {
        filtered = filtered.filter(
            (c) =>
                c.contact_name
                    ?.toLowerCase()
                    .includes(search) ||
                c.phone?.includes(search) ||
                c.email
                    ?.toLowerCase()
                    .includes(search)
        );
    }

    if (relationship) {
        filtered = filtered.filter(
            (c) => c.relationship === relationship
        );
    }

    displayContacts(filtered);
}

/* ================= LOGOUT ================= */

function logout() {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("isLoggedIn");
    window.location.href = "login.html";
}

/* ================= GLOBAL ================= */

window.editContact = editContact;
window.showDeleteModal = showDeleteModal;