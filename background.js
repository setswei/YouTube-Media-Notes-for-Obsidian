/**
 * YouTube Media Notes for Obsidian - Background Script
 * 
 * This script handles the main functionality of the extension:
 * - Processing button clicks
 * - Communicating with the content script
 * - Creating and formatting notes
 * - Opening Obsidian with the formatted note
 */

// Log when the background script loads
console.log("Background script loaded");

/**
 * Default settings for the extension
 * These will be used if no user settings are found
 */
const defaultSettings = {
  vaultName: "",                                      // Obsidian vault name (empty = default vault)
  folderPath: "zz_assets/video_reviews",              // Folder path within the vault
  tags: "VideoReviews",                               // Default tags for notes
  titlePrefix: "Video. ",                             // Prefix for note titles
  noteTemplate: "---\nmedia_link: {{url}}\ntags: {{tags}}\n---", // Default note template
  closeTabDelay: 2500                                 // Delay before returning to YouTube (ms)
};

/**
 * Process the template with data
 * Replaces template variables with actual data and adds timestamps if available
 * 
 * @param {string} template - The note template with variables
 * @param {object} data - Object containing data to insert into the template
 * @returns {string} - The processed template with all variables replaced
 */
function processTemplate(template, data) {
  // Replace template variables with actual data
  let processed = template
    .replace(/{{url}}/g, data.url)
    .replace(/{{title}}/g, data.title)
    .replace(/{{tags}}/g, data.tags)
    .replace(/{{timestamp}}/g, data.timestamp);
  
  // Add timestamps if available
  if (data.timestamps && data.timestamps.length > 0) {
    let timestampsMarkdown = "\n\n## Timestamps\n\n";
    
    // Create markdown table header
    timestampsMarkdown += "| Time | Chapter |\n";
    timestampsMarkdown += "|------|--------|\n";
    
    // Add each timestamp as a table row
    data.timestamps.forEach(ts => {
      timestampsMarkdown += `| [${ts.time}](${ts.url}) | ${ts.label} |\n`;
    });
    
    processed += timestampsMarkdown;
  }
  
  return processed;
}

/**
 * Create an Obsidian-friendly filename
 * Replaces characters that might cause issues in filenames
 * 
 * @param {string} title - The original title
 * @param {string} prefix - Prefix to add to the title
 * @returns {string} - The sanitized filename with prefix
 */
function makeObsidianFriendly(title, prefix) {
  return prefix + title.replace(/[:/\\^|#]/g, ".");
}

/**
 * Sanitize a filename to be safe for file systems
 * Removes characters that are not allowed in filenames
 * 
 * @param {string} fileName - The filename to sanitize
 * @returns {string} - The sanitized filename
 */
function sanitizeFileName(fileName) {
  return fileName.replace(/[\\/:*?"<>|]/g, ".");
}

/**
 * Handle the extension button click
 * This is the main function that runs when the user clicks the extension button
 * 
 * @param {object} tab - The current browser tab
 */
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

        const { url, title, timestamp, timestamps } = response.data;
        console.log("Processing data:", { url, title, timestamp });
        console.log("Timestamps found:", timestamps ? timestamps.length : 0);
        
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
            timestamp,
            timestamps: timestamps || []
          };
          const content = processTemplate(noteTemplate, templateData);
          
          // Build the Obsidian URL
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
