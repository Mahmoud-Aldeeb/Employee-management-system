import Payslip from "../models/Payslip.js";
import Employee from "../models/Employee.js";

// Create payslip
// POST /api/payslips
export const createPayslip = async (req, res) => {
  try {
    const { employeeId, month, year, basicSalary, allowances, deductions } =
      req.body;
    if (!employeeId || !month || !year || !basicSalary) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }
    const netSalary =
      Number(basicSalary) + Number(allowances || 0) - Number(deductions || 0);
    // Save payslip to database

    const payslip = await Payslip.create({
      employeeId,
      month: Number(month),
      year: Number(year),
      basicSalary: Number(basicSalary),
      allowances: Number(allowances || 0),
      deductions: Number(deductions || 0),
      netSalary,
    });
    return res.status(201).json({ success: true, data: payslip });
  } catch (error) {
    res.status(500).json({ message: "Error creating payslip", error });
  }
};

// get payslip
// GET /api/payslips/:id
export const getPayslip = async (req, res) => {
  try {
    const session = req.session;
    const isAdmin = session.role === "ADMIN";

    if (isAdmin) {
      const payslip = await Payslip.find()
        .populate("employeeId")
        .sort({ createdAt: -1 });
      const data = payslip.map((p) => {
        const obj = p.toObject();
        return {
          ...obj,
          id: obj._id.toString(),
          employee: obj.employeeId,
          employeeId: obj.employeeId._id.toString(),
        };
      });
      return res.status(200).json({ data });
    } else {
      const employee = await Employee.findOne({ userId: session.id });
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      const payslips = await Payslip.find({ employeeId: employee._id })
        .populate("employeeId")
        .sort({ createdAt: -1 });
      return res.status(200).json({ data: payslips });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching payslips", error });
  }
};

// get payslip by ID
// GET /api/payslips/:id
export const getPayslipById = async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id)
      .populate("employeeId")
      .lean();
    if (!payslip) {
      return res.status(404).json({ message: "Payslip not found" });
    }
    const result = {
      ...payslip,
      id: payslip._id.toString(),
      employee: payslip.employeeId,
    };
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error fetching payslip", error });
  }
};
