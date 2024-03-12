"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sqlite_1 = require("sqlite");
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const PORT = 3000;
const dbPath = path_1.default.join(__dirname, 'transactions.db'); // Path to the SQLite database file
// Create database instance
const initializeDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield (0, sqlite_1.open)({
        filename: dbPath,
        driver: sqlite3_1.default.Database
    });
    // Create transactions table
    yield db.exec(`
    CREATE TABLE IF NOT EXISTS Transactions (
      transactionId INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL,
      dateTime TEXT,
      description TEXT,
      senderId INTEGER,
      receiverId INTEGER,
      FOREIGN KEY (senderId) REFERENCES Users(userId),
      FOREIGN KEY (receiverId) REFERENCES Users(userId)
    )
  `);
    yield db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
      userId INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT
    )
  `);
    return db;
});
initializeDatabase()
    .then(db => {
    console.log('Database is ready');
    // Middleware to parse JSON bodies
    app.use(express_1.default.json());
    // Add a transaction
    app.post('/transactions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { amount, dateTime, description, senderId, receiverId } = req.body;
        try {
            const transactionId = yield addTransaction(db, amount, dateTime, description, senderId, receiverId);
            res.json({ transactionId });
        }
        catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }));
    // Get all transactions
    app.get('/transactions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const transactions = yield getAllTransactions(db);
            res.json(transactions);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }));
    // Get transactions for a specific user
    app.get('/transactions/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { userId } = req.params;
        try {
            const userTransactions = yield getTransactionsForUser(db, parseInt(userId));
            res.json(userTransactions);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }));
    // Start server
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
    .catch(error => {
    console.error('Error initializing database:', error);
});
// Function to add a transaction
function addTransaction(db, amount, dateTime, description, senderId, receiverId) {
    return __awaiter(this, void 0, void 0, function* () {
        const { lastID } = yield db.run(`INSERT INTO Transactions (amount, dateTime, description, senderId, receiverId) VALUES (?, ?, ?, ?, ?)`, [amount, dateTime, description, senderId, receiverId]);
        return lastID;
    });
}
// Function to get all transactions
function getAllTransactions(db) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield db.all(`SELECT * FROM Transactions`);
    });
}
// Function to get transactions for a specific user
function getTransactionsForUser(db, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield db.all(`SELECT * FROM Transactions WHERE senderId = ? OR receiverId = ?`, [userId, userId]);
    });
}
