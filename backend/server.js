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
app.use(express.json());

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

// Function to calculate distance between two coordinates in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in kilometers
  return d;
}

// Function to check if a report is a valid crime (not service/administrative)
function isValidCrime(reportText, location) {
  const nonCrimeKeywords = [
    'service', 'no crime', 'administrative', 'disposition', 'closed',
    'unfounded', 'report writing', 'information', 'assist', 'welfare check',
    'civil', 'traffic stop', 'parking', 'noise complaint', 'animal'
  ];
  
  const crimeKeywords = [
    'theft', 'stolen', 'robbery', 'burglary', 'larceny', 'vandalism',
    'assault', 'battery', 'fraud', 'scam', 'break', 'breaking'
  ];
  
  const textLower = reportText.toLowerCase();
  const locationLower = location ? location.toLowerCase() : '';
  
  // Check if it contains non-crime keywords
  const hasNonCrime = nonCrimeKeywords.some(keyword => 
    textLower.includes(keyword) || locationLower.includes(keyword)
  );
  
  // Check if it contains crime keywords
  const hasCrime = crimeKeywords.some(keyword => 
    textLower.includes(keyword) || locationLower.includes(keyword)
  );
  
  // Return true only if it has crime keywords and no non-crime keywords
  return hasCrime && !hasNonCrime;
}

// Utility to extract scooter reports from PDF text
function extractScooterReports(text) {
  const reports = [];
  
  // More comprehensive regex patterns for e-scooter theft reports
  const patterns = [
    /(?:scooter|e-scooter|electric scooter)[\s\S]*?(?:theft|stolen|missing|taken)[\s\S]*?(?:location|address|street)[\s\S]*?$/gmi,
    /(?:theft|stolen|missing|taken)[\s\S]*?(?:scooter|e-scooter|electric scooter)[\s\S]*?(?:location|address|street)[\s\S]*?$/gmi,
    /incident[\s\S]*?(?:scooter|e-scooter)[\s\S]*?(?:theft|stolen)[\s\S]*?$/gmi
  ];

  // USC area coordinates for more realistic demo data (2318 Hoover Street area)
  const uscCenterCoord = { lat: 34.0224, lng: -118.2851 }; // USC center
  const maxDistanceKm = 3; // 3km radius around USC
  
  const uscAreaCoordinates = [
    { lat: 34.0224, lng: -118.2851, area: "USC Campus" },
    { lat: 34.0251, lng: -118.2851, area: "USC Village" },
    { lat: 34.0199, lng: -118.2899, area: "USC Vicinity" },
    { lat: 34.0189, lng: -118.2820, area: "Exposition Park" },
    { lat: 34.0240, lng: -118.2790, area: "Downtown USC" },
    { lat: 34.0210, lng: -118.2870, area: "USC Area" },
    { lat: 34.0260, lng: -118.2830, area: "USC North" },
    { lat: 34.0180, lng: -118.2880, area: "USC South" },
    { lat: 34.0230, lng: -118.2810, area: "USC East" },
    { lat: 34.0200, lng: -118.2920, area: "USC West" },
    { lat: 34.0245, lng: -118.2865, area: "USC Central" },
    { lat: 34.0215, lng: -118.2845, area: "USC Perimeter" },
    { lat: 34.0235, lng: -118.2875, area: "USC Neighborhood" },
    { lat: 34.0205, lng: -118.2835, area: "USC District" },
    { lat: 34.0255, lng: -118.2855, area: "USC Zone" }
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const reportText = match[0];
      
      // Extract location information
      const locationMatch = /(?:location|address|street)[\s:]*([^\n\r.]+)/i.exec(reportText);
      const location = locationMatch ? locationMatch[1].trim() : null;
      
      // Only include if it's a valid crime and contains scooter reference
      if (location && reportText.toLowerCase().includes('scooter') && isValidCrime(reportText, location)) {
        // Assign random USC area coordinates for demo purposes
        const randomCoord = uscAreaCoordinates[Math.floor(Math.random() * uscAreaCoordinates.length)];
        const finalLat = randomCoord.lat + (Math.random() - 0.5) * 0.01;
        const finalLng = randomCoord.lng + (Math.random() - 0.5) * 0.01;
        
        // Check if the coordinates are within USC area perimeter
        const distanceFromUSC = calculateDistance(uscCenterCoord.lat, uscCenterCoord.lng, finalLat, finalLng);
        
        if (distanceFromUSC <= maxDistanceKm) {
          reports.push({
            raw: reportText,
            location: location,
            latitude: finalLat,
            longitude: finalLng,
            title: "E-Scooter Theft Reported",
            description: reportText.substring(0, 100) + "...",
            processed: false
          });
        }
      }
    }
  });

  // If no reports found, create sample data for demo
  if (reports.length === 0) {
    const sampleReports = [
      {
        raw: "E-scooter theft reported at USC Village. Black scooter taken from bike rack.",
        location: "USC Village",
        latitude: 34.0251,
        longitude: -118.2851,
        title: "E-Scooter Theft Reported",
        description: "Black scooter taken from bike rack",
        processed: false
      },
      {
        raw: "Electric scooter stolen from Exposition Park area. Victim reported scooter missing from parking area.",
        location: "Exposition Park",
        latitude: 34.0189,
        longitude: -118.2820,
        title: "Electric Scooter Stolen",
        description: "Scooter missing from parking area",
        processed: false
      },
      {
        raw: "Attempted theft of e-scooter near USC Campus. Suspect fled when confronted.",
        location: "USC Campus",
        latitude: 34.0224,
        longitude: -118.2851,
        title: "Attempted E-Scooter Theft",
        description: "Suspect fled when confronted",
        processed: false
      }
    ];
    
    // Generate additional sample reports to reach 15 total
    const additionalLocations = [
      { name: "USC North", lat: 34.0260, lng: -118.2830 },
      { name: "USC South", lat: 34.0180, lng: -118.2880 },
      { name: "USC East", lat: 34.0230, lng: -118.2810 },
      { name: "USC West", lat: 34.0200, lng: -118.2920 },
      { name: "USC Central", lat: 34.0245, lng: -118.2865 },
      { name: "USC Perimeter", lat: 34.0215, lng: -118.2845 },
      { name: "USC Neighborhood", lat: 34.0235, lng: -118.2875 },
      { name: "USC District", lat: 34.0205, lng: -118.2835 },
      { name: "USC Zone", lat: 34.0255, lng: -118.2855 },
      { name: "Downtown USC", lat: 34.0240, lng: -118.2790 },
      { name: "USC Area", lat: 34.0210, lng: -118.2870 },
      { name: "USC Vicinity", lat: 34.0199, lng: -118.2899 }
    ];
    
    additionalLocations.forEach((loc, index) => {
      sampleReports.push({
        raw: `E-scooter theft incident reported at ${loc.name}. Scooter was secured but lock was cut.`,
        location: loc.name,
        latitude: loc.lat + (Math.random() - 0.5) * 0.002, // Small random offset
        longitude: loc.lng + (Math.random() - 0.5) * 0.002,
        title: "E-Scooter Theft Reported",
        description: `Theft incident at ${loc.name}`,
        processed: false
      });
    });
    
    reports.push(...sampleReports);
  }

  return reports;
}

// Test endpoint to verify server is working
app.get('/api/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ message: 'Server is working', timestamp: new Date().toISOString() });
});

// Endpoint to get scooter reports from a PDF file and save to MongoDB
app.get('/api/scooter-reports', async (req, res) => {
  console.log('GET /api/scooter-reports endpoint called');
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

    // Return filtered reports from database (only valid crimes within USC area)
    const allReports = await ScooterReport.find({}).lean();
    console.log(`Found ${allReports.length} total reports in database`);
    
    const uscCenterCoord = { lat: 34.0224, lng: -118.2851 }; // USC center
    const maxDistanceKm = 3; // 3km radius around USC
    
    const filteredReports = allReports.filter(report => {
      // Check if it's within USC area
      const distanceFromUSC = calculateDistance(
        uscCenterCoord.lat, 
        uscCenterCoord.lng, 
        report.latitude, 
        report.longitude
      );
      
      // Check if it's a valid crime
      const isValidCrimeReport = isValidCrime(report.raw || '', report.location || '');
      
      console.log(`Report: location="${report.location}", distance=${distanceFromUSC.toFixed(2)}km, isValidCrime=${isValidCrimeReport}`);
      
      return distanceFromUSC <= maxDistanceKm && isValidCrimeReport;
    });
    
    console.log(`Filtered ${allReports.length} reports to ${filteredReports.length} valid crimes in USC area`);
    res.json({ reports: filteredReports });
    
  } catch (err) {
    console.error('Error processing reports:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to clear all reports (for testing)
app.delete('/api/scooter-reports', express.json(), async (req, res) => {
  try {
    await ScooterReport.deleteMany({});
    res.json({ message: 'All reports cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Alternative endpoint to clear all reports (for testing)
app.get('/api/clear-reports', async (req, res) => {
  try {
    await ScooterReport.deleteMany({});
    res.json({ message: 'All reports cleared' });
  } catch (err) {
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
      model: "gpt-4o-mini"
    });

    res.json({ suggestions: completion.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// New endpoint to analyze route safety and suggest better parking spots
app.post('/api/analyze-route', express.json(), async (req, res) => {
  try {
    const { startLat, startLng, endLat, endLng, destinationName } = req.body;
    
    if (!startLat || !startLng || !endLat || !endLng) {
      return res.status(400).json({ error: 'Start and end coordinates required' });
    }

    // Get all theft reports from database
    const reports = await ScooterReport.find({}).lean();
    
    // Calculate distance from destination to each theft report
    const nearbyThefts = reports.filter(report => {
      const distance = calculateDistance(endLat, endLng, report.latitude, report.longitude);
      return distance <= 0.5; // Within 0.5km of destination
    });

    // Generate safe parking alternatives near the destination
    const safeAlternatives = generateSafeAlternatives(endLat, endLng, reports);

    // Use GPT-4o-mini to analyze the route and provide recommendations
    const analysisPrompt = `
    Analyze this scooter route for safety:
    - Destination: ${destinationName || 'Unknown location'} (${endLat}, ${endLng})
    - Nearby theft reports: ${nearbyThefts.length} incidents within 500m
    - Theft details: ${nearbyThefts.map(t => t.description).join('; ')}
    
    Provide a VERY SHORT response with:
    1. **Safety Assessment:** Safe/Moderate Risk/High Risk
    2. **Brief Explanation:** One sentence only (max 25 words) explaining why it's safe/unsafe
    3. **Specific Parking Recommendations:** One short tip (max 15 words)
    
    Keep it simple and easy to read on mobile. Use bullet points.
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: analysisPrompt }],
      model: "gpt-4o-mini"
    });

    const analysis = completion.choices[0].message.content;

    res.json({
      safetyLevel: determineSafetyLevel(nearbyThefts.length),
      nearbyThefts: nearbyThefts.length,
      analysis: analysis,
      safeAlternatives: safeAlternatives,
      theftReports: nearbyThefts
    });

  } catch (err) {
    console.error('Route analysis error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper function to determine safety level based on nearby thefts
function determineSafetyLevel(theftCount) {
  if (theftCount === 0) return 'Safe';
  if (theftCount <= 2) return 'Moderate Risk';
  return 'High Risk';
}

// Helper function to generate safe parking alternatives
function generateSafeAlternatives(destLat, destLng, allReports) {
  const alternatives = [];
  const searchRadius = 0.3; // 300m radius
  const gridSize = 0.002; // ~200m grid spacing
  
  // Generate potential parking spots in a grid around destination
  for (let latOffset = -searchRadius; latOffset <= searchRadius; latOffset += gridSize) {
    for (let lngOffset = -searchRadius; lngOffset <= searchRadius; lngOffset += gridSize) {
      const candidateLat = destLat + latOffset;
      const candidateLng = destLng + lngOffset;
      
      // Skip if too close to destination (user probably wants to park there)
      const distToDestination = calculateDistance(destLat, destLng, candidateLat, candidateLng);
      if (distToDestination < 0.1) continue;
      
      // Count nearby thefts for this candidate location
      const nearbyThefts = allReports.filter(report => {
        const distance = calculateDistance(candidateLat, candidateLng, report.latitude, report.longitude);
        return distance <= 0.2; // Within 200m
      }).length;
      
      // Only suggest locations with fewer thefts
      if (nearbyThefts <= 1) {
        alternatives.push({
          latitude: candidateLat,
          longitude: candidateLng,
          theftCount: nearbyThefts,
          distanceFromDestination: distToDestination,
          safetyScore: Math.max(0, 10 - nearbyThefts * 3), // Simple scoring
          name: `Safe Parking ${alternatives.length + 1}`
        });
      }
    }
  }
  
  // Sort by safety score and distance, return top 5
  return alternatives
    .sort((a, b) => b.safetyScore - a.safetyScore || a.distanceFromDestination - b.distanceFromDestination)
    .slice(0, 5);
}

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

