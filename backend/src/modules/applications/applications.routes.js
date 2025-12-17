const express = require("express");
const authenticate = require("../../middlewares/auth.middleware");
const authorize = require("../../middlewares/rbac.middleware");

const {
  applyForJob,
  myApplications,
  applicationsForJob,
  updateApplicationStage,
  companyApplicationsForHM,
} = require("./applications.controller");


const router = express.Router();

// Candidate applies
router.post(
  "/apply",
  authenticate,
  authorize("CANDIDATE"),
  applyForJob
);

// Candidate views own applications
router.get(
  "/me",
  authenticate,
  authorize("CANDIDATE"),
  myApplications
);

// Recruiter views applications for a job
router.get(
  "/job/:jobId",
  authenticate,
  authorize("RECRUITER"),
  applicationsForJob
);

// Recruiter updates application stage
router.post(
  "/update-stage",
  authenticate,
  authorize("RECRUITER"),
  updateApplicationStage
);

router.get(
  "/company",
  authenticate,
  authorize("HIRING_MANAGER"),
  companyApplicationsForHM
);


module.exports = router;
