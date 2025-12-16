const prisma = require("../../config/prisma");

// Recruiter creates a job
const createJob = async (req, res) => {
  try {
    const { title, description } = req.body;
    const recruiterId = req.user.userId;

    const recruiter = await prisma.user.findUnique({
      where: { id: recruiterId },
      select: { companyId: true },
    });

    if (!recruiter.companyId) {
      return res
        .status(400)
        .json({ message: "Recruiter is not associated with a company" });
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        recruiterId,
        companyId: recruiter.companyId,
      },
    });

    res.status(201).json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create job" });
  }
};

// List all jobs (public)
const listJobs = async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { status: "OPEN" },
      include: { company: true },
    });

    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

module.exports = {
  createJob,
  listJobs,
};
