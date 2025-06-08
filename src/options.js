/**
 * YouTube Media Notes for Obsidian - Options Script
 * 
 * This script handles the options page functionality:
 * - Loading saved settings
 * - Saving user settings
 * - Managing multiple vaults
 * - Initializing default settings
 */

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
  closeTabDelay: 2500                                 // Delay before returning to YouTube (ms)
};

/**
 * Load saved settings from storage or use defaults
 * Populates the options form with saved values
 */
function loadSettings() {
  chrome.storage.sync.get(defaultSettings, function(settings) {
    console.log("Loading settings from storage:", settings);
    
    // Render vault items
    renderVaults(settings.vaults || defaultSettings.vaults);
    
    // Load other settings
    document.getElementById('tags').value = settings.tags || defaultSettings.tags;
    document.getElementById('titlePrefix').value = settings.titlePrefix || defaultSettings.titlePrefix;
    document.getElementById('noteTemplate').value = settings.noteTemplate || defaultSettings.noteTemplate;
    document.getElementById('closeTabDelay').value = settings.closeTabDelay || defaultSettings.closeTabDelay;
  });
}

/**
 * Render vault items in the UI
 * Creates UI elements for each vault configuration
 * 
 * @param {Array} vaults - Array of vault objects
 */
function renderVaults(vaults) {
  const container = document.getElementById('vaults-container');
  container.innerHTML = ''; // Clear existing vaults
  
  vaults.forEach((vault, index) => {
    const vaultItem = document.createElement('div');
    vaultItem.className = `vault-item ${vault.isDefault ? 'default' : ''}`;
    vaultItem.dataset.index = index;
    
    const vaultName = vault.name || 'Default Vault';
    
    vaultItem.innerHTML = `
      <div class="vault-header">
        <span class="vault-title">${vaultName}</span>
        <div class="vault-actions">
          <button class="vault-action-btn set-default" ${vault.isDefault ? 'disabled' : ''} title="Set as default">
            ${vault.isDefault ? '✓ Default' : 'Set Default'}
          </button>
          <button class="vault-action-btn remove" ${vaults.length === 1 ? 'disabled' : ''} title="Remove vault">
            ✕
          </button>
        </div>
      </div>
      <div class="form-group">
        <label for="vault-name-${index}">Vault Name:</label>
        <input type="text" id="vault-name-${index}" class="vault-name" value="${vault.name}" placeholder="e.g., MyVault">
        <p class="help-text">Leave empty to use the default vault. This should match exactly the name of your Obsidian vault.</p>
      </div>
      <div class="form-group">
        <label for="folder-path-${index}">Folder Path:</label>
        <input type="text" id="folder-path-${index}" class="folder-path" value="${vault.folderPath}" placeholder="e.g., Videos/YouTube">
        <p class="help-text">The folder path within your vault where notes will be saved. Leave empty to save in the vault root.</p>
      </div>
    `;
    
    container.appendChild(vaultItem);
    
    // Add event listeners for vault actions
    const setDefaultBtn = vaultItem.querySelector('.set-default');
    const removeBtn = vaultItem.querySelector('.remove');
    
    setDefaultBtn.addEventListener('click', function() {
      setDefaultVault(index);
    });
    
    removeBtn.addEventListener('click', function() {
      removeVault(index);
    });
  });
}

/**
 * Set a vault as the default
 * Updates the default status of all vaults
 * 
 * @param {number} index - Index of the vault to set as default
 */
function setDefaultVault(index) {
  chrome.storage.sync.get(defaultSettings, function(settings) {
    const vaults = settings.vaults || defaultSettings.vaults;
    
    // Update default status
    vaults.forEach((vault, i) => {
      vault.isDefault = (i === index);
    });
    
    // Save updated vaults
    chrome.storage.sync.set({ vaults: vaults }, function() {
      renderVaults(vaults);
      showStatus('success', 'Default vault updated');
    });
  });
}

/**
 * Remove a vault
 * Deletes a vault configuration and updates the UI
 * 
 * @param {number} index - Index of the vault to remove
 */
function removeVault(index) {
  chrome.storage.sync.get(defaultSettings, function(settings) {
    let vaults = settings.vaults || defaultSettings.vaults;
    
    // Don't remove if it's the only vault
    if (vaults.length <= 1) {
      showStatus('error', 'Cannot remove the only vault');
      return;
    }
    
    // Check if removing the default vault
    const isRemovingDefault = vaults[index].isDefault;
    
    // Remove the vault
    vaults.splice(index, 1);
    
    // If we removed the default vault, set the first vault as default
    if (isRemovingDefault && vaults.length > 0) {
      vaults[0].isDefault = true;
    }
    
    // Save updated vaults
    chrome.storage.sync.set({ vaults: vaults }, function() {
      renderVaults(vaults);
      showStatus('success', 'Vault removed');
    });
  });
}

/**
 * Add a new vault
 * Creates a new vault configuration with default values
 */
function addVault() {
  chrome.storage.sync.get(defaultSettings, function(settings) {
    const vaults = settings.vaults || defaultSettings.vaults;
    
    // Add new vault
    vaults.push({
      name: "",
      folderPath: "",
      isDefault: false
    });
    
    // Save updated vaults
    chrome.storage.sync.set({ vaults: vaults }, function() {
      renderVaults(vaults);
      showStatus('success', 'New vault added');
      
      // Scroll to the new vault
      const container = document.getElementById('vaults-container');
      container.scrollTop = container.scrollHeight;
    });
  });
}

/**
 * Save settings to storage
 * Collects values from the form and saves them
 */
function saveSettings() {
  // Collect vault settings
  const vaultItems = document.querySelectorAll('.vault-item');
  const vaults = Array.from(vaultItems).map(item => {
    const index = item.dataset.index;
    return {
      name: document.getElementById(`vault-name-${index}`).value.trim(),
      folderPath: document.getElementById(`folder-path-${index}`).value.trim(),
      isDefault: item.classList.contains('default')
    };
  });
  
  // Ensure at least one vault is set as default
  if (!vaults.some(vault => vault.isDefault)) {
    vaults[0].isDefault = true;
  }
  
  // Collect other settings
  const settings = {
    vaults: vaults,
    tags: document.getElementById('tags').value.trim() || defaultSettings.tags,
    titlePrefix: document.getElementById('titlePrefix').value || defaultSettings.titlePrefix,
    noteTemplate: document.getElementById('noteTemplate').value || defaultSettings.noteTemplate,
    closeTabDelay: parseInt(document.getElementById('closeTabDelay').value) || defaultSettings.closeTabDelay
  };
  
  console.log("Saving settings to storage:", settings);
  
  chrome.storage.sync.set(settings, function() {
    if (chrome.runtime.lastError) {
      console.error("Error saving settings:", chrome.runtime.lastError);
      showStatus('error', 'Error saving settings: ' + chrome.runtime.lastError.message);
      return;
    }
    
    showStatus('success', 'Settings saved successfully!');
  });
}

/**
 * Show status message
 * Displays a temporary status message to the user
 * 
 * @param {string} type - 'success' or 'error'
 * @param {string} message - The message to display
 */
function showStatus(type, message) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.style.display = 'block';
  
  if (type === 'success') {
    status.className = 'status success';
  } else {
    status.className = 'status error';
  }
  
  setTimeout(function() {
    status.style.display = 'none';
  }, 3000);
}

/**
 * Initialize default settings if they don't exist
 * Checks if settings exist in storage and initializes defaults if not
 * Also handles migration from old settings format
 */
function initializeDefaultSettings() {
  chrome.storage.sync.get(null, function(items) {
    console.log("Current storage contents:", items);
    
    // Check if we need to initialize settings
    if (!items || Object.keys(items).length === 0) {
      console.log("Initializing default settings:", defaultSettings);
      chrome.storage.sync.set(defaultSettings);
    }
    
    // Check if we need to migrate from old settings format
    else if (items.vaultName !== undefined && !items.vaults) {
      console.log("Migrating from old settings format");
      
      // Create vaults array from old settings
      const vaults = [{
        name: items.vaultName || "",
        folderPath: items.folderPath || "",
        isDefault: true
      }];
      
      // Create new settings object
      const newSettings = {
        vaults: vaults,
        tags: items.tags || defaultSettings.tags,
        titlePrefix: items.titlePrefix || defaultSettings.titlePrefix,
        noteTemplate: items.noteTemplate || defaultSettings.noteTemplate,
        closeTabDelay: items.closeTabDelay || defaultSettings.closeTabDelay
      };
      
      console.log("Migrated settings:", newSettings);
      chrome.storage.sync.set(newSettings);
    }
  });
}

/**
 * Clear all settings (for debugging)
 * Removes all saved settings and reloads with defaults
 */
function clearAllSettings() {
  chrome.storage.sync.clear(function() {
    console.log("All settings cleared");
    loadSettings(); // Reload with defaults
    showStatus('success', 'Settings reset to defaults');
  });
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeDefaultSettings();
  loadSettings();
  
  // Add event listeners
  document.getElementById('save').addEventListener('click', saveSettings);
  document.getElementById('add-vault').addEventListener('click', addVault);
  
  // Add a hidden debug feature - double click the title to clear settings
  document.querySelector('h1').addEventListener('dblclick', function() {
    if (confirm("Debug: Clear all settings?")) {
      clearAllSettings();
    }
  });
});
