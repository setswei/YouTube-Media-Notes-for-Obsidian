/**
 * YouTube Media Notes for Obsidian - Popup Script
 * 
 * This script handles the popup UI functionality:
 * - Checking if the current page is a YouTube video
 * - Enabling/disabling the "Add to Obsidian" button accordingly
 * - Handling button clicks
 */

document.addEventListener('DOMContentLoaded', function() {
  // Get the current tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    
    // Check if we're on a YouTube video page
    const isYouTubeVideo = currentTab.url.includes("youtube.com/watch");
    
    // Get button elements
    const addToObsidianButton = document.getElementById('addToObsidian');
    
    // Disable the button if not on a YouTube video
    if (!isYouTubeVideo) {
      addToObsidianButton.disabled = true;
      addToObsidianButton.classList.remove('primary');
      addToObsidianButton.classList.add('secondary');
      addToObsidianButton.innerHTML = '<span class="icon">✖</span> Not a YouTube video';
    }
    
    // Add click handler for the "Add to Obsidian" button
    addToObsidianButton.addEventListener('click', function() {
      if (isYouTubeVideo) {
        // Send message to background script to handle the clip action
        chrome.runtime.sendMessage({action: "handleButtonClick", tab: currentTab});
        // Close the popup
        window.close();
      }
    });
    
    // Add click handler for the "Settings" button
    document.getElementById('openSettings').addEventListener('click', function() {
      chrome.runtime.openOptionsPage();
      window.close();
    });
  });
});
