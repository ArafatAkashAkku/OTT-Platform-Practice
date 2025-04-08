const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

const app = express();
app.use(cors());

// Setup storage for uploads
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Upload video route
app.post("/upload", upload.single("video"), async (req, res) => {
  const file = req.file;

  if (!file) return res.status(400).json({ error: "No video uploaded" });

  const videoId = path.parse(file.filename).name;
  const inputPath = file.path;
  const outputDir = path.join(__dirname, "processed", videoId);
  fs.mkdirSync(outputDir, { recursive: true });

  // Transcode to different resolutions
  const resolutions = [
    { name: "360p", size: "640x360" },
    { name: "720p", size: "1280x720" },
  ];

  const transcode = (res) =>
    new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(`${outputDir}/${res.name}.mp4`)
        .videoCodec("libx264")
        .size(res.size)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });

  try {
    for (const resObj of resolutions) {
      await transcode(resObj);
    }

    res.status(200).json({
      success: true,
      videoId,
      resolutions: resolutions.map((r) => ({
        quality: r.name,
        url: `/video/${videoId}/${r.name}`,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Transcoding failed" });
  }
});

// Stream video with Node.js streams
app.get("/video/:videoId/:quality", (req, res) => {
  const { videoId, quality } = req.params;
  const videoPath = path.join(__dirname, "processed", videoId, `${quality}.mp4`);

  if (!fs.existsSync(videoPath)) {
    return res.status(404).send("Video not found");
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const file = fs.createReadStream(videoPath, { start, end });
    const headers = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "video/mp4",
    };

    res.writeHead(206, headers);
    file.pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    });
    fs.createReadStream(videoPath).pipe(res);
  }
});

app.listen(5000, () => {
  console.log("Server running at http://localhost:5000");
});
