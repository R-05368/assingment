import express from 'express';
import { Connection, PublicKey } from '@solana/web3.js';

const app = express();
const port = process.env.PORT || 3000;

const connection = new Connection('https://api.mainnet-beta.solana.com');

// Serve a default favicon to avoid 404 errors
app.get('/favicon.ico', (req, res) => res.status(204));

// Define the endpoint with a dynamic parameter for the wallet address
app.get('/transactions/:address', async (req, res) => {
  try {
    const address = req.params.address;

    // Validate the address
    if (!PublicKey.isOnCurve(address)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    const pubKey = new PublicKey(address);
    let allTransactions = [];
    let before = undefined;
    let limit = 3; // Number of transactions per page

    while (true) {
      // Fetch recent transactions for the given address
      const transactions = await connection.getSignaturesForAddress(pubKey, {
        before, // pagination
        limit,
      });

      if (transactions.length === 0) {
        break;
      }

      // Fetch detailed transaction data
      const detailedTransactions = await Promise.all(transactions.map(tx => 
        connection.getParsedTransaction(tx.signature)
      ));

      // Add the detailed transactions to the result
      allTransactions = allTransactions.concat(detailedTransactions);

      // Check if there are more transactions to fetch
      before = transactions[transactions.length - 1].signature;
    }

    res.json(allTransactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'An error occurred while fetching transactions', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
