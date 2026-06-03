const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { evaluateTurn, generateChallenge } = require("./agent");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "The Mock Arena API" });
});

app.post("/api/battle/start", async (req, res) => {
  try {
    const { bossId, difficulty } = req.body;

    if (!bossId || !difficulty) {
      return res.status(400).json({
        error: "bossId and difficulty are required",
      });
    }

    const result = await generateChallenge(bossId, difficulty);
    res.json(result);
  } catch (error) {
    console.error("Battle start error:", error.message);
    res.status(500).json({
      error: "Failed to generate challenge",
    });
  }
});

app.post("/api/battle/turn", async (req, res) => {
  try {
    const { bossId, userResponse, difficulty } = req.body;

    if (!bossId || !userResponse) {
      return res.status(400).json({
        error: "bossId and userResponse are required",
      });
    }

    const result = await evaluateTurn(bossId, userResponse, difficulty || "medium");
    res.json(result);
  } catch (error) {
    console.error("Battle turn error:", error.message);
    res.status(500).json({
      dialogue: "The arena processors falter. Try again.",
      damageTo: "none",
      damageAmount: 0,
    });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`The Mock Arena backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;
