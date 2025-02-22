const API_URL = "https://hash-labs.vercel.app";

// Handle login and fingerprint actions
document.getElementById("loginBtn").addEventListener("click", async () => {
    const password = document.getElementById("adminPassword").value;
    if (!password) return;

    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
    });

    const data = await response.json();
    if (data.success) {
        showToast("Login Successful!");
        document.getElementById("fingerprintAuth").style.display = "block";
    } else {
        showToast(data.message, true);
    }
});

document.getElementById("registerFingerprint").addEventListener("click", async () => {
    const fingerprint = prompt("Place your fingerprint on the sensor.");
    if (!fingerprint) return;

    const response = await fetch(`${API_URL}/register-fingerprint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fingerprint }),
    });

    const data = await response.json();
    showToast(data.success ? "Fingerprint registered successfully." : "Error registering fingerprint.", !data.success);
});

document.getElementById("authenticateFingerprint").addEventListener("click", async () => {
    const fingerprint = prompt("Place your fingerprint on the sensor.");
    if (!fingerprint) return;

    const assertion = prompt("Enter the fingerprint assertion data.");
    const response = await fetch(`${API_URL}/authenticate-fingerprint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fingerprint, assertion }),
    });

    const data = await response.json();
    if (data.success) {
        showToast("Fingerprint authenticated!");
    } else {
        showToast(data.message, true);
    }
});

// Display toast notifications
function showToast(message, isError = false) {
    const toast = document.createElement("div");
    toast.className = `toast ${isError ? "error" : ""}`;
    toast.innerText = message;
    document.getElementById("toast-container").appendChild(toast);
    setTimeout(() => toast.classList.add("removed"), 3000);
    setTimeout(() => toast.remove(), 4000);
}
