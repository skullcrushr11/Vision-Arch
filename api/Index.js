import express from 'express';
import cors from 'cors';
import fs from 'fs';

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

app.use(express.json());

app.post('/saveLayout', (req, res) => {
  const layoutData = req.body;

  fs.writeFile('furniture_layout.json', JSON.stringify(layoutData, null, 2), (err) => {
    if (err) {
      console.error('Error writing file:', err);
      res.status(500).send('Failed to save layout');
    } else {
      res.status(200).send('Layout saved successfully');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
