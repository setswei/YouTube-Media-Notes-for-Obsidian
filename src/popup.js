/**
 * YouTube Media Notes for Obsidian - Popup Script
 * 
 * This script handles the popup UI functionality:
 * - Checking if the current page is a YouTube video
 * - Enabling/disabling the "Add to Obsidian" button accordingly
 * - Handling button clicks
 * - Managing vault selection dropdown
 */

document.addEventListener('DOMContentLoaded', function() {
  // Get the current tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    
    // Check if we're on a YouTube video page
    const isYouTubeVideo = currentTab.url.includes("youtube.com/watch");
    
    // Get button elements
    const addToObsidianButton = document.getElementById('addToObsidian');
    const vaultDropdownButton = document.getElementById('vaultDropdownButton');
    const vaultDropdown = document.getElementById('vaultDropdown');
    
    // Disable the buttons if not on a YouTube video
    if (!isYouTubeVideo) {
      addToObsidianButton.disabled = true;
      vaultDropdownButton.disabled = true;
      addToObsidianButton.classList.remove('primary');
      addToObsidianButton.classList.add('secondary');
      addToObsidianButton.innerHTML = '<span class="icon">✖</span> Not a YouTube video';
    } else {
      // Load vaults for the dropdown
      loadVaults();
    }
    
    // Add click handler for the "Add to Obsidian" button
    addToObsidianButton.addEventListener('click', function() {
      if (isYouTubeVideo) {
        // Send message to background script to handle the clip action with default vault
        chrome.runtime.sendMessage({
          action: "handleButtonClick", 
          tab: currentTab,
          useDefaultVault: true
        });
        // Close the popup
        window.close();
      }
    });
    
    // Add click handler for the vault dropdown button
    vaultDropdownButton.addEventListener('click', function(event) {
      // Toggle dropdown visibility
      vaultDropdown.classList.toggle('show');
      
      // Stop event propagation to prevent immediate closing
      event.stopPropagation();
    });
    
    // Close the dropdown when clicking outside of it
    window.addEventListener('click', function(event) {
      if (!event.target.matches('#vaultDropdownButton') && 
          !event.target.closest('#vaultDropdownButton')) {
        if (vaultDropdown.classList.contains('show')) {
          vaultDropdown.classList.remove('show');
        }
      }
    });
    
    // Add click handler for the "Settings" button
    document.getElementById('openSettings').addEventListener('click', function() {
      chrome.runtime.openOptionsPage();
      window.close();
    });
  });
});

/**
 * Load vaults from settings and populate the dropdown
 * Creates dropdown items for each configured vault
 */
function loadVaults() {
  // Default settings
  const defaultSettings = {
    vaults: [
      {
        name: "",  // Empty name means default vault
        folderPath: "",
        isDefault: true
      }
    ]
  };
  
  chrome.storage.sync.get(defaultSettings, function(settings) {
    const vaults = settings.vaults || defaultSettings.vaults;
    const dropdown = document.getElementById('vaultDropdown');
    
    // Clear existing items
    dropdown.innerHTML = '';
    
    // Add each vault as a dropdown item
    vaults.forEach((vault, index) => {
      const item = document.createElement('button');
      item.className = `dropdown-item ${vault.isDefault ? 'default' : ''}`;
      
      // Create a more descriptive display name
      let displayName = vault.name || 'Default Vault';
      if (vault.folderPath) {
        displayName += ` (${vault.folderPath})`;
      }
      
      item.textContent = displayName;
      
      item.addEventListener('click', function() {
        selectVault(index);
      });
      
      dropdown.appendChild(item);
    });
  });
}

/**
 * Select a vault and send to background script
 * Triggers note creation with the selected vault
 * 
 * @param {number} index - Index of the selected vault
 */
function selectVault(index) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    
    // Send message to background script with selected vault
    chrome.runtime.sendMessage({
      action: "handleButtonClick", 
      tab: currentTab,
      useDefaultVault: false,
      vaultIndex: index
    });
    
    // Close the popup
    window.close();
  });
}
