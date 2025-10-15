// Injector script - injects the interceptor into the page context
(function() {
  // Verify we're on the correct page
  const currentUrl = window.location.href;
  if (!currentUrl.includes('compass.education/Records/UserNew.aspx')) {
    console.log('[Timetable Extension] Not on correct page, skipping');
    return;
  }
  
  console.log('[Timetable Extension] Injector loaded on Compass Education page');

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
  let checkInterval = null;

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

  // Function to extract student information from the page
  function extractStudentInfo() {
    const studentInfo = {
      name: '',
      yearGroup: '',
      faction: ''
    };

    // Extract student name from h1
    const nameElement = document.querySelector('h1.MuiTypography-headerLg');
    if (nameElement) {
      studentInfo.name = nameElement.textContent.trim();
    }

    // Extract year group from link containing "YearLevel.aspx"
    const yearLevelLink = document.querySelector('a[href*="YearLevel.aspx"]');
    if (yearLevelLink) {
      studentInfo.yearGroup = yearLevelLink.textContent.trim();
    }

    // Extract faction from link containing "House.aspx"
    const houseLink = document.querySelector('a[href*="House.aspx"]');
    if (houseLink) {
      studentInfo.faction = houseLink.textContent.trim();
    }

    console.log('[Timetable Extension] Extracted student info:', studentInfo);
    return studentInfo;
  }

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
    // Check if the Schedule tab is selected
    const scheduleTab = document.querySelector('button[aria-controls="tabpanel-scheduleTab"].Mui-selected');
    const isScheduleTabActive = !!scheduleTab;
    
    // Count unique days in events data
    let uniqueDays = 0;
    let daysList = [];
    if (eventsData && eventsData.d) {
      const days = new Set();
      eventsData.d.forEach(event => {
        const date = new Date(event.start);
        const dayKey = date.toISOString().split('T')[0];
        days.add(dayKey);
      });
      uniqueDays = days.size;
      daysList = Array.from(days).sort();
    }
    
    console.log('[Timetable Extension] Checking conditions...', {
      hasPeriodsData: !!periodsData,
      hasEventsData: !!eventsData,
      isScheduleTabActive: isScheduleTabActive,
      uniqueDays: uniqueDays,
      daysList: daysList
    });

    // Check if we have both data sets AND the Schedule tab is active
    if (periodsData && eventsData && isScheduleTabActive) {
      console.log('[Timetable Extension] All data available and Schedule tab active');
      
      if (!printButton) {
        createPrintButton(uniqueDays);
      } else {
        // Update existing button if day count changed
        updatePrintButton(uniqueDays);
      }
    } else if (printButton && !isScheduleTabActive) {
      // Remove button if user switches away from Schedule tab
      console.log('[Timetable Extension] Schedule tab not active, removing button');
      printButton.remove();
      printButton = null;
    }
  }

  function createPrintButton(uniqueDays) {
    console.log('[Timetable Extension] Creating print button');
    
    const hasMissingDays = uniqueDays < 5;
    
    printButton = document.createElement('button');
    printButton.textContent = hasMissingDays ? '⚠️ Day missing. Change selected week' : '🖨️ Print Timetable';
    
    const baseStyle = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 99999;
      padding: 12px 24px;
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
    
    const backgroundColor = hasMissingDays ? '#ff9800' : '#1976d2';
    printButton.style.cssText = baseStyle + `background: ${backgroundColor};`;
    
    printButton.onmouseover = () => {
      const hoverColor = hasMissingDays ? '#f57c00' : '#1565c0';
      printButton.style.background = hoverColor;
      printButton.style.transform = 'scale(1.05)';
    };
    
    printButton.onmouseout = () => {
      printButton.style.background = backgroundColor;
      printButton.style.transform = 'scale(1)';
    };
    
    printButton.onclick = () => {
      console.log('[Timetable Extension] Print button clicked');
      openPrintWindow();
    };
    
    document.body.appendChild(printButton);
    console.log('[Timetable Extension] Print button added to page');
  }

  function updatePrintButton(uniqueDays) {
    if (!printButton) return;
    
    const hasMissingDays = uniqueDays < 5;
    const backgroundColor = hasMissingDays ? '#ff9800' : '#1976d2';
    
    printButton.textContent = hasMissingDays ? '⚠️ Day missing. Change selected week' : '🖨️ Print Timetable';
    printButton.style.background = backgroundColor;
    
    printButton.onmouseover = () => {
      const hoverColor = hasMissingDays ? '#f57c00' : '#1565c0';
      printButton.style.background = hoverColor;
      printButton.style.transform = 'scale(1.05)';
    };
    
    printButton.onmouseout = () => {
      printButton.style.background = backgroundColor;
      printButton.style.transform = 'scale(1)';
    };
  }

  function openPrintWindow() {
    console.log('[Timetable Extension] Opening print window');
    
    // Extract student information from the page
    const studentInfo = extractStudentInfo();
    
    // Save data to chrome storage before opening window
    chrome.storage.local.set({ 
      periodsData: periodsData,
      eventsData: eventsData,
      studentInfo: studentInfo
    }, function() {
      console.log('[Timetable Extension] Data saved to storage');
      
      // Open the print page directly from the extension
      const printUrl = chrome.runtime.getURL('print.html');
      const printWindow = window.open(printUrl, '_blank', 'width=1000,height=800');
      
      if (!printWindow) {
        alert('Please allow pop-ups for this site to print the timetable.');
      } else {
        console.log('[Timetable Extension] Print window opened');
      }
    });
  }

  // Check periodically (will be cleared once button appears)
  checkInterval = setInterval(checkAndShowButton, 3000);
  
  // Initial check after page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndShowButton);
  } else {
    setTimeout(checkAndShowButton, 1000);
  }
})();