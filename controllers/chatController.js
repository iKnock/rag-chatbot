const { generateResponse } = require("../services/ragService");

async function chat(req, res) {
    const { message, user } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });

    try {
        const response = await generateResponse(user, message);
        res.json({ response });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = { chat };
