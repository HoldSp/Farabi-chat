import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

dotenv.config();

const keepEmail = process.argv[2] || "turlybek_baiken@live.kaznu.kz";
const defaultPassword = process.argv[3] || "admin123";

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const users = mongoose.connection.db.collection("users");
  const pendingRegistrations = mongoose.connection.db.collection("pendingregistrations");

  const existingAdmin = await users.findOne({ email: keepEmail });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    await users.insertOne({
      firstName: "Turlybek",
      lastName: "Baiken",
      displayName: "Turlybek Baiken",
      bio: "",
      email: keepEmail,
      password: passwordHash,
      faculty: "Факультет информационных технологий",
      specialty: "Программная инженерия",
      course: 4,
      isEmailVerified: true,
      verificationCode: null,
      verificationExpires: null,
      role: "admin",
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  const deletedUsers = await users.deleteMany({
    email: { $ne: keepEmail }
  });

  const deletedPending = await pendingRegistrations.deleteMany({
    email: { $ne: keepEmail }
  });

  const remaining = await users
    .find({}, { projection: { email: 1, role: 1 } })
    .toArray();

  console.log(
    JSON.stringify(
      {
        keepEmail,
        createdAdmin: !existingAdmin,
        deletedUsers: deletedUsers.deletedCount,
        deletedPending: deletedPending.deletedCount,
        remaining
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });