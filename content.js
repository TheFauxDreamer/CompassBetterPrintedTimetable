// Injector script - injects the interceptor into the page context
(function() {
  console.log('[Timetable Extension] Injector loaded');

  // Inject the interceptor script into the page
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('interceptor.js');
  script.onload = function() {
    console.log('[Timetable Extension] Interceptor script injected');
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);

  // Listen for messages from the interceptor
  let periodsData = null;
  let eventsData = null;
  let printButton = null;

  window.addEventListener('message', function(event) {
    // Only accept messages from the same window
    if (event.source !== window) return;

    if (event.data.type === 'TIMETABLE_PERIODS_DATA') {
      console.log('[Timetable Extension] Received periods data', event.data.data);
      periodsData = event.data.data;
      chrome.storage.local.set({ periodsData: periodsData });
      checkAndShowButton();
    } else if (event.data.type === 'TIMETABLE_EVENTS_DATA') {
      console.log('[Timetable Extension] Received events data', event.data.data);
      eventsData = event.data.data;
      chrome.storage.local.set({ eventsData: eventsData });
      checkAndShowButton();
    }
  });

  // Load any previously stored data
  chrome.storage.local.get(['periodsData', 'eventsData'], function(result) {
    if (result.periodsData) {
      console.log('[Timetable Extension] Loaded periods data from storage');
      periodsData = result.periodsData;
    }
    if (result.eventsData) {
      console.log('[Timetable Extension] Loaded events data from storage');
      eventsData = result.eventsData;
    }
    checkAndShowButton();
  });

  function checkAndShowButton() {
    console.log('[Timetable Extension] Checking conditions...', {
      hasPeriodsData: !!periodsData,
      hasEventsData: !!eventsData
    });

    // Check if we have both data sets
    if (periodsData && eventsData) {
      console.log('[Timetable Extension] All data available');
      
      if (!printButton) {
        createPrintButton();
      }
    }
  }

  function createPrintButton() {
    console.log('[Timetable Extension] Creating print button');
    
    printButton = document.createElement('button');
    printButton.textContent = '🖨️ Print Timetable';
    printButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 99999;
      padding: 12px 24px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      transition: all 0.3s;
      font-family: system-ui, -apple-system, sans-serif;
    `;
    
    printButton.onmouseover = () => {
      printButton.style.background = '#1565c0';
      printButton.style.transform = 'scale(1.05)';
    };
    
    printButton.onmouseout = () => {
      printButton.style.background = '#1976d2';
      printButton.style.transform = 'scale(1)';
    };
    
    printButton.onclick = () => {
      console.log('[Timetable Extension] Print button clicked');
      openPrintWindow();
    };
    
    document.body.appendChild(printButton);
    console.log('[Timetable Extension] Print button added to page');
  }

  function openPrintWindow() {
    console.log('[Timetable Extension] Opening print window');
    
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    
    if (printWindow) {
      printWindow.timetableData = {
        periods: periodsData,
        events: eventsData
      };
      
      // Load the print page
      fetch(chrome.runtime.getURL('print.html'))
        .then(response => response.text())
        .then(html => {
          printWindow.document.write(html);
          printWindow.document.close();
        })
        .catch(err => {
          console.error('[Timetable Extension] Error loading print page:', err);
        });
    } else {
      alert('Please allow pop-ups for this site to print the timetable.');
    }
  }

  // Check periodically
  setInterval(checkAndShowButton, 3000);
  
  // Initial check after page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndShowButton);
  } else {
    setTimeout(checkAndShowButton, 1000);
  }
})();