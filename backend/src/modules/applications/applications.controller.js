const prisma = require("../../config/prisma");
const { canTransition } = require("../../services/applicationWorkflow");
const { addToEmailQueue } = require("../../queues/emailQueue");

/**
 * Candidate applies for a job
 */
const applyForJob = async (req, res) => {
  try {
    const candidateId = req.user.userId;
    const { jobId } = req.body;

    // ensure job exists & is open
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job || job.status !== "OPEN") {
      return res.status(400).json({ message: "Job not available" });
    }

    // prevent duplicate application (extra safety)
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobId_candidateId: {
          jobId,
          candidateId,
        },
      },
    });

    if (existingApplication) {
      return res
        .status(400)
        .json({ message: "Already applied to this job" });
    }

    const application = await prisma.application.create({
      data: {
        jobId,
        candidateId,
      },
    });

    res.status(201).json({
      message: "Application submitted successfully",
      application,
    });
    const { addToEmailQueue } = require("../../queues/emailQueue");

    addToEmailQueue({
      to: "recruiter@company.com",
      subject: "New job application received",
      body: `A new candidate has applied for job ID ${jobId}`,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to apply for job" });
  }
};

/**
 * Candidate views own applications
 */
const myApplications = async (req, res) => {
  try {
    const candidateId = req.user.userId;

    const applications = await prisma.application.findMany({
      where: { candidateId },
      include: {
        job: true,
      },
    });

    res.json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
};

/**
 * Recruiter views applications for a job
 */
const applicationsForJob = async (req, res) => {
  try {
    const recruiterId = req.user.userId;
    const jobId = parseInt(req.params.jobId);

    // ensure recruiter owns this job
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        recruiterId,
      },
    });

    if (!job) {
      return res.status(403).json({ message: "Access denied" });
    }

    const applications = await prisma.application.findMany({
      where: { jobId },
      include: {
        candidate: true,
      },
    });

    res.json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch job applications" });
  }
};

/**
 * Recruiter updates application stage
 */
const updateApplicationStage = async (req, res) => {
  try {
    const recruiterId = req.user.userId;
    const { applicationId, toStage } = req.body;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        candidate: {
          select: {
            email: true,
          },
        },
      },
    });
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // recruiter must own the job
    if (application.job.recruiterId !== recruiterId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const fromStage = application.stage;

    if (!canTransition(fromStage, toStage)) {
      return res.status(400).json({
        message: `Invalid transition from ${fromStage} to ${toStage}`,
      });
    }

    // update stage
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { stage: toStage },
    });

    addToEmailQueue({
      to: application.candidate.email,
      subject: "Application status updated",
      body: `Your application moved from ${fromStage} to ${toStage}`,
    });
    // audit log
    await prisma.applicationHistory.create({
      data: {
        applicationId,
        fromStage,
        toStage,
        changedById: recruiterId,
      },
    });

    res.json({
      message: "Application stage updated",
      application: updatedApplication,
    });


  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update stage" });
  }
};

const companyApplicationsForHM = async (req, res) => {
  try {
    const { companyId } = req.user;

    const applications = await prisma.application.findMany({
      where: {
        job: {
          companyId,
        },
      },
      include: {
        job: true,
        candidate: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch company applications",
    });
  }
};



module.exports = {
  applyForJob,
  myApplications,
  applicationsForJob,
  updateApplicationStage,
  companyApplicationsForHM,
};
