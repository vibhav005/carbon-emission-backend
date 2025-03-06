require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini AI with API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Sample calculation for carbon footprint based on travel distance
const calculateCarbonFootprint = (distance, mode) => {
    const emissionFactors = {
        car: 0.12, // kg CO2 per km
        bus: 0.07,
        train: 0.04,
        plane: 0.25
    };
    return (distance * (emissionFactors[mode] || 0)).toFixed(2);
};

// API to calculate footprint
app.post("/api/calculate", (req, res) => {
    const { distance, mode } = req.body;
    if (!distance || !mode) return res.status(400).json({ error: "Missing parameters" });

    const carbonFootprint = calculateCarbonFootprint(distance, mode);
    res.json({ carbonFootprint });
});

// AI recommendation using Google Gemini
app.post("/api/recommendations", async (req, res) => {
    try {
        const { carbonFootprint } = req.body;
        if (!carbonFootprint) {
            return res.status(400).json({ error: "Carbon footprint value is required." });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Provide simple and effective ways to reduce a carbon footprint of ${carbonFootprint} kg CO2. Give concise, actionable advice.`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        res.json({ recommendation: response });
    } catch (error) {
        console.error("Gemini API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "AI request failed." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
