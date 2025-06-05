/**
 * YouTube Media Notes for Obsidian - Content Script
 * 
 * This script runs in the context of YouTube pages and handles:
 * - Extracting video information
 * - Finding and extracting timestamps/chapters
 * - Sending data back to the background script
 */

// Log when the content script loads
console.log("Content script loaded on YouTube page");

/**
 * Extract timestamps from the YouTube video
 * First tries to expand the description if needed, then extracts timestamps
 * 
 * @returns {Promise<Array>} - Promise resolving to an array of timestamp objects
 */
function extractTimestamps() {
  console.log("Extracting timestamps from video");
  
  // First, try to expand the description if it's collapsed
  try {
    const expandButton = document.querySelector('tp-yt-paper-button#expand');
    if (expandButton) {
      console.log("Found expand button, clicking it...");
      expandButton.click();
      // Give a small delay for the description to expand
      console.log("Waiting for description to expand...");
      return new Promise(resolve => {
        setTimeout(() => {
          console.log("Description should be expanded now, extracting timestamps...");
          resolve(extractTimestampsFromPage());
        }, 500); // 500ms delay
      });
    } else {
      console.log("No expand button found, description might already be expanded");
      return Promise.resolve(extractTimestampsFromPage());
    }
  } catch (e) {
    console.error("Error expanding description:", e);
    return Promise.resolve(extractTimestampsFromPage());
  }
}

/**
 * Extract timestamps from the page after ensuring description is expanded
 * Tries multiple methods to find timestamps
 * 
 * @returns {Array} - Array of timestamp objects with time, label, seconds, and URL
 */
function extractTimestampsFromPage() {
  // First try to get official YouTube chapters
  const chapterElements = document.querySelectorAll("ytd-chapter-renderer");
  
  // If official chapters exist, use those
  if (chapterElements && chapterElements.length > 0) {
    console.log("Found official YouTube chapters:", chapterElements.length);
    
    const timestamps = [];
    chapterElements.forEach(chapter => {
      try {
        const timeElement = chapter.querySelector(".ytd-thumbnail-overlay-time-status-renderer");
        const titleElement = chapter.querySelector("#chapter-title");
        
        if (timeElement && titleElement) {
          const time = timeElement.textContent.trim();
          const label = titleElement.textContent.trim();
          const seconds = convertTimestampToSeconds(time);
          
          timestamps.push({
            time,
            label,
            seconds,
            url: `${window.location.origin}${window.location.pathname}?v=${new URLSearchParams(window.location.search).get('v')}&t=${seconds}`
          });
        }
      } catch (e) {
        console.error("Error parsing chapter:", e);
      }
    });
    
    if (timestamps.length > 0) {
      console.log("Extracted official chapters:", timestamps);
      return timestamps;
    }
  }
  
  // Fall back to description parsing if no official chapters found
  console.log("No official chapters found, parsing description");
  
  // Try to find the chapters section in the description
  const descriptionElement = document.querySelector("#description-inline-expander");
  
  if (!descriptionElement) {
    console.log("Description element not found");
    return [];
  }
  
  // Get the text content of the description
  const descriptionText = descriptionElement.textContent;
  console.log("Description text found:", descriptionText.substring(0, 100) + "...");
  
  // Regular expression to match timestamps in format 00:00 or 00:00:00 followed by text
  const timestampRegex = /(\d{1,2}:(?:\d{1,2}:)?\d{1,2})\s+(.*?)(?=\n\d{1,2}:|\n\n|$)/g;
  
  const timestamps = [];
  let match;
  
  // Extract all timestamps
  while ((match = timestampRegex.exec(descriptionText)) !== null) {
    const time = match[1];
    const label = match[2].trim();
    
    // Convert timestamp to seconds for URL
    const seconds = convertTimestampToSeconds(time);
    
    timestamps.push({
      time,
      label,
      seconds,
      url: `${window.location.origin}${window.location.pathname}?v=${new URLSearchParams(window.location.search).get('v')}&t=${seconds}`
    });
  }
  
  // Deduplicate timestamps based on seconds
  const uniqueTimestamps = [];
  const seenSeconds = new Set();
  
  timestamps.forEach(ts => {
    if (!seenSeconds.has(ts.seconds)) {
      seenSeconds.add(ts.seconds);
      uniqueTimestamps.push(ts);
    }
  });
  
  console.log("Extracted timestamps from description:", uniqueTimestamps);
  return uniqueTimestamps;
}

/**
 * Convert timestamp string to seconds
 * Handles both MM:SS and HH:MM:SS formats
 * 
 * @param {string} timestamp - Timestamp string (e.g., "1:30" or "1:30:45")
 * @returns {number} - Timestamp in seconds
 */
function convertTimestampToSeconds(timestamp) {
  // Clean up the timestamp string
  const cleanTimestamp = timestamp.trim().replace(/\s+/g, '');
  
  const parts = cleanTimestamp.split(':').map(Number);
  
  if (parts.length === 2) {
    // MM:SS format
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS format
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  
  return 0;
}

/**
 * Handle the clip note action
 * Gets video information and timestamps, then sends them to the background script
 * 
 * @param {function} sendResponse - Function to send response back to background script
 * @returns {boolean} - True to indicate we'll call sendResponse asynchronously
 */
function clipYouTubeNote(sendResponse) {
  try {
    console.log("Processing clipNote action");
    
    // Get video element
    const video = document.querySelector("video");
    if (!video) {
      console.error("No video element found on page");
      sendResponse({ status: "error", message: "No video found on page" });
      return;
    }
    
    console.log("Video element found:", video);
    
    // Pause video if playing
    const paused = video.paused;
    if (!paused) {
      console.log("Pausing video");
      video.pause();
    }

    // Get current timestamp
    const currentTime = Math.floor(video.currentTime);
    console.log("Current timestamp:", currentTime);
    
    // Create URL with timestamp
    const url = new URL(window.location.href);
    url.searchParams.set("t", currentTime);
    console.log("URL with timestamp:", url.toString());

    // Get video title
    const title = document.title.replace(" - YouTube", "");
    console.log("Video title:", title);
    
    // Extract timestamps from description (now returns a Promise)
    extractTimestamps().then(timestamps => {
      // Send data back to background script
      const response = {
        status: "ok",
        data: {
          url: url.toString(),
          title,
          timestamp: currentTime,
          timestamps: timestamps
        }
      };
      
      console.log("Sending response:", response);
      sendResponse(response);
    }).catch(error => {
      console.error("Error extracting timestamps:", error);
      sendResponse({ 
        status: "ok",
        data: {
          url: url.toString(),
          title,
          timestamp: currentTime,
          timestamps: []
        }
      });
    });
  } catch (error) {
    console.error("Error in content script:", error);
    sendResponse({ status: "error", message: error.toString() });
  }
  
  // Return true to indicate we'll call sendResponse asynchronously
  return true;
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in content script:", request);
  
  if (request.action === "clipNote") {
    clipYouTubeNote(sendResponse);
    return true; // Keep the message channel open for async response
  }
  return true;
});
