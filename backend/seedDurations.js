require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Lecture = require('./models/Lecture');

const fetchYouTubeVideoDuration = async (videoUrl) => {
  try {
    if (!videoUrl || !process.env.GOOGLE_DRIVE_API_KEY) return null;
    
    // Extract YouTube ID
    let videoId = null;
    const patterns = [
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
    ];
    for (const pattern of patterns) {
      const match = videoUrl.match(pattern);
      if (match && match[1]) {
        videoId = match[1];
        break;
      }
    }
    
    if (!videoId) return null;

    const res = await axios.get(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${process.env.GOOGLE_DRIVE_API_KEY}`);
    
    if (res.data && res.data.items && res.data.items.length > 0) {
      const durationIso = res.data.items[0].contentDetails.duration; // e.g. "PT15M33S"
      
      // Parse ISO 8601 duration
      const match = durationIso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return null;

      let h = parseInt(match[1] || 0);
      let m = parseInt(match[2] || 0);
      let s = parseInt(match[3] || 0);
      
      m += h * 60; // convert hours to minutes
      return `${m}m ${s}s`;
    }
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      console.error(`[YouTube API Error] ${error.response.data.error.message}`);
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
    console.log(`Found ${lectures.length} video lectures. Updating YouTube durations...`);

    let updatedCount = 0;

    for (let i = 0; i < lectures.length; i++) {
      const lec = lectures[i];
      if (!lec.videoUrl) continue;

      process.stdout.write(`[${i+1}/${lectures.length}] Fetching duration for "${lec.title}"... `);
      const exactDuration = await fetchYouTubeVideoDuration(lec.videoUrl);
      
      if (exactDuration) {
        lec.duration = exactDuration;
        await lec.save();
        console.log(`Updated to ${exactDuration}`);
        updatedCount++;
      } else {
        console.log(`Failed to fetch (Check if it's a valid YouTube link).`);
      }

      // Small 200ms delay
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\nMigration Complete! Updated ${updatedCount} out of ${lectures.length} lectures.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration Error:", error);
    process.exit(1);
  }
};

updateAllDurations();
