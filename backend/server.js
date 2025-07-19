const express = require('express');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const cors = require('cors');
const mongoose = require('mongoose');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const ScooterReportSchema = new mongoose.Schema({
  raw: String,
  location: String,
  latitude: Number,
  longitude: Number,
  title: String,
  description: String,
  date: { type: Date, default: Date.now },
  processed: { type: Boolean, default: false }
});
const ScooterReport = mongoose.model('ScooterReport', ScooterReportSchema);

// Add this near your other schemas
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true }, // For production, hash this!
});
const User = mongoose.model('User', UserSchema);

const openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });

// Utility to extract scooter reports from PDF text
function extractScooterReports(text) {
  const reports = [];
  
  // More comprehensive regex patterns for e-scooter theft reports
  const patterns = [
    /(?:scooter|e-scooter|electric scooter)[\s\S]*?(?:theft|stolen|missing|taken)[\s\S]*?(?:location|address|street)[\s\S]*?$/gmi,
    /(?:theft|stolen|missing|taken)[\s\S]*?(?:scooter|e-scooter|electric scooter)[\s\S]*?(?:location|address|street)[\s\S]*?$/gmi,
    /incident[\s\S]*?(?:scooter|e-scooter)[\s\S]*?(?:theft|stolen)[\s\S]*?$/gmi
  ];

  // LA coordinates for different areas (sample locations)
  const laCoordinates = [
    { lat: 34.0522, lng: -118.2437, area: "Downtown LA" },
    { lat: 34.0928, lng: -118.3287, area: "Hollywood" },
    { lat: 34.0736, lng: -118.4004, area: "Santa Monica" },
    { lat: 34.1478, lng: -118.1445, area: "Pasadena" },
    { lat: 34.0195, lng: -118.4912, area: "Venice" },
    { lat: 34.1030, lng: -118.4107, area: "Beverly Hills" },
    { lat: 34.0259, lng: -118.7798, area: "Malibu" },
    { lat: 34.1684, lng: -118.6058, area: "Woodland Hills" }
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const reportText = match[0];
      
      // Extract location information
      const locationMatch = /(?:location|address|street)[\s:]*([^\n\r.]+)/i.exec(reportText);
      const location = locationMatch ? locationMatch[1].trim() : null;
      
      if (location && reportText.toLowerCase().includes('scooter')) {
        // Assign random LA coordinates for demo purposes
        const randomCoord = laCoordinates[Math.floor(Math.random() * laCoordinates.length)];
        
        reports.push({
          raw: reportText,
          location: location,
          latitude: randomCoord.lat + (Math.random() - 0.5) * 0.01, // Add small random offset
          longitude: randomCoord.lng + (Math.random() - 0.5) * 0.01,
          title: "E-Scooter Theft Reported",
          description: reportText.substring(0, 100) + "...",
          processed: false
        });
      }
    }
  });

  // If no reports found, create sample data for demo
  if (reports.length === 0) {
    const sampleReports = [
      {
        raw: "E-scooter theft reported at 123 Main St, Downtown LA. Black scooter taken from bike rack.",
        location: "123 Main St, Downtown LA",
        latitude: 34.0522,
        longitude: -118.2437,
        title: "E-Scooter Theft Reported",
        description: "Black scooter taken from bike rack",
        processed: false
      },
      {
        raw: "Electric scooter stolen from Hollywood Blvd. Victim reported scooter missing from parking area.",
        location: "Hollywood Blvd, Hollywood",
        latitude: 34.0928,
        longitude: -118.3287,
        title: "Electric Scooter Stolen",
        description: "Scooter missing from parking area",
        processed: false
      },
      {
        raw: "Attempted theft of e-scooter at Santa Monica Pier. Suspect fled when confronted.",
        location: "Santa Monica Pier",
        latitude: 34.0736,
        longitude: -118.4004,
        title: "Attempted E-Scooter Theft",
        description: "Suspect fled when confronted",
        processed: false
      }
    ];
    reports.push(...sampleReports);
  }

  return reports;
}

// Endpoint to get scooter reports from a PDF file and save to MongoDB
app.get('/api/scooter-reports', async (req, res) => {
  try {
    // Check if we already have processed reports in the database
    const existingReports = await ScooterReport.find({});
    
    if (existingReports.length === 0) {
      // Process PDF only if no reports exist (one-time initialization)
      const pdfPath = path.join(__dirname, 'pdfs', '60-Day-7-17.pdf');
      
      if (fs.existsSync(pdfPath)) {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdfParse(dataBuffer);
        const scooterReports = extractScooterReports(data.text);

        // Save new reports to MongoDB
        for (const report of scooterReports) {
          if (report.location) {
            await ScooterReport.updateOne(
              { raw: report.raw },
              { $setOnInsert: report },
              { upsert: true }
            );
          }
        }
        
        console.log(`Processed ${scooterReports.length} reports from PDF`);
      } else {
        // If no PDF, create sample data
        const sampleReports = extractScooterReports('');
        for (const report of sampleReports) {
          await ScooterReport.updateOne(
            { raw: report.raw },
            { $setOnInsert: report },
            { upsert: true }
          );
        }
        console.log('Created sample reports for demo');
      }
    }

    // Return all reports from database
    const allReports = await ScooterReport.find({}).lean();
    res.json({ reports: allReports });
    
  } catch (err) {
    console.error('Error processing reports:', err);
    res.status(500).json({ error: err.message });
  }
});


// Endpoint to get parking suggestions using OpenAI
app.get('/api/parking-suggestions', async (req, res) => {
  try {
    const reports = await ScooterReport.find({ location: { $ne: null } }).lean();
    const locations = reports.map(r => r.location).join(', ');

    const prompt = `Based on these locations where scooters have been reported stolen: ${locations}. Suggest safe places to park an e-scooter in the city and tips to avoid theft.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o"
    });

    res.json({ suggestions: completion.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', express.json(), async (req, res) => {
  // Login logic with user lookup and UserID return
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const user = await User.findOne({ username, password });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Return user ID for tracking
    res.json({ message: 'Login successful', userId: user._id });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Registration endpoint
app.post('/api/register', express.json(), async (req, res) => {
  const { username, phone, password } = req.body;
  if (!username || !phone || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }
  try {
    const user = new User({ username, phone, password });
    await user.save();
    res.json({ message: 'Registration successful' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

