const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../../config/prisma");

const register = async (req, res) => {
  try {
    const { name, email, password, role, companyName } = req.body;

    // basic validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // recruiter must provide company name
    if (role === "RECRUITER" && !companyName) {
      return res
        .status(400)
        .json({ message: "Recruiter must provide companyName" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ declare ONCE
    let companyId = null;

    // Recruiter → creates company
    if (role === "RECRUITER") {
      const company = await prisma.company.create({
        data: { name: companyName },
      });
      companyId = company.id;
    }

    // Hiring Manager → joins existing company
    if (role === "HIRING_MANAGER") {
      const parsedCompanyId = Number(req.body.companyId);

      if (!parsedCompanyId || isNaN(parsedCompanyId)) {
        return res.status(400).json({
          message: "Hiring Manager must provide a valid companyId",
        });
      }

      const company = await prisma.company.findUnique({
        where: { id: parsedCompanyId },
      });

      if (!company) {
        return res.status(400).json({ message: "Invalid companyId" });
      }

      companyId = company.id;
    }

    // Candidate → companyId remains null ✅

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        companyId,
      },
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};

module.exports = { register, login };
