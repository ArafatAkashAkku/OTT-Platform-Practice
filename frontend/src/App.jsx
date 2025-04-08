
// VideoPlayer.jsx
import React, { useRef, useEffect, useState } from "react";

const resolutions = [
  { label: "360p", url: "http://localhost:5000/video/1744084511493-Top web development skills in 2025/360p" },
  { label: "720p", url: "http://localhost:5000/video/1744084511493-Top web development skills in 2025/720p" },
];

const App = () => {
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedUrl, setSelectedUrl] = useState(resolutions[1].url); // default to 720p

  // Handle resolution change
  const handleResolutionChange = (newUrl) => {
    const wasPlaying = !videoRef.current.paused;
    setCurrentTime(videoRef.current.currentTime);
    setSelectedUrl(newUrl);

    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
        if (wasPlaying) videoRef.current.play();
      }
    }, 100); // wait for video to load
  };

  return (
    <div className="flex flex-col items-center">
      <video
        ref={videoRef}
        width="720"
        controls
        src={selectedUrl}
        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
      >
        Your browser does not support the video tag.
      </video>

      <div className="mt-4">
        <label className="mr-2 font-semibold">Resolution:</label>
        <select
          value={selectedUrl}
          onChange={(e) => handleResolutionChange(e.target.value)}
          className="border p-1 rounded"
        >
          {resolutions.map((res) => (
            <option key={res.url} value={res.url}>
              {res.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default App;

