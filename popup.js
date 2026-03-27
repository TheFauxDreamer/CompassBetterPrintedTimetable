document.addEventListener('DOMContentLoaded', function() {
    const quickPrintCheckbox = document.getElementById('quickPrint');

    // Load saved setting
    chrome.storage.local.get(['quickPrint'], function(result) {
        quickPrintCheckbox.checked = !!result.quickPrint;
    });

    // Save on change
    quickPrintCheckbox.addEventListener('change', function() {
        chrome.storage.local.set({ quickPrint: this.checked });
    });
});
