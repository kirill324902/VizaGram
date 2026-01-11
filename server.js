"use strict";

const path = require("path");
const crypto = require("crypto");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

/* ================== CONFIG ================== */
const PORT = process.env.PORT || 10000;
const MONGODB_URI = process.env.MONGODB_URI;

// admin
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || "admin").toLowerCase();
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";

/* ================== MONGO ================== */
const StateSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    updatedAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

const AppState = mongoose.model("AppState", StateSchema);

async function loadDB() {
  const doc = await AppState.findOne({ key: "main" }).lean();
  const db = doc?.data || { profiles: {}, chats: [] };
  if (!db.profiles) db.profiles = {};
  if (!Array.isArray(db.chats)) db.chats = [];
  return db;
}

async function saveDB(db) {
  await AppState.updateOne(
    { key: "main" },
    { $set: { data: db, updatedAt: new Date() } },
    { upsert: true }
  );
}

let saveTimer = null;
function saveDBDebounced(db) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveDB(db), 300);
}

/* ================== HELPERS ================== */
function nowISO() { return new Date().toISOString(); }
function genId() { return Math.random().toString(16).slice(2) + Date.now().toString(16); }

function normalizeUsername(u) {
  return String(u || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
}

/* ===== PASSWORDS ===== */
function makeSalt() {
  return crypto.randomBytes(16).toString("hex");
}

function hashPassword(password, salt, iterations = 150000) {
  const key = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256");
  return { hash: key.toString("hex"), iterations };
}

function verifyPassword(password, salt, hash, iterations) {
  const { hash: h } = hashPassword(password, salt, iterations);
  return crypto.timingSafeEqual(Buffer.from(h, "hex"), Buffer.from(hash, "hex"));
}

/* ===== ADMIN HASH ===== */
function hashAdminPassword(password) {
  const salt = "ADMIN_STATIC_SALT_2026";
  const key = crypto.pbkdf2Sync(String(password), salt, 150000, 32, "sha256");
  return key.toString("hex");
}

function verifyAdminPassword(inputPassword) {
  if (!ADMIN_PASSWORD_HASH) return false;
  const inputHash = hashAdminPassword(inputPassword);
  return crypto.timingSafeEqual(
    Buffer.from(inputHash, "hex"),
    Buffer.from(ADMIN_PASSWORD_HASH, "hex")
  );
}

/* ================== EXPRESS ================== */
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ================== SOCKET ================== */
let db = { profiles: {}, chats: [] };
const sessions = new Map();

io.on("connection", (socket) => {
  let me = null;

  // ===== REGISTER =====
  socket.on("auth:register", (p, cb) => {
    const done = typeof cb === "function" ? cb : null;

    const username = normalizeUsername(p?.username);
    const password = String(p?.password || "");
    const password2 = String(p?.password2 || "");
    const adminPass = String(p?.adminPass || "");

    if (!username || !password || password !== password2)
      return done?.({ ok: false, error: "Ошибка данных" });

    if (db.profiles[username])
      return done?.({ ok: false, error: "Username занят" });

    if (username === ADMIN_USERNAME && !verifyAdminPassword(adminPass))
      return done?.({ ok: false, error: "Неверный админ пароль" });

    const salt = makeSalt();
    const { hash, iterations } = hashPassword(password, salt);

    db.profiles[username] = {
      username,
      passSalt: salt,
      passHash: hash,
      passIter: iterations,
      createdAt: nowISO()
    };

    saveDBDebounced(db);
    done?.({ ok: true });
  });

  // ===== LOGIN =====
  socket.on("auth:login", (p, cb) => {
    const done = typeof cb === "function" ? cb : null;

    const username = normalizeUsername(p?.username);
    const password = String(p?.password || "");
    const adminPass = String(p?.adminPass || "");

    const prof = db.profiles[username];
    if (!prof) return done?.({ ok: false, error: "Аккаунт не найден" });

    if (!verifyPassword(password, prof.passSalt, prof.passHash, prof.passIter))
      return done?.({ ok: false, error: "Неверный пароль" });

    if (username === ADMIN_USERNAME && !verifyAdminPassword(adminPass))
      return done?.({ ok: false, error: "Неверный админ пароль" });

    me = username;
    const token = genId();
    sessions.set(token, me);

    done?.({ ok: true, token, isAdmin: me === ADMIN_USERNAME });
  });

  socket.on("disconnect", () => {
    if (me) me = null;
  });
});

/* ================== START ================== */
async function start() {
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not set");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("✅ MongoDB connected");

  db = await loadDB();
  await saveDB(db);

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}

start().catch(err => {
  console.error("❌ Startup error:", err);
  process.exit(1);
});
