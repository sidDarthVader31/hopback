// Clicking the toolbar icon opens the question list in the current tab.
// On pages HopBack doesn't run on there is nobody listening, which is fine.
chrome.action.onClicked.addListener((tab) => {
  if (tab.id !== undefined) chrome.tabs.sendMessage(tab.id, { type: 'hopback:toggle' }).catch(() => {});
});
