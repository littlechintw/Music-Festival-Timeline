// Node script: validate and filter festival JSONs using Zod
const fs = require('fs');
const path = require('path');
const { festivalSchema } = require('../../src/pwa/schema');
const now = new Date();
const FESTIVALS_DIR = path.join(__dirname, '../../festivals');
const files = fs.readdirSync(FESTIVALS_DIR).filter(f => f.endsWith('.json'));
const filtered = [];
for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(FESTIVALS_DIR, file), 'utf-8'));
  try {
    festivalSchema.parse(data);
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    if (start >= now || end >= new Date(now.getTime() - 3 * 86400000)) {
      filtered.push(data);
    }
  } catch (e) {
    console.error(`Invalid: ${file}`, e.errors);
  }
}
fs.writeFileSync('filtered-festivals.json', JSON.stringify(filtered, null, 2));
