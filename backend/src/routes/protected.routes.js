const express = require("express");
const authenticate = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/rbac.middleware");

const router = express.Router();

// Only logged-in users
router.get("/me", authenticate, (req, res) => {
  res.json({
    message: "You are authenticated",
    user: req.user,
  });
});

// Only recruiters
router.get(
  "/recruiter-only",
  authenticate,
  authorize("RECRUITER"),
  (req, res) => {
    res.json({ message: "Welcome Recruiter" });
  }
);

module.exports = router;
