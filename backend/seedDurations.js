require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Lecture = require('./models/Lecture');

const fetchDriveVideoDuration = async (videoUrl) => {
  try {
    if (!videoUrl || !process.env.GOOGLE_DRIVE_API_KEY) return null;
    
    // Extract ID
    let fileId = null;
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9_-]+)/, 
      /id=([a-zA-Z0-9_-]+)/,         
      /\/d\/([a-zA-Z0-9_-]+)/        
    ];
    for (const pattern of patterns) {
      const match = videoUrl.match(pattern);
      if (match && match[1]) {
        fileId = match[1];
        break;
      }
    }
    
    if (!fileId) return null;

    const res = await axios.get(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=videoMediaMetadata&key=${process.env.GOOGLE_DRIVE_API_KEY}`);
    
    if (res.data && res.data.videoMediaMetadata && res.data.videoMediaMetadata.durationMillis) {
      const totalSeconds = Math.floor(parseInt(res.data.videoMediaMetadata.durationMillis) / 1000);
      const m = Math.floor(totalSeconds / 60);
      const s = totalSeconds % 60;
      return `${m}m ${s}s`;
    }
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      console.error(`[Error] ${error.response.data.error.message}`);
    } else {
      console.error(`[Error]`, error.message);
    }
  }
  return null;
};

const updateAllDurations = async () => {
  if (!process.env.GOOGLE_DRIVE_API_KEY) {
    console.log("ERROR: GOOGLE_DRIVE_API_KEY is missing in backend/.env. Please add it first!");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const lectures = await Lecture.find({ type: 'video' });
    console.log(`Found ${lectures.length} video lectures. Updating durations...`);

    let updatedCount = 0;

    for (let i = 0; i < lectures.length; i++) {
      const lec = lectures[i];
      if (!lec.videoUrl) continue;

      process.stdout.write(`[${i+1}/${lectures.length}] Fetching duration for "${lec.title}"... `);
      const exactDuration = await fetchDriveVideoDuration(lec.videoUrl);
      
      if (exactDuration) {
        lec.duration = exactDuration;
        await lec.save();
        console.log(`Updated to ${exactDuration}`);
        updatedCount++;
      } else {
        console.log(`Failed to fetch.`);
      }

      // Small 500ms delay to avoid hitting Google API rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\nMigration Complete! Updated ${updatedCount} out of ${lectures.length} lectures.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration Error:", error);
    process.exit(1);
  }
};

updateAllDurations();
