const express = require("express");
const prisma = require("../config/prisma");

const router = express.Router();

router.get("/health/db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "OK", database: "connected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "FAIL", database: "not connected" });
  }
});

module.exports = router;