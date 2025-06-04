// Add console logging for debugging
console.log("Background script loaded");

// Default settings
const defaultSettings = {
  vaultName: "",
  folderPath: "zz_assets/video_reviews",
  tags: "VideoReviews",
  titlePrefix: "Video. ",
  noteTemplate: "---\nmedia_link: {{url}}\ntags: {{tags}}\n---",
  closeTabDelay: 2500
};

// Process the template with data
function processTemplate(template, data) {
  return template
    .replace(/{{url}}/g, data.url)
    .replace(/{{title}}/g, data.title)
    .replace(/{{tags}}/g, data.tags)
    .replace(/{{timestamp}}/g, data.timestamp);
}

// Create an Obsidian-friendly filename
function makeObsidianFriendly(title, prefix) {
  return prefix + title.replace(/[:/\\^|#]/g, ".");
}

// Sanitize a filename to be safe for file systems
function sanitizeFileName(fileName) {
  return fileName.replace(/[\\/:*?"<>|]/g, ".");
}

// Function to execute when the extension button is clicked
function handleButtonClick(tab) {
  console.log("Extension button clicked", tab);
  
  // Check if we're on a YouTube page
  if (!tab.url.includes("youtube.com/watch")) {
    console.log("Not on a YouTube watch page");
    alert("This extension only works on YouTube video pages.");
    return;
  }
  
  // Get user settings
  chrome.storage.sync.get(defaultSettings, function(settings) {
    // Log the actual settings we're using
    console.log("Settings loaded from storage:", settings);
    
    // Inject content script if not already injected
    chrome.tabs.executeScript(tab.id, { file: "content.js" }, function() {
      if (chrome.runtime.lastError) {
        console.error("Script injection failed:", chrome.runtime.lastError);
        return;
      }
      
      console.log("Content script injected successfully");
      
      // Send message to content script
      chrome.tabs.sendMessage(tab.id, { action: "clipNote" }, function(response) {
        console.log("Response from content script:", response);
        
        if (!response || response.status !== "ok") {
          console.error("Error or no response from content script", response);
          return;
        }

        const { url, title, timestamp } = response.data;
        console.log("Processing data:", { url, title, timestamp });
        
        try {
          // Get settings directly from the settings object
          const vaultName = settings.vaultName;
          const folderPath = settings.folderPath;
          const titlePrefix = settings.titlePrefix;
          const tags = settings.tags;
          const noteTemplate = settings.noteTemplate;
          
          console.log("Using folder path:", folderPath);
          console.log("Using vault name:", vaultName);
          
          // Create the file name
          const fileName = makeObsidianFriendly(title, titlePrefix) + ".md";
          const sanitizedFileName = sanitizeFileName(fileName);
          
          // Process template content
          const templateData = {
            url,
            title,
            tags,
            timestamp
          };
          const content = processTemplate(noteTemplate, templateData);
          
          // Build the Obsidian URL - using the approach from the example code
          let obsidianUrl = "obsidian://new";
          
          // Ensure path ends with a slash if it's not empty
          let path = folderPath || "";
          if (path && !path.endsWith('/')) {
            path += '/';
          }
          
          // Format: obsidian://new?file=path/to/file.md
          obsidianUrl += `?file=${encodeURIComponent(path + sanitizedFileName)}`;
          
          // Add vault parameter if specified
          if (vaultName && vaultName.trim() !== "") {
            obsidianUrl += `&vault=${encodeURIComponent(vaultName)}`;
          }
          
          // Add content parameter
          obsidianUrl += `&content=${encodeURIComponent(content)}`;
          
          console.log("Opening Obsidian URL:", obsidianUrl);
          
          // Instead of creating a new tab, update the current tab
          // and then navigate back to the YouTube page after a delay
          const currentUrl = tab.url;
          
          chrome.tabs.update(tab.id, { url: obsidianUrl }, function() {
            // Set a timeout to navigate back to the YouTube video
            setTimeout(function() {
              chrome.tabs.update(tab.id, { url: currentUrl }, function() {
                console.log("Navigated back to YouTube video");
              });
            }, settings.closeTabDelay || 2500); // Use the configured delay
          });
        } catch (error) {
          console.error("Error processing data:", error);
          alert("Error creating note: " + error.message);
        }
      });
    });
  });
}

// Register the button click handler
chrome.browserAction.onClicked.addListener(handleButtonClick);
