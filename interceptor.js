// This script runs in the page context to intercept XHR requests
(function() {
  console.log('[Timetable Interceptor] Starting XHR interception');

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url) {
    this._url = url;
    console.log('[Timetable Interceptor] XHR opened:', url);
    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function() {
    const xhr = this;
    
    this.addEventListener('load', function() {
      console.log('[Timetable Interceptor] XHR loaded:', xhr._url);
      
      try {
        if (xhr._url) {
          // Check if this is one of our target endpoints
          if (xhr._url.includes('GetPeriodsByTimePeriod')) {
            console.log('[Timetable Interceptor] Captured GetPeriodsByTimePeriod');
            const data = JSON.parse(xhr.responseText);
            window.postMessage({
              type: 'TIMETABLE_PERIODS_DATA',
              data: data
            }, '*');
          } else if (xhr._url.includes('GetEventsByUser')) {
            console.log('[Timetable Interceptor] Captured GetEventsByUser');
            const data = JSON.parse(xhr.responseText);
            window.postMessage({
              type: 'TIMETABLE_EVENTS_DATA',
              data: data
            }, '*');
          }
        }
      } catch (e) {
        console.error('[Timetable Interceptor] Error processing XHR:', e);
      }
    });
    
    return originalSend.apply(this, arguments);
  };

  // Also intercept fetch API
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    console.log('[Timetable Interceptor] Fetch called:', url);
    
    return originalFetch.apply(this, args).then(response => {
      // Clone the response so we can read it
      const clonedResponse = response.clone();
      
      if (typeof url === 'string') {
        if (url.includes('GetPeriodsByTimePeriod')) {
          console.log('[Timetable Interceptor] Captured GetPeriodsByTimePeriod via fetch');
          clonedResponse.json().then(data => {
            window.postMessage({
              type: 'TIMETABLE_PERIODS_DATA',
              data: data
            }, '*');
          }).catch(e => console.error('[Timetable Interceptor] Error parsing periods:', e));
        } else if (url.includes('GetEventsByUser')) {
          console.log('[Timetable Interceptor] Captured GetEventsByUser via fetch');
          clonedResponse.json().then(data => {
            window.postMessage({
              type: 'TIMETABLE_EVENTS_DATA',
              data: data
            }, '*');
          }).catch(e => console.error('[Timetable Interceptor] Error parsing events:', e));
        }
      }
      
      return response;
    });
  };

  console.log('[Timetable Interceptor] XHR and Fetch interception active');
})();