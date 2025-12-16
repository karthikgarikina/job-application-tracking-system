const express = require("express");
const app = express();

const authRoutes = require("./modules/auth/auth.routes");
const jobRoutes = require("./modules/jobs/jobs.routes");
const healthRoutes = require("./routes/health.routes");
const protectedRoutes = require("./routes/protected.routes");
const applicationRoutes = require("./modules/applications/applications.routes");



app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api", healthRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/applications", applicationRoutes);

app.get("/", (req, res) => {
  res.send("ATS API is running");
});

module.exports = app;
