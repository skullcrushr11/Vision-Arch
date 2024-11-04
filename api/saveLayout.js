// api/saveLayout.js

import fs from 'fs';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const layoutData = req.body;

    fs.writeFile('furniture_layout.json', JSON.stringify(layoutData, null, 2), (err) => {
      if (err) {
        console.error('Error writing file:', err);
        res.status(500).json({ message: 'Failed to save layout' });
      } else {
        res.status(200).json({ message: 'Layout saved successfully' });
      }
    });
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
