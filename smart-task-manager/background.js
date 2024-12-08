
// Load rules dynamically from rules.json
let dynamicRules = [];
fetch(chrome.runtime.getURL('rules.json'))
  .then((response) => response.json())
  .then((data) => {
    dynamicRules = data;
  })
  .catch((error) => console.error("Failed to load rules.json:", error));

// Monitor tasks and apply blocking rules
setInterval(() => {
  chrome.storage.local.get(["tasks"], (result) => {
    const tasks = result.tasks || [];
    const now = new Date();

    // Check if any task is due and not completed
    const shouldBlock = tasks.some((task) => {
      const startTime = new Date(task.start);
      const endTime = new Date(task.end);
      return now >= startTime && now <= endTime && !task.completed;
    });

    if (shouldBlock) {
      enableBlocking();
    } else {
      disableBlocking();
    }
  });
}, 1000); // Check every second

// Enable blocking by applying rules from rules.json
function enableBlocking() {
  const ruleIds = dynamicRules.map(rule => rule.id);
  chrome.declarativeNetRequest.updateDynamicRules(
    {
      removeRuleIds: ruleIds, // Remove existing rules
      addRules: dynamicRules // Add new rules from rules.json
    },
    () => {
      console.log("Blocking enabled for pending tasks.");
    }
  );
}

// Disable blocking by removing all rules
function disableBlocking() {
  const ruleIds = dynamicRules.map(rule => rule.id);
  chrome.declarativeNetRequest.updateDynamicRules(
    {
      removeRuleIds: ruleIds, // Remove all rules
      addRules: [] // No new rules added
    },
    () => {
      console.log("Blocking disabled - no pending tasks.");
    }
  );
}

// Handle status request from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "checkBlockingStatus") {
    chrome.storage.local.get(["tasks"], (result) => {
      const tasks = result.tasks || [];
      const now = new Date();

      const hasPendingTasks = tasks.some((task) => {
        const startTime = new Date(task.start);
        const endTime = new Date(task.end);
        return now >= startTime && now <= endTime && !task.completed;
      });

      if (hasPendingTasks) {
        sendResponse({ message: "Websites are currently blocked due to pending tasks." });
      } else {
        sendResponse({ message: "No tasks are pending. Websites are unblocked." });
      }
    });
    return true; // Keep the response channel open for async
  }
});

