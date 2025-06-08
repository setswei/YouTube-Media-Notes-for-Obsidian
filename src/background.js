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

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "handleButtonClick" && request.tab) {
    handleButtonClick(
      request.tab, 
      request.useDefaultVault !== false, 
      request.vaultIndex || 0
    );
  }
});

/**
 * Default settings for the extension
 * These will be used if no user settings are found
 */
const defaultSettings = {
  vaults: [
    {
      name: "",  // Empty name means default vault
      folderPath: "",
      isDefault: true
    }
  ],
  tags: "YouTube",                                      // Default tags for notes
  titlePrefix: "Video. ",                                 // Prefix for note titles
  noteTemplate: "---\nmedia_link: {{url}}\ntags: {{tags}}\n---", // Default note template
  closeTabDelay: 2500                               // Delay before returning to YouTube (ms)
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
  let content = template;
  
  // Replace variables in the template
  for (const key in data) {
    if (key !== "timestamps") {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, data[key]);
    }
  }
  
  // Add timestamps table if available
  if (data.timestamps && data.timestamps.length > 0) {
    const baseUrl = data.url.split('&t=')[0];
    let timestampTable = "\n\n## Timestamps\n\n| Time | Chapter |\n|------|--------|\n";
    
    data.timestamps.forEach(ts => {
      const timeLink = `[${ts.time}](${baseUrl}&t=${ts.seconds})`;
      timestampTable += `| ${timeLink} | ${ts.title} |\n`;
    });
    
    content += timestampTable;
  }
  
  return content;
}

/**
 * Make a string safe for use as an Obsidian filename
 * Removes special characters and limits length
 * 
 * @param {string} title - The original title
 * @param {string} prefix - Optional prefix to add to the title
 * @returns {string} - A safe filename
 */
function makeObsidianFriendly(title, prefix = "") {
  // Add prefix if provided
  if (prefix) {
    title = prefix + title;
  }
  
  // Limit length
  if (title.length > 100) {
    title = title.substring(0, 100) + "...";
  }
  
  return title;
}

/**
 * Sanitize a filename to remove invalid characters
 * 
 * @param {string} filename - The filename to sanitize
 * @returns {string} - A sanitized filename
 */
function sanitizeFileName(filename) {
  // Replace invalid characters with underscores
  return filename.replace(/[\\/:*?"<>|]/g, '_');
}

/**
 * Handle button click from popup
 * This is the main function that processes the YouTube video and creates a note in Obsidian
 * 
 * @param {object} tab - The current browser tab
 * @param {boolean} useDefaultVault - Whether to use the default vault
 * @param {number} vaultIndex - Index of the selected vault (if not using default)
 */
function handleButtonClick(tab, useDefaultVault = true, vaultIndex = 0) {
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
    
    // Get the selected vault
    let selectedVault;
    if (useDefaultVault) {
      // Find the default vault
      selectedVault = settings.vaults.find(vault => vault.isDefault) || settings.vaults[0];
    } else {
      // Use the specified vault index
      selectedVault = settings.vaults[vaultIndex] || settings.vaults[0];
    }
    
    console.log("Using vault:", selectedVault);
    
    // Inject content script if not already injected
    chrome.tabs.executeScript(tab.id, { file: "src/content.js" }, function() {
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
          // Get settings from the selected vault and general settings
          const vaultName = selectedVault.name;
          const folderPath = selectedVault.folderPath;
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
          
          // Handle folder path - use empty string if explicitly cleared by user
          let path = folderPath;
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
          
          // Open the URL in a new tab
          chrome.tabs.create({ url: obsidianUrl }, function(newTab) {
            // Close the tab after a delay
            setTimeout(function() {
              chrome.tabs.remove(newTab.id);
            }, settings.closeTabDelay);
          });
          
        } catch (error) {
          console.error("Error processing note:", error);
          alert("Error creating note: " + error.message);
        }
      });
    });
  });
}
