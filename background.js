chrome.action.onClicked.addListener((tab) => {
  chrome.windows.create({
    url: chrome.runtime.getURL('compare.html'),
    type: 'popup',
    width: 800,
    height: 600
  });
});