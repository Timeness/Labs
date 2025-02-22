const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const webauthn = require("webauthn");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

const DATABASE_FILE = "./server/database.json";

let database = { admins: [], approvals: [], failedAttempts: 0, systemLocked: false, ownerPassword: process.env.OWNER_PASSWORD, fingerprints: [] };
if (fs.existsSync(DATABASE_FILE)) {
    database = JSON.parse(fs.readFileSync(DATABASE_FILE, "utf-8"));
}

const saveDatabase = () => {
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(database, null, 2));
};

const generateChallenge = () => {
    return webauthn.generateChallenge();
};

const verifyAssertion = (credential, challenge) => {
    return webauthn.verifyAssertion(credential, challenge);
};

app.post("/register-fingerprint", async (req, res) => {
    const { fingerprint } = req.body;

    const newChallenge = generateChallenge();
    database.fingerprints.push({ fingerprint, challenge: newChallenge });
    saveDatabase();

    res.json({ challenge: newChallenge });
});

app.post("/authenticate-fingerprint", async (req, res) => {
    const { fingerprint, assertion } = req.body;

    const storedFingerprint = database.fingerprints.find(f => f.fingerprint === fingerprint);
    if (!storedFingerprint) return res.status(401).json({ success: false, message: "Fingerprint not found." });

    const isVerified = verifyAssertion(assertion, storedFingerprint.challenge);
    if (isVerified) {
        res.json({ success: true, message: "Fingerprint authenticated!" });
    } else {
        res.status(401).json({ success: false, message: "Authentication failed." });
    }
});

app.post("/login", (req, res) => {
    if (database.systemLocked) {
        return res.status(403).json({ success: false, message: "System is locked. Contact owner to unlock." });
    }

    const { password } = req.body;
    if (password === process.env.OWNER_PASSWORD) {
        database.failedAttempts = 0;
        saveDatabase();
        return res.json({ success: true, message: "Owner login successful. Unlocking system." });
    }

    const validAdmin = database.admins.some((hashedPass) =>
        bcrypt.compareSync(password, hashedPass)
    );

    if (validAdmin) {
        database.failedAttempts = 0;
        saveDatabase();
        res.json({ success: true, message: "Login Successful" });
    } else {
        database.failedAttempts += 1;
        if (database.failedAttempts >= 5) {
            database.systemLocked = true;
            saveDatabase();
            return res.status(403).json({ success: false, message: "Too many failed attempts. System is locked." });
        }
        saveDatabase();
        res.status(401).json({ success: false, message: "Unauthorized" });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
