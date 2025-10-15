// Background service worker for the extension
// This can be used for additional features in the future

chrome.runtime.onInstalled.addListener(() => {
  console.log('Student Timetable Printer extension installed');
});

// Listen for messages from content script if needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'printTimetable') {
    // Handle print action if needed
    sendResponse({ status: 'success' });
  }
  return true;
});