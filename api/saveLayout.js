import fs from 'fs';
import path from 'path';

export default async (req, res) => {
  if (req.method === 'POST') {
    const layoutData = req.body;

    // Save data to a file (relative to the root directory)
    const filePath = path.join(process.cwd(), 'furniture_layout.json');

    try {
      fs.writeFileSync(filePath, JSON.stringify(layoutData, null, 2));
      res.status(200).json({ message: 'Layout saved successfully' });
    } catch (err) {
      console.error('Error writing file:', err);
      res.status(500).json({ message: 'Failed to save layout' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
};
