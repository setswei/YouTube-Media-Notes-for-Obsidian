// Add console logging for debugging
console.log("Content script loaded on YouTube page");

// Function to handle the clip note action
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
    
    // Send data back to background script
    const response = {
      status: "ok",
      data: {
        url: url.toString(),
        title,
        timestamp: currentTime
      }
    };
    
    console.log("Sending response:", response);
    sendResponse(response);
  } catch (error) {
    console.error("Error in content script:", error);
    sendResponse({ status: "error", message: error.toString() });
  }
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
