import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set payload limits high to support embedded photos, signatures, etc.
  app.use(express.json({ limit: '15mb' }));

  const dbPath = path.join(process.cwd(), 'short_cards.json');
  let cardsDb: Record<string, any> = {};

  if (fs.existsSync(dbPath)) {
    try {
      cardsDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch (e) {
      console.error('Failed to load short cards database, starting fresh:', e);
    }
  }

  const saveDb = () => {
    try {
      fs.writeFileSync(dbPath, JSON.stringify(cardsDb, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write short cards to disk:', e);
    }
  };

  // POST endpoint to save the card configuration and return a clean shortId
  app.post('/api/shorten', (req, res) => {
    try {
      const cardData = req.body;
      if (!cardData) {
        return res.status(400).json({ error: 'Card data is required.' });
      }

      // Generate a unique 6-character short code
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let shortId = '';
      let isUnique = false;
      
      while (!isUnique) {
        shortId = '';
        for (let i = 0; i < 6; i++) {
          shortId += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        if (!cardsDb[shortId]) {
          isUnique = true;
        }
      }

      cardsDb[shortId] = cardData;
      saveDb();

      return res.json({ shortId });
    } catch (error) {
      console.error('Error shortening card:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // GET endpoint to fetch card data by shortId
  app.get('/api/card/:shortId', (req, res) => {
    try {
      const { shortId } = req.params;
      const cardData = cardsDb[shortId];
      if (!cardData) {
        return res.status(404).json({ error: 'Card not found.' });
      }
      return res.json(cardData);
    } catch (error) {
      console.error('Error retrieving card:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Serve Vite or build output
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
