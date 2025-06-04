// Default settings
const defaultSettings = {
  vaultName: "",
  folderPath: "zz_assets/video_reviews",
  tags: "VideoReviews",
  titlePrefix: "Video. ",
  noteTemplate: "---\nmedia_link: {{url}}\ntags: {{tags}}\n---"
};

// Load saved settings or use defaults
function loadSettings() {
  chrome.storage.sync.get(defaultSettings, function(settings) {
    console.log("Loading settings from storage:", settings);
    document.getElementById('vaultName').value = settings.vaultName || "";
    document.getElementById('folderPath').value = settings.folderPath || defaultSettings.folderPath;
    document.getElementById('tags').value = settings.tags || defaultSettings.tags;
    document.getElementById('titlePrefix').value = settings.titlePrefix || defaultSettings.titlePrefix;
    document.getElementById('noteTemplate').value = settings.noteTemplate || defaultSettings.noteTemplate;
  });
}

// Save settings
function saveSettings() {
  const settings = {
    vaultName: document.getElementById('vaultName').value.trim(),
    folderPath: document.getElementById('folderPath').value.trim() || defaultSettings.folderPath,
    tags: document.getElementById('tags').value.trim() || defaultSettings.tags,
    titlePrefix: document.getElementById('titlePrefix').value || defaultSettings.titlePrefix,
    noteTemplate: document.getElementById('noteTemplate').value || defaultSettings.noteTemplate
  };
  
  console.log("Saving settings to storage:", settings);
  
  chrome.storage.sync.set(settings, function() {
    if (chrome.runtime.lastError) {
      console.error("Error saving settings:", chrome.runtime.lastError);
      const status = document.getElementById('status');
      status.textContent = 'Error saving settings: ' + chrome.runtime.lastError.message;
      status.className = 'status error';
      status.style.display = 'block';
      return;
    }
    
    const status = document.getElementById('status');
    status.textContent = 'Settings saved successfully!';
    status.className = 'status success';
    status.style.display = 'block';
    
    setTimeout(function() {
      status.style.display = 'none';
    }, 3000);
  });
}

// Initialize default settings if they don't exist
function initializeDefaultSettings() {
  chrome.storage.sync.get(null, function(items) {
    console.log("Current storage contents:", items);
    
    // Check if we need to initialize settings
    if (!items || Object.keys(items).length === 0) {
      console.log("Initializing default settings:", defaultSettings);
      chrome.storage.sync.set(defaultSettings);
    }
  });
}

// Clear all settings (for debugging)
function clearAllSettings() {
  chrome.storage.sync.clear(function() {
    console.log("All settings cleared");
    loadSettings(); // Reload with defaults
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  initializeDefaultSettings();
  loadSettings();
  document.getElementById('save').addEventListener('click', saveSettings);
  
  // Add a hidden debug feature - double click the title to clear settings
  document.querySelector('h1').addEventListener('dblclick', function() {
    if (confirm("Debug: Clear all settings?")) {
      clearAllSettings();
    }
  });
});
