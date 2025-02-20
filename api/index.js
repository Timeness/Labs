const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();

const PORT = 3000;
app.use(cors());

const CHAINBASE_API_KEY = "YOUR_CHAINBASE_API_KEY";  
const COVALENT_API_KEY = "YOUR_COVALENT_API_KEY";    
const BLOCKCHAIR_API = "https://api.blockchair.com/";
const CHAINLIST_API = "https://chainid.network/chains.json"; 

let chainList = {};

async function fetchChainList() {
    try {
        const response = await axios.get(CHAINLIST_API);
        chainList = response.data.reduce((acc, chain) => {
            acc[chain.chainId] = chain.name.toLowerCase();
            return acc;
        }, {});
        console.log("✅ Blockchain List Updated!");
    } catch (error) {
        console.error("Error fetching blockchain list:", error);
    }
}

fetchChainList();
setInterval(fetchChainList, 86400000);

app.get("/api/check", async (req, res) => {
    try {
        const { txHash } = req.query;
        if (!txHash) return res.json({ error: "Transaction hash required!" });

        const network = await detectNetworkChainbase(txHash);
        if (!network) return res.json({ error: "Unsupported network or invalid hash!" });

        let response;
        if (network in chainList) {
            response = await axios.get(`https://api.covalenthq.com/v1/${chainList[network]}/transaction_v2/${txHash}/?key=${COVALENT_API_KEY}`);
            const txData = response.data.data.items[0];

            if (!txData) return res.json({ error: "Transaction not found!" });

            let result = {
                "Transaction Hash": txHash,
                "From": txData.from_address,
                "To": txData.to_address,
                "Value": `${txData.value} ${chainList[network].toUpperCase()}`,
                "USD Value": `$${txData.value_quote} USD`,
                "Transaction Fee": txData.fees_paid,
                "Gas Limit": txData.gas_limit,
                "Gas Price": txData.gas_price,
                "Block Number": txData.block_height,
                "Status": txData.successful ? "Success" : "Failed",
                "Timestamp (UTC)": txData.block_signed_at
            };

            res.json(result);
        } else {
            response = await axios.get(`${BLOCKCHAIR_API}${network}/dashboards/transaction/${txHash}`);
            const txData = response.data.data[txHash];

            if (!txData) return res.json({ error: "Transaction not found!" });

            let result = {
                "Transaction Hash": txHash,
                "From": txData.transaction.sender || "N/A",
                "To": txData.transaction.recipient || "N/A",
                "Value": `${txData.transaction.value} ${network.toUpperCase()}`,
                "USD Value": `$${txData.transaction.value_usd || "0"} USD`,
                "Transaction Fee": txData.transaction.fee || "N/A",
                "Gas Limit": txData.transaction.gas_limit || "N/A",
                "Gas Price": txData.transaction.gas_price || "N/A",
                "Block Number": txData.transaction.block_id || "Pending",
                "Status": txData.transaction.status || "Pending",
                "Timestamp (UTC)": txData.transaction.time || "N/A"
            };

            res.json(result);
        }
    } catch (error) {
        console.error("Error fetching transaction:", error);
        res.json({ error: "Failed to fetch transaction details!" });
    }
});

async function detectNetworkChainbase(txHash) {
    try {
        const response = await axios.get(`https://api.chainbase.online/v1/hash/${txHash}`, {
            headers: { "x-api-key": CHAINBASE_API_KEY }
        });
        return response.data.data.chain_name || null;
    } catch (error) {
        console.error("Error detecting network:", error);
        return null;
    }
}

app.listen(PORT, () => console.log(`Server running on ::${PORT}`));
