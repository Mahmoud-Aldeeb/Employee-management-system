import mongoose from 'mongoose';

const uri = process.env.MONGODB_URL;
const dryRun = process.argv.includes('--dry-run');
const cleanup = process.argv.includes('--cleanup');

if (!uri) {
  console.error('Set MONGODB_URL first');
  process.exit(1);
}

await mongoose.connect(uri);
const employees = mongoose.connection.collection('employees');
const salaries = mongoose.connection.collection('salaries');

const legacy = await employees
  .find({
    $or: [
      { basicSalary: { $exists: true } },
      { allowances: { $exists: true } },
      { deductions: { $exists: true } },
    ],
  })
  .toArray();

let copied = 0;
let cleaned = 0;

for (const employee of legacy) {
  let salaryExists =
    (await salaries.countDocuments(
      { employeeId: employee._id },
      { limit: 1 },
    )) > 0;

  if (!salaryExists) {
    copied += 1;
    if (!dryRun) {
      const now = new Date();
      await salaries.insertOne({
        employeeId: employee._id,
        basicSalary: employee.basicSalary ?? 0,
        allowances: employee.allowances ?? 0,
        deductions: employee.deductions ?? 0,
        createdAt: now,
        updatedAt: now,
      });
      salaryExists = true;
    }
  }

  if (cleanup && salaryExists) {
    cleaned += 1;
    if (!dryRun) {
      await employees.updateOne(
        { _id: employee._id },
        { $unset: { basicSalary: '', allowances: '', deductions: '' } },
      );
    }
  }
}

console.log(dryRun ? 'Dry run (nothing written):' : 'Done:', {
  copied,
  cleaned,
});
await mongoose.disconnect();
