const express = require("express");
const authenticate = require("../../middlewares/auth.middleware");
const authorize = require("../../middlewares/rbac.middleware");
const { createJob, listJobs } = require("./jobs.controller");

const router = express.Router();

// Public: list jobs
router.get("/", listJobs);

// Recruiter-only: create job
router.post("/", authenticate, authorize("RECRUITER"), createJob);

module.exports = router;
