import express from 'express';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

const app = express();
const PORT = 3000;
const dbPath = path.join(__dirname, 'transactions.db'); // Path to the SQLite database file

// Create database instance
const initializeDatabase = async () => {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Create transactions table
  await db.exec(`
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

  await db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
      userId INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT
    )
  `);

  return db;
};

initializeDatabase()
  .then(db => {
    console.log('Database is ready');
    // Middleware to parse JSON bodies
    app.use(express.json());

    // Add a transaction
    app.post('/transactions', async (req, res) => {
      const { amount, dateTime, description, senderId, receiverId } = req.body;
      try {
        const transactionId = await addTransaction(db, amount, dateTime, description, senderId, receiverId);
        res.json({ transactionId });
      } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    // Get all transactions
    app.get('/transactions', async (req, res) => {
      try {
        const transactions = await getAllTransactions(db);
        res.json(transactions);
      } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    // Get transactions for a specific user
    app.get('/transactions/:userId', async (req, res) => {
      const { userId } = req.params;
      try {
        const userTransactions = await getTransactionsForUser(db, parseInt(userId));
        res.json(userTransactions);
      } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Error initializing database:', error);
  });

// Function to add a transaction
async function addTransaction(db: any, amount: number, dateTime: string, description: string, senderId: number, receiverId: number): Promise<number> {
  const { lastID } = await db.run(
    `INSERT INTO Transactions (amount, dateTime, description, senderId, receiverId) VALUES (?, ?, ?, ?, ?)`,
    [amount, dateTime, description, senderId, receiverId]
  );
  return lastID;
}

// Function to get all transactions
async function getAllTransactions(db: any): Promise<any[]> {
  return await db.all(`SELECT * FROM Transactions`);
}

// Function to get transactions for a specific user
async function getTransactionsForUser(db: any, userId: number): Promise<any[]> {
  return await db.all(
    `SELECT * FROM Transactions WHERE senderId = ? OR receiverId = ?`,
    [userId, userId]
  );
}
