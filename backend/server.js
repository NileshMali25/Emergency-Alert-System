const axios = require("axios");

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* ================= DATABASE ================= */

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "emergency_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection failed:", err);
    } else {
        console.log("Database connected successfully");
        connection.release();
    }
});
/* ================= REGISTER ================= */

app.post("/register", (req, res) => {
    const { full_name, email, phone, password } = req.body;

    if (!full_name || !email || !phone || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Check duplicate email
    const checkSql = "SELECT id FROM users WHERE email = ?";
    db.query(checkSql, [email], (err, result) => {
        if (err) {
            console.error("Register check error:", err);
            return res.status(500).json({ message: "Server error" });
        }

        if (result.length > 0) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const insertSql = `
            INSERT INTO users (full_name, email, phone, password)
            VALUES (?, ?, ?, ?)
        `;

        db.query(insertSql, [full_name, email, phone, password], (err) => {
            if (err) {
                console.error("Register insert error:", err);
                return res.status(500).json({ message: "Registration failed" });
            }

            res.json({ message: "Registered successfully" });
        });
    });
});

/* ================= LOGIN ================= */

app.post("/login", (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT id, full_name, email, phone, registration_date FROM users WHERE email=? AND password=?";

    db.query(sql, [email, password], (err, result) => {
        if (err) return res.status(500).json({ message: "Login failed" });

        if (result.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        res.json({
            message: "Login successful",
            user: result[0]
        });
    });
});

/* ================= PROFILE ================= */

app.get("/profile/:id", (req, res) => {
    const sql = `
        SELECT id, full_name, email, phone, registration_date 
        FROM users 
        WHERE id=?
    `;

    db.query(sql, [req.params.id], (err, result) => {
        if (err) {
            console.error("Profile error:", err);
            return res.status(500).json({ message: "Profile fetch failed" });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(result[0]);
    });
});

/* ================= CONTACTS ================= */

// GET contacts
app.get("/contacts/user/:userId", (req, res) => {

    const sql = "SELECT * FROM contacts WHERE user_id=?";

    db.query(sql, [req.params.userId], (err, result) => {

        if (err) {
            console.error("Fetch contacts error:", err);
            return res.json([]);   // 👈 Don't crash server
        }

        res.json(result);
    });
});

// ADD contact
app.post("/contacts", (req, res) => {
    const { user_id, contact_name, phone, email, relationship, priority } = req.body;

    if (!user_id || !contact_name || !phone) {
        return res.status(400).json({ message: "Required fields missing" });
    }

    const sql = `
        INSERT INTO contacts 
        (user_id, contact_name, phone, email, relationship, priority)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [user_id, contact_name, phone, email || null, relationship || null, priority || 1],
        (err, result) => {
            if (err) {
                console.error("Add contact error:", err);
                return res.status(500).json({ message: "Add failed" });
            }

            res.json({
                message: "Contact added successfully",
                id: result.insertId
            });
        }
    );
});

// UPDATE contact
app.put("/contacts/:id", (req, res) => {
    const { contact_name, phone, email, relationship, priority } = req.body;

    if (!contact_name || !phone) {
        return res.status(400).json({ message: "Name and phone required" });
    }

    const sql = `
        UPDATE contacts
        SET contact_name=?, phone=?, email=?, relationship=?, priority=?
        WHERE id=?
    `;

    db.query(
        sql,
        [contact_name, phone, email || null, relationship || null, priority || 1, req.params.id],
        (err) => {
            if (err) {
                console.error("Update error:", err);
                return res.status(500).json({ message: "Update failed" });
            }

            res.json({ message: "Updated successfully" });
        }
    );
});

// DELETE contact
app.delete("/contacts/:id", (req, res) => {
    const sql = "DELETE FROM contacts WHERE id=?";

    db.query(sql, [req.params.id], (err) => {
        if (err) {
            console.error("Delete error:", err);
            return res.status(500).json({ message: "Delete failed" });
        }

        res.json({ message: "Deleted successfully" });
    });
});

// FAKE SMS FUNCTION (FOR DEMO)
function sendFakeSMS(phone, message) {
    console.log("Demo SMS Sent To:", phone);
    console.log("Message:", message);

    return {
        return: true,
        message: "SMS sent successfully (Demo Mode)"
    };
}

/* ================= EMERGENCY ALERT ================= */

// GET emergency contacts for user
app.get("/tables/emergency_contacts/:userId", (req, res) => {
    const sql = `
        SELECT * FROM contacts 
        WHERE user_id=? 
        ORDER BY priority DESC
    `;

    db.query(sql, [req.params.userId], (err, result) => {
        if (err) {
            console.error("Fetch emergency contacts error:", err);
            return res.status(500).json({ message: "Fetch failed" });
        }

        res.json(result);
    });
});
//FOR REAL API
// app.post("/alert_history", async (req, res) => {

//     const { user_id, alert_message } = req.body;

//     if (!user_id || !alert_message) {
//         return res.status(400).json({ message: "Required fields missing" });
//     }

//     try {

//         // 1️⃣ Insert alert in DB FIRST
//         const sql = `
//             INSERT INTO alert_history (user_id, message, location)
//             VALUES (?, ?, 'Unknown')
//         `;

//         await new Promise((resolve, reject) => {
//             db.query(sql, [user_id, alert_message], (err) => {
//                 if (err) reject(err);
//                 else resolve();
//             });
//         });

//         // 2️⃣ Fetch contacts
//         const contacts = await new Promise((resolve, reject) => {
//             db.query(
//                 "SELECT phone FROM contacts WHERE user_id=?",
//                 [user_id],
//                 (err, result) => {
//                     if (err) reject(err);
//                     else resolve(result);
//                 }
//             );
//         });

//        // 3️⃣ Send SMS (Demo Safe)
//         for (let contact of contacts) {
//             try {
//                 await axios.post(
//                     "https://www.fast2sms.com/dev/bulkV2",
//                     {
//                         route: "q",
//                         message: alert_message,
//                         language: "english",
//                         numbers: contact.phone
//                     },
//                     {
//                         headers: {
//                             authorization: " ",
//                             "Content-Type": "application/json"
//                         }
//                     }
//                 );
//             } catch (smsError) {
//                 console.log("SMS failed for:", contact.phone);
//             }
//         }


//         // 4️⃣ ALWAYS success response (Very Important)
//         res.json({ success: true, message: "Alert saved & SMS processed" });

//     } catch (error) {
//         console.error("Alert error:", error);
//         res.status(500).json({ message: "Server error" });
//     }
// });

app.post("/alert_history", async (req, res) => {

    let successCount = 0;
    const { user_id, alert_message } = req.body;

    if (!user_id || !alert_message) {
        return res.status(400).json({ message: "Required fields missing" });
    }

    try {

        const sql = `
            INSERT INTO alert_history (user_id, message, location)
            VALUES (?, ?, 'Unknown')
        `;

        await new Promise((resolve, reject) => {
            db.query(sql, [user_id, alert_message], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        const contacts = await new Promise((resolve, reject) => {
            db.query(
                "SELECT phone FROM contacts WHERE user_id=?",
                [user_id],
                (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                }
            );
        });

        // 🔥 DEMO MODE SMS
        for (let contact of contacts) {
            console.log("📩 SMS Sent To:", contact.phone);
            console.log("Message:", alert_message);
        }

        res.json({ success: true, message: "Alert saved successfully (Demo Mode)" });

    } catch (error) {
        console.error("Alert error:", error);
        res.status(500).json({ message: "Server error" });
    }
    
     
});


app.get("/alert_history/:user_id", async (req, res) => {

    const user_id = req.params.user_id;

    try {
        const [alerts] = await db.promise().query(
            "SELECT * FROM alert_history WHERE user_id=? ORDER BY created_at DESC",
            [user_id]
        );

        res.json(alerts);

    } catch (err) {
        res.status(500).json({ message: "Error loading history" });
    }
});

/* ================= GET ALERT HISTORY ================= */

app.get("/test-sms", async (req, res) => {

    try {

        const response = await axios.post(
            "https://www.fast2sms.com/dev/bulkV2",
            {
                route: "q",
                message: "Emergency Test Message",
                language: "english",
                numbers: "91XXXXXXXXX"
            },
            {
                headers: {
                    authorization: "YOUR API KEY",
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("FAST2SMS RESPONSE:", response.data);

        res.json(response.data);

    } catch (error) {

        console.log("FAST2SMS ERROR:",
            error.response?.data || error.message
        );

        res.status(500).json(
            error.response?.data || { error: error.message }
        );
    }
});

app.put("/resolve_alert/:id", async (req, res) => {

    try {
        await db.promise().query(
            "UPDATE alert_history SET resolved=TRUE WHERE id=?",
            [req.params.id]
        );

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ success: false });
    }
});

app.get("/test", (req, res) => {
    res.send("Server working");
});
/* ================= START SERVER ================= */

app.listen(5000, () =>
    console.log("🚀 Server running on http://localhost:5000")
);

