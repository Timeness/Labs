async function checkTransaction() {
    const txHash = document.getElementById("txHash").value.trim();
    if (!txHash) return alert("⚠️ Please enter a transaction hash!");

    document.getElementById("result").innerHTML = "⏳ Fetching transaction details...";

    try {
        const response = await fetch(`/api/check?txHash=${txHash}`);
        const data = await response.json();

        if (data.error) {
            document.getElementById("result").innerHTML = `❌ ${data.error}`;
        } else {
            document.getElementById("result").innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        }
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("result").innerHTML = "❌ Error fetching transaction!";
    }
}
