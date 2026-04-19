import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { randomUUID } from "crypto";
import crypto from "crypto";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { FACULTIES } from "./config.mjs";
import {
  normalizeEmail,
  validateKaznuEmail,
  validatePassword,
  validateName,
  validateNickname,
  validateCourse,
  validateRequiredField
} from "./validators.mjs";

dotenv.config();

mongoose.set("bufferCommands", false);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, "public");

app.use(express.static(publicPath));
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/kaznu-chat";
const PORT = process.env.PORT || 3001;
const MAIL_USER = process.env.MAIL_USER;
const MAIL_PASS = process.env.MAIL_PASS;
const DISABLE_EMAIL = process.env.DISABLE_EMAIL !== "false";
const AUTH_COOKIE_NAME = "farabi_auth";
const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const AUTH_TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || "dev-auth-token-secret-change-me";

let mongoReady = false;
const demoStore = {
  users: [],
  pendingRegistrations: [],
  events: [],
  announcements: [],
  messages: []
};

mongoose
  .connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(async () => {
    mongoReady = true;
    console.log("MongoDB подключена");
    await seedDemoData();
  })
  .catch((err) => {
    mongoReady = false;
    console.error("Ошибка MongoDB:", err.message);
  });

const messageSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
    time: { type: String, required: true },
    room: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    date: { type: String, required: true, trim: true },
    place: { type: String, required: true, trim: true },
    faculty: { type: String, default: "Все факультеты", trim: true },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
    meta: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    displayName: { type: String, default: "" },
    bio: { type: String, default: "" },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    faculty: { type: String, required: true, trim: true },
    specialty: { type: String, required: true, trim: true },
    course: { type: Number, required: true, min: 1, max: 4 },
    isEmailVerified: { type: Boolean, default: false },
    verificationCode: { type: String, default: null },
    verificationExpires: { type: Date, default: null },
    role: { type: String, enum: ["student", "admin"], default: "student" },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const pendingRegistrationSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    displayName: { type: String, default: "", trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    faculty: { type: String, required: true, trim: true },
    specialty: { type: String, required: true, trim: true },
    course: { type: Number, required: true, min: 1, max: 4 },
    verificationCode: { type: String, required: true },
    verificationExpires: { type: Date, required: true },
    role: { type: String, enum: ["student", "admin"], default: "student" },
  },
  { timestamps: true }
);

function attachPasswordHashHook(schema) {
  schema.pre("save", async function () {
    if (!this.isModified("password")) return;
    if (/^\$2[aby]\$\d{2}\$/.test(this.password)) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  });
}

attachPasswordHashHook(userSchema);
attachPasswordHashHook(pendingRegistrationSchema);

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const mailTransporter =
  !DISABLE_EMAIL && MAIL_USER && MAIL_PASS
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: MAIL_USER,
          pass: MAIL_PASS,
        },
      })
    : null;

if (mailTransporter) {
  mailTransporter
    .verify()
    .then(() => {
      console.log("SMTP подключен");
    })
    .catch((mailErr) => {
      console.error("Ошибка SMTP:", mailErr.message);
    });
}

function parseNameFromKaznuEmail(email) {
  const local = String(email || "").trim().toLowerCase().split("@")[0];
  const [lastNamePart = "", firstNamePart = ""] = local.split("_");

  const normalizeWord = (value) =>
    value
      ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
      : "";

  return {
    autoLastName: normalizeWord(lastNamePart),
    autoFirstName: normalizeWord(firstNamePart),
  };
}

async function sendVerificationEmail(targetEmail, verificationCode) {
  if (DISABLE_EMAIL || !mailTransporter) {
    console.log("Отправка писем отключена для локального запуска");
    return;
  }

  try {
    const info = await mailTransporter.sendMail({
      from: MAIL_USER,
      to: targetEmail,
      subject: "Подтверждение почты Farabi Chat",
      text: `Ваш код подтверждения: ${verificationCode}. Код действует 10 минут.`,
    });
    console.log("✅ Письмо отправлено на", targetEmail);
    console.log("📬 Response ID:", info.response);
  } catch (mailErr) {
    console.error("❌ Ошибка отправки письма:", mailErr.message);
    throw new Error("Не удалось отправить письмо с кодом подтверждения");
  }
}

const Message = mongoose.model("Message", messageSchema);
const Event = mongoose.model("Event", eventSchema);
const Announcement = mongoose.model("Announcement", announcementSchema);
const User = mongoose.model("User", userSchema);
const PendingRegistration = mongoose.model("PendingRegistration", pendingRegistrationSchema);

function createDemoId() {
  return randomUUID();
}

function getAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: "/"
  };
}

function parseCookieHeader(cookieHeader) {
  return String(cookieHeader || "")
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((result, entry) => {
      const separatorIndex = entry.indexOf("=");
      if (separatorIndex === -1) return result;
      const key = entry.slice(0, separatorIndex).trim();
      const value = entry.slice(separatorIndex + 1).trim();
      result[key] = decodeURIComponent(value);
      return result;
    }, {});
}

function createAuthToken(user) {
  const payload = {
    email: normalizeEmail(user?.email),
    role: user?.role || "student",
    exp: Date.now() + AUTH_COOKIE_MAX_AGE
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", AUTH_TOKEN_SECRET).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function readAuthTokenPayload(token) {
  if (!token || !token.includes(".")) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = crypto.createHmac("sha256", AUTH_TOKEN_SECRET).update(encodedPayload).digest("base64url");
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (!payload?.email || !payload?.exp || payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function setAuthCookie(res, user) {
  res.cookie(AUTH_COOKIE_NAME, createAuthToken(user), getAuthCookieOptions());
}

function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, getAuthCookieOptions());
}

async function hashPlaintextPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(String(password || "").trim(), salt);
}

function formatUserResponse(user) {
  return {
    id: String(user?._id || user?.id || ""),
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    displayName: user?.displayName || "",
    email: user?.email || "",
    faculty: user?.faculty || "",
    specialty: user?.specialty || "",
    course: user?.course || "",
    bio: user?.bio || "",
    role: user?.role || "student"
  };
}

async function getAuthenticatedUser(req) {
  const cookies = parseCookieHeader(req.headers.cookie);
  const authPayload = readAuthTokenPayload(cookies[AUTH_COOKIE_NAME]);

  if (!authPayload?.email) {
    return null;
  }

  if (!mongoReady) {
    const user = findDemoUser(authPayload.email);
    return user && user.isEmailVerified ? user : null;
  }

  const user = await User.findOne({ email: normalizeEmail(authPayload.email) });
  return user && user.isEmailVerified ? user : null;
}

function findDemoUser(email) {
  const normalizedEmail = normalizeEmail(email);
  return demoStore.users.find((user) => user.email === normalizedEmail) || null;
}

function findDemoPendingRegistration(email) {
  const normalizedEmail = normalizeEmail(email);
  return demoStore.pendingRegistrations.find((user) => user.email === normalizedEmail) || null;
}

function sortByCreatedDesc(items) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.createdAt || 0).getTime();
    const rightTime = new Date(right.createdAt || 0).getTime();
    return rightTime - leftTime;
  });
}

function sortByCreatedAsc(items) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.createdAt || 0).getTime();
    const rightTime = new Date(right.createdAt || 0).getTime();
    return leftTime - rightTime;
  });
}

async function seedDemoFallbackData() {
  if (demoStore.events.length === 0) {
    const now = new Date().toISOString();
    demoStore.events.push(
      {
        id: createDemoId(),
        title: "Ярмарка студенческих клубов",
        description: "Познакомься с клубами, сообществами и инициативами КазНУ.",
        date: "22 марта • 14:00",
        place: "Главный корпус",
        faculty: "Все факультеты",
        tags: ["Клубы", "Студенты", "Нетворкинг"],
        createdAt: now,
        updatedAt: now
      },
      {
        id: createDemoId(),
        title: "Workshop по публичным выступлениям",
        description: "Практическая сессия по ораторскому мастерству и уверенной подаче.",
        date: "24 марта • 15:30",
        place: "Конференц-зал",
        faculty: "Все факультеты",
        tags: ["Навыки", "Выступления"],
        createdAt: now,
        updatedAt: now
      },
      {
        id: createDemoId(),
        title: "Встреча по студенческим стартапам",
        description: "Обсуждение идей приложений, MVP и первых шагов в запуске проекта.",
        date: "27 марта • 17:00",
        place: "Coworking zone",
        faculty: "IT / CS",
        tags: ["Стартап", "AI", "Разработка"],
        createdAt: now,
        updatedAt: now
      }
    );
  }

  if (demoStore.announcements.length === 0) {
    const now = new Date().toISOString();
    demoStore.announcements.push(
      {
        id: createDemoId(),
        title: "Открыта регистрация на день карьеры",
        text: "Студенты могут зарегистрироваться до пятницы. Участие бесплатное.",
        meta: "Карьера • Сегодня",
        createdAt: now,
        updatedAt: now
      },
      {
        id: createDemoId(),
        title: "Лекция по международному праву",
        text: "Приглашённый эксперт выступит в актовом зале в 16:00.",
        meta: "ФМО • Завтра",
        createdAt: now,
        updatedAt: now
      },
      {
        id: createDemoId(),
        title: "Приём заявок в студенческие клубы",
        text: "Открыт набор в студенческие объединения и клубы кампуса.",
        meta: "Студсовет • Эта неделя",
        createdAt: now,
        updatedAt: now
      }
    );
  }

  if (demoStore.users.length === 0) {
    const now = new Date().toISOString();
    demoStore.users.push(
      {
        id: createDemoId(),
        firstName: "Baiken",
        lastName: "Turlybek",
        displayName: "Farabi Admin",
        bio: "Куратор платформы и администратор демо-режима.",
        email: "turlybek_baiken@live.kaznu.kz",
        password: await hashPlaintextPassword("admin123"),
        faculty: "Факультет информационных технологий",
        specialty: "Программная инженерия",
        course: 4,
        isEmailVerified: true,
        verificationCode: null,
        verificationExpires: null,
        role: "admin",
        lastSeen: new Date(),
        createdAt: now,
        updatedAt: now
      },
      {
        id: createDemoId(),
        firstName: "Alikhan",
        lastName: "Serik",
        displayName: "Алихан",
        bio: "Студент, который тестирует новые комнаты и события.",
        email: "serik_alikhan@live.kaznu.kz",
        password: await hashPlaintextPassword("student123"),
        faculty: "Международные отношения (ФМО)",
        specialty: "Международные отношения",
        course: 2,
        isEmailVerified: true,
        verificationCode: null,
        verificationExpires: null,
        role: "student",
        lastSeen: new Date(),
        createdAt: now,
        updatedAt: now
      }
    );
  }
}

await seedDemoFallbackData();

async function seedDemoData() {
  try {
    const eventsCount = await Event.countDocuments();
    if (eventsCount === 0) {
      await Event.insertMany([
        {
          title: "Ярмарка студенческих клубов",
          description: "Познакомься с клубами, сообществами и инициативами КазНУ.",
          date: "22 марта • 14:00",
          place: "Главный корпус",
          faculty: "Все факультеты",
          tags: ["Клубы", "Студенты", "Нетворкинг"],
        },
        {
          title: "Workshop по публичным выступлениям",
          description:
            "Практическая сессия по ораторскому мастерству и уверенной подаче.",
          date: "24 марта • 15:30",
          place: "Конференц-зал",
          faculty: "Все факультеты",
          tags: ["Навыки", "Выступления"],
        },
        {
          title: "Встреча по студенческим стартапам",
          description:
            "Обсуждение идей приложений, MVP и первых шагов в запуске проекта.",
          date: "27 марта • 17:00",
          place: "Coworking zone",
          faculty: "IT / CS",
          tags: ["Стартап", "AI", "Разработка"],
        },
      ]);
      console.log("Демо-мероприятия добавлены");
    }

    const announcementsCount = await Announcement.countDocuments();
    if (announcementsCount === 0) {
      await Announcement.insertMany([
        {
          title: "Открыта регистрация на день карьеры",
          text: "Студенты могут зарегистрироваться до пятницы. Участие бесплатное.",
          meta: "Карьера • Сегодня",
        },
        {
          title: "Лекция по международному праву",
          text: "Приглашённый эксперт выступит в актовом зале в 16:00.",
          meta: "ФМО • Завтра",
        },
        {
          title: "Приём заявок в студенческие клубы",
          text: "Открыт набор в студенческие объединения и клубы кампуса.",
          meta: "Студсовет • Эта неделя",
        },
      ]);
      console.log("Демо-объявления добавлены");
    }
  } catch (err) {
    console.error("Ошибка seed demo data:", err.message);
  }
}

app.post("/api/register", async (req, res) => {
  try {
    const { nickname, email, password, faculty, specialty, course } = req.body;

    const requiredFields = { nickname, email, password, faculty, specialty, course };
    for (const [field, value] of Object.entries(requiredFields)) {
      const validation = validateRequiredField(value, field);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
    }

    let validation = validateNickname(nickname);
    if (!validation.valid) return res.status(400).json({ error: validation.error });

    const normalizedEmail = normalizeEmail(email);
    validation = validateKaznuEmail(normalizedEmail);
    if (!validation.valid) return res.status(400).json({ error: validation.error });

    const { autoFirstName, autoLastName } = parseNameFromKaznuEmail(normalizedEmail);

    validation = validateName(autoFirstName);
    if (!validation.valid) return res.status(400).json({ error: "Не удалось определить имя из почты" });

    validation = validateName(autoLastName);
    if (!validation.valid) return res.status(400).json({ error: "Не удалось определить фамилию из почты" });

    validation = validatePassword(password);
    if (!validation.valid) return res.status(400).json({ error: validation.error });

    if (!FACULTIES[faculty]) {
      return res.status(400).json({ error: "Неверный факультет" });
    }

    if (!FACULTIES[faculty].includes(specialty)) {
      return res.status(400).json({ error: "Специальность не относится к выбранному факультету" });
    }

    validation = validateCourse(course);
    if (!validation.valid) return res.status(400).json({ error: validation.error });

    const numericCourse = Number(course);

    if (!mongoReady) {
      const existingUser = findDemoUser(normalizedEmail);

      if (existingUser?.isEmailVerified) {
        return res.status(400).json({ error: "Пользователь с такой почтой уже существует" });
      }

      const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
      const role = normalizedEmail === "turlybek_baiken@live.kaznu.kz" ? "admin" : "student";
      const hashedPassword = await hashPlaintextPassword(password);
      const pendingRegistration = findDemoPendingRegistration(normalizedEmail);
      const pendingPayload = {
        id: pendingRegistration?.id || createDemoId(),
        firstName: autoFirstName,
        lastName: autoLastName,
        displayName: nickname.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        faculty: faculty.trim(),
        specialty: specialty.trim(),
        course: numericCourse,
        verificationCode,
        verificationExpires: new Date(Date.now() + 10 * 60 * 1000),
        role,
        createdAt: pendingRegistration?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (pendingRegistration) {
        Object.assign(pendingRegistration, pendingPayload);
      } else {
        demoStore.pendingRegistrations.push(pendingPayload);
      }

      console.log("Код подтверждения для", normalizedEmail, ":", verificationCode);
      await sendVerificationEmail(normalizedEmail, verificationCode);

      return res.status(201).json({
        message: "Код подтверждения отправлен. Аккаунт будет создан после подтверждения почты.",
        needsVerification: true,
        email: normalizedEmail
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser?.isEmailVerified) {
      return res.status(400).json({ error: "Пользователь с такой почтой уже существует" });
    }

    if (existingUser && !existingUser.isEmailVerified) {
      await User.deleteOne({ _id: existingUser._id });
    }

    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
    const role = normalizedEmail === "turlybek_baiken@live.kaznu.kz" ? "admin" : "student";

    const pendingRegistration = await PendingRegistration.findOne({ email: normalizedEmail });

    if (pendingRegistration) {
      pendingRegistration.firstName = autoFirstName;
      pendingRegistration.lastName = autoLastName;
      pendingRegistration.displayName = nickname.trim();
      pendingRegistration.password = password.trim();
      pendingRegistration.faculty = faculty.trim();
      pendingRegistration.specialty = specialty.trim();
      pendingRegistration.course = numericCourse;
      pendingRegistration.verificationCode = verificationCode;
      pendingRegistration.verificationExpires = new Date(Date.now() + 10 * 60 * 1000);
      pendingRegistration.role = role;
      await pendingRegistration.save();
    } else {
      await PendingRegistration.create({
        firstName: autoFirstName,
        lastName: autoLastName,
        displayName: nickname.trim(),
        email: normalizedEmail,
        password: password.trim(),
        faculty: faculty.trim(),
        specialty: specialty.trim(),
        course: numericCourse,
        verificationCode,
        verificationExpires: new Date(Date.now() + 10 * 60 * 1000),
        role
      });
    }

    console.log("Код подтверждения для", normalizedEmail, ":", verificationCode);
    await sendVerificationEmail(normalizedEmail, verificationCode);

    res.status(201).json({
      message: "Код подтверждения отправлен. Аккаунт будет создан после подтверждения почты.",
      needsVerification: true,
      email: normalizedEmail
    });
  } catch (err) {
    console.error("Ошибка /api/register:", err.message);
    res.status(500).json({ error: "Ошибка регистрации" });
  }
});

app.post("/api/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;

    const validation = validateRequiredField(email, "Email");
    if (!validation.valid) return res.status(400).json({ error: validation.error });

    const normalizedEmail = normalizeEmail(email);

    if (!mongoReady) {
      const existingUser = findDemoUser(normalizedEmail);

      if (existingUser?.isEmailVerified) {
        return res.json({ message: "Почта уже подтверждена" });
      }

      const pendingRegistration = findDemoPendingRegistration(normalizedEmail);

      if (!pendingRegistration) {
        return res.status(404).json({ error: "Заявка на регистрацию не найдена" });
      }

      if (!pendingRegistration.verificationCode || !pendingRegistration.verificationExpires) {
        return res.status(400).json({ error: "Код подтверждения не найден" });
      }
      if (new Date() > new Date(pendingRegistration.verificationExpires)) {
        return res.status(400).json({ error: "Код истёк" });
      }
      if (String(pendingRegistration.verificationCode).trim() !== String(code).trim()) {
        return res.status(400).json({ error: "Неверный код" });
      }

      demoStore.users = demoStore.users.filter((user) => user.email !== normalizedEmail);
      demoStore.users.push({
        id: createDemoId(),
        firstName: pendingRegistration.firstName,
        lastName: pendingRegistration.lastName,
        displayName: pendingRegistration.displayName || "",
        bio: "",
        email: pendingRegistration.email,
        password: pendingRegistration.password,
        faculty: pendingRegistration.faculty,
        specialty: pendingRegistration.specialty,
        course: pendingRegistration.course,
        isEmailVerified: true,
        verificationCode: null,
        verificationExpires: null,
        role: pendingRegistration.role,
        lastSeen: new Date(),
        createdAt: pendingRegistration.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      demoStore.pendingRegistrations = demoStore.pendingRegistrations.filter((user) => user.email !== normalizedEmail);

      return res.json({ message: "Почта успешно подтверждена" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser?.isEmailVerified) {
      return res.json({ message: "Почта уже подтверждена" });
    }

    const pendingRegistration = await PendingRegistration.findOne({ email: normalizedEmail });

    if (!pendingRegistration && !existingUser) {
      return res.status(404).json({ error: "Заявка на регистрацию не найдена" });
    }

    if (!pendingRegistration && existingUser && !existingUser.isEmailVerified) {
      if (!existingUser.verificationCode || !existingUser.verificationExpires) {
        return res.status(400).json({ error: "Код подтверждения не найден" });
      }
      if (new Date() > existingUser.verificationExpires) {
        return res.status(400).json({ error: "Код истёк" });
      }
      if (String(existingUser.verificationCode).trim() !== String(code).trim()) {
        return res.status(400).json({ error: "Неверный код" });
      }

      existingUser.isEmailVerified = true;
      existingUser.verificationCode = null;
      existingUser.verificationExpires = null;
      await existingUser.save();

      return res.json({ message: "Почта успешно подтверждена" });
    }

    if (!pendingRegistration.verificationCode || !pendingRegistration.verificationExpires) {
      return res.status(400).json({ error: "Код подтверждения не найден" });
    }
    if (new Date() > pendingRegistration.verificationExpires) {
      return res.status(400).json({ error: "Код истёк" });
    }
    if (String(pendingRegistration.verificationCode).trim() !== String(code).trim()) {
      return res.status(400).json({ error: "Неверный код" });
    }

    const user = new User({
      firstName: pendingRegistration.firstName,
      lastName: pendingRegistration.lastName,
      displayName: pendingRegistration.displayName || "",
      email: pendingRegistration.email,
      password: pendingRegistration.password,
      faculty: pendingRegistration.faculty,
      specialty: pendingRegistration.specialty,
      course: pendingRegistration.course,
      isEmailVerified: true,
      role: pendingRegistration.role,
      verificationCode: null,
      verificationExpires: null,
    });

    await user.save();
    await PendingRegistration.deleteOne({ _id: pendingRegistration._id });

    res.json({ message: "Почта успешно подтверждена" });
  } catch (err) {
    console.error("Ошибка /api/verify-email:", err);
    res.status(500).json({ error: "Ошибка подтверждения почты" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    let validation = validateRequiredField(email, "Email");
    if (!validation.valid) return res.status(400).json({ error: validation.error });

    validation = validateRequiredField(password, "Password");
    if (!validation.valid) return res.status(400).json({ error: validation.error });

    const normalizedEmail = normalizeEmail(email);

    if (!mongoReady) {
      const user = findDemoUser(normalizedEmail);

      if (!user) return res.status(404).json({ error: "Пользователь не найден" });
      if (!user.isEmailVerified) return res.status(403).json({ error: "Сначала подтверди почту" });

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) return res.status(400).json({ error: "Неверный пароль" });

      user.lastSeen = new Date();
      user.updatedAt = new Date().toISOString();
      setAuthCookie(res, user);

      return res.json({
        message: "Вход выполнен",
        user: formatUserResponse(user)
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) return res.status(404).json({ error: "Пользователь не найден" });
    if (!user.isEmailVerified) return res.status(403).json({ error: "Сначала подтверди почту" });

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return res.status(400).json({ error: "Неверный пароль" });

    user.lastSeen = new Date();
    await user.save();
    setAuthCookie(res, user);

    res.json({
      message: "Вход выполнен",
      user: formatUserResponse(user)
    });
  } catch (err) {
    console.error("Ошибка /api/login:", err);
    res.status(500).json({ error: "Ошибка входа" });
  }
});

app.post("/api/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Выход выполнен" });
});

app.delete("/api/messages/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const admin = await getAuthenticatedUser(req);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Доступ запрещён" });
    }

    if (!mongoReady) {
      demoStore.messages = demoStore.messages.filter((message) => message.id !== id);
      return res.json({ message: "Сообщение удалено" });
    }

    await Message.findByIdAndDelete(id);

    res.json({ message: "Сообщение удалено" });
  } catch (err) {
    console.error("Ошибка удаления сообщения:", err);
    res.status(500).json({ error: "Не удалось удалить сообщение" });
  }
});

app.get("/api/faculties", (req, res) => {
  res.json(FACULTIES);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

app.get("/api/events", async (req, res) => {
  try {
    if (!mongoReady) {
      return res.json(sortByCreatedDesc(demoStore.events));
    }

    const events = await Event.find().sort({ createdAt: -1, _id: -1 });
    res.json(events);
  } catch (err) {
    console.error("Ошибка /api/events:", err.message);
    res.status(500).json({ error: "Не удалось загрузить мероприятия" });
  }
});

app.post("/api/admin/make-admin", async (req, res) => {
  try {
    const { targetEmail } = req.body;
    const admin = await getAuthenticatedUser(req);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Доступ запрещён" });
    }

    if (!mongoReady) {
      const targetUser = findDemoUser(targetEmail);

      if (!targetUser) {
        return res.status(404).json({ error: "Пользователь не найден" });
      }

      targetUser.role = "admin";
      targetUser.updatedAt = new Date().toISOString();

      return res.json({ message: "Админ успешно назначен" });
    }

    const targetUser = await User.findOne({
      email: String(targetEmail || "").trim().toLowerCase()
    });

    if (!targetUser) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    targetUser.role = "admin";
    await targetUser.save();

    res.json({ message: "Админ успешно назначен" });
  } catch (err) {
    console.error("Ошибка назначения админа:", err);
    res.status(500).json({ error: "Не удалось назначить админа" });
  }
});

app.post("/api/events", async (req, res) => {
  try {
    const { title, description, date, place, faculty, tags } = req.body;
    const admin = await getAuthenticatedUser(req);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Доступ запрещён" });
    }

    if (!mongoReady) {
      if (!title || !description || !date || !place) {
        return res
          .status(400)
          .json({ error: "Заполни title, description, date, place" });
      }

      const event = {
        id: createDemoId(),
        title: title.trim(),
        description: description.trim(),
        date: date.trim(),
        place: place.trim(),
        faculty: (faculty || "Все факультеты").trim(),
        tags: Array.isArray(tags)
          ? tags.map((tag) => String(tag).trim()).filter(Boolean)
          : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      demoStore.events.unshift(event);
      return res.status(201).json(event);
    }

    if (!title || !description || !date || !place) {
      return res
        .status(400)
        .json({ error: "Заполни title, description, date, place" });
    }

    const event = new Event({
      title: title.trim(),
      description: description.trim(),
      date: date.trim(),
      place: place.trim(),
      faculty: (faculty || "Все факультеты").trim(),
      tags: Array.isArray(tags)
        ? tags.map((tag) => String(tag).trim()).filter(Boolean)
        : [],
    });

    await event.save();
    res.status(201).json(event);
  } catch (err) {
    console.error("Ошибка POST /api/events:", err.message);
    res.status(500).json({ error: "Не удалось добавить мероприятие" });
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    if (!mongoReady) {
      return res.json({
        totalUsers: demoStore.users.filter((user) => user.isEmailVerified).length,
        onlineUsers: demoStore.users.filter((user) => user.isEmailVerified && new Date(user.lastSeen || 0) >= new Date(Date.now() - 5 * 60 * 1000)).length,
        totalEvents: demoStore.events.length,
        storageMode: "demo"
      });
    }

    const totalUsers = await User.countDocuments({ isEmailVerified: true });

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const onlineUsers = await User.countDocuments({
      isEmailVerified: true,
      lastSeen: { $gte: fiveMinutesAgo }
    });

    const totalEvents = await Event.countDocuments();

    res.json({
      totalUsers,
      onlineUsers,
      totalEvents,
      storageMode: "database"
    });
  } catch (err) {
    console.error("Ошибка /api/stats:", err);
    res.status(500).json({ error: "Не удалось загрузить статистику" });
  }
});

app.post("/api/presence", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return res.status(401).json({ error: "Требуется авторизация" });
    }

    if (!mongoReady) {
      user.lastSeen = new Date();
      user.updatedAt = new Date().toISOString();
      return res.json({ message: "Presence updated" });
    }

    user.lastSeen = new Date();
    await user.save();

    res.json({ message: "Presence updated" });
  } catch (err) {
    console.error("Ошибка /api/presence:", err);
    res.status(500).json({ error: "Не удалось обновить presence" });
  }
});

app.get("/api/announcements", async (req, res) => {
  try {
    if (!mongoReady) {
      return res.json(sortByCreatedDesc(demoStore.announcements));
    }

    const announcements = await Announcement.find().sort({
      createdAt: -1,
      _id: -1,
    });
    res.json(announcements);
  } catch (err) {
    console.error("Ошибка /api/announcements:", err.message);
    res.status(500).json({ error: "Не удалось загрузить объявления" });
  }
});

app.post("/api/announcements", async (req, res) => {
  try {
    const { title, text, meta } = req.body;
    const admin = await getAuthenticatedUser(req);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Доступ запрещён" });
    }

    if (!mongoReady) {
      if (!title || !text || !meta) {
        return res.status(400).json({ error: "Заполни title, text, meta" });
      }

      const announcement = {
        id: createDemoId(),
        title: title.trim(),
        text: text.trim(),
        meta: meta.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      demoStore.announcements.unshift(announcement);
      return res.status(201).json(announcement);
    }

    if (!title || !text || !meta) {
      return res.status(400).json({ error: "Заполни title, text, meta" });
    }

    const announcement = new Announcement({
      title: title.trim(),
      text: text.trim(),
      meta: meta.trim(),
    });

    await announcement.save();
    res.status(201).json(announcement);
  } catch (err) {
    console.error("Ошибка POST /api/announcements:", err.message);
    res.status(500).json({ error: "Не удалось добавить объявление" });
  }
});

io.on("connection", async (socket) => {
  console.log("Пользователь подключился:", socket.id);

  let currentRoom = "global";
  socket.join(currentRoom);

  try {
    if (mongoReady) {
      const messages = await Message.find({ room: currentRoom })
        .sort({ createdAt: 1, _id: 1 })
        .limit(100);

      socket.emit("chat history", messages);
    } else {
      socket.emit("chat history", sortByCreatedAsc(demoStore.messages.filter((message) => message.room === currentRoom)).slice(-100));
    }
  } catch (err) {
    console.error("Ошибка загрузки истории:", err.message);
    socket.emit("chat history", []);
  }

  socket.on("join room", async (room) => {
    const nextRoom =
      typeof room === "string" && room.trim() ? room.trim() : "global";

    socket.leave(currentRoom);
    currentRoom = nextRoom;
    socket.join(currentRoom);

    try {
      if (mongoReady) {
        const messages = await Message.find({ room: currentRoom })
          .sort({ createdAt: 1, _id: 1 })
          .limit(100);

        socket.emit("chat history", messages);
      } else {
        socket.emit("chat history", sortByCreatedAsc(demoStore.messages.filter((message) => message.room === currentRoom)).slice(-100));
      }
    } catch (err) {
      console.error("Ошибка загрузки комнаты:", err.message);
      socket.emit("chat history", []);
    }
  });

  socket.on("chat message", async (data) => {
    try {
      const username = String(data?.username || "").trim();
      const text = String(data?.text || "").trim();
      const room = String(data?.room || "global").trim() || "global";

      if (!username || !text) return;

      const messageData = {
        username,
        text,
        room,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      if (mongoReady) {
        const message = new Message(messageData);
        await message.save();
        io.to(room).emit("chat message", message.toObject());
      } else {
        const message = {
          id: createDemoId(),
          ...messageData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        demoStore.messages.push(message);
        io.to(room).emit("chat message", message);
      }
    } catch (err) {
      console.error("Ошибка сообщения:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("Пользователь отключился:", socket.id);
  });
});

app.put("/api/profile", async (req, res) => {
  try {
    const { displayName, bio } = req.body;
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return res.status(401).json({ error: "Требуется авторизация" });
    }

    let validation = validateNickname(displayName);
    if (!validation.valid) return res.status(400).json({ error: validation.error });

    if (!mongoReady) {
      user.displayName = String(displayName || "").trim();
      user.bio = String(bio || "").trim();
      user.updatedAt = new Date().toISOString();

      return res.json({
        message: "Профиль обновлён",
        user: formatUserResponse(user)
      });
    }

    user.displayName = String(displayName || "").trim();
    user.bio = String(bio || "").trim();

    await user.save();

    res.json({
      message: "Профиль обновлён",
      user: formatUserResponse(user)
    });
  } catch (err) {
    console.error("Ошибка /api/profile:", err);
    res.status(500).json({ error: "Ошибка обновления профиля" });
  }
});

app.post("/api/validate-user", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return res.status(401).json({ error: "Требуется авторизация" });
    }

    if (!mongoReady) {
      return res.json({
        message: "Пользователь валиден",
        valid: true,
        user: formatUserResponse(user)
      });
    }

    res.json({
      message: "Пользователь валиден",
      valid: true,
      user: formatUserResponse(user)
    });
  } catch (err) {
    console.error("Ошибка /api/validate-user:", err);
    res.status(500).json({ error: "Ошибка валидации" });
  }
});

// Error handling middleware (должна быть в конце)
app.use((err, req, res, next) => {
  console.error("❌ Ошибка обработчика:", err.message);
  res.status(err.status || 500).json({ error: err.message || "Внутренняя ошибка сервера" });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});