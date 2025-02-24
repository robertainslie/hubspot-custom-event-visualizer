// src/content.js
let extensionFrame = null;
let currentHighlight = null;
let isSelecting = false;

// Helper function to get unique selector for an element
function getUniqueSelector(element) {
  if (element.id) {
    return `#${element.id}`;
  }

  let path = [];
  while (element) {
    let selector = element.tagName.toLowerCase();
    if (element.className) {
      const classes = Array.from(element.classList).join(".");
      selector += `.${classes}`;
    }
    path.unshift(selector);
    element = element.parentElement;
  }
  return path.join(" > ");
}

// Mouse move handler for highlighting
function handleMouseMove(e) {
  if (!isSelecting) return;

  // Remove previous highlight
  if (currentHighlight) {
    currentHighlight.classList.remove("event-tracker-highlight");
  }

  // Don't highlight the extension frame or its children
  if (e.target === extensionFrame || extensionFrame?.contains(e.target)) {
    return;
  }

  // Add highlight to current element
  currentHighlight = e.target;
  currentHighlight.classList.add("event-tracker-highlight");

  // Send selector path to extension
  if (extensionFrame?.contentWindow) {
    extensionFrame.contentWindow.postMessage(
      {
        type: "SELECTOR_PATH",
        selector: getUniqueSelector(e.target),
      },
      "*"
    );
  }
}

// Click handler for element selection
function handleClick(e) {
  if (!isSelecting) return;

  e.preventDefault();
  e.stopPropagation();

  if (e.target === extensionFrame || extensionFrame?.contains(e.target)) {
    return;
  }

  // Send selected element to extension
  if (extensionFrame?.contentWindow) {
    extensionFrame.contentWindow.postMessage(
      {
        type: "ELEMENT_SELECTED",
        selector: getUniqueSelector(e.target),
      },
      "*"
    );
  }
}

// Listen for messages from the app
window.addEventListener("message", (event) => {
  if (event.source !== extensionFrame?.contentWindow) return;

  switch (event.data.type) {
    case "TOGGLE_TRACKER":
      if (event.data.active) {
        isSelecting = true;
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("click", handleClick, true);
      } else {
        isSelecting = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("click", handleClick, true);
        if (currentHighlight) {
          currentHighlight.classList.remove("event-tracker-highlight");
          currentHighlight = null;
        }
        if (extensionFrame) {
          extensionFrame.remove();
          extensionFrame = null;
        }
      }
      break;

    case "START_PROPERTY_MAPPING":
      isSelecting = true;
      break;
  }
});

// Function to initialize the extension frame
function initializeExtensionFrame() {
  if (extensionFrame) {
    extensionFrame.remove();
  }

  extensionFrame = document.createElement("iframe");
  extensionFrame.id = "event-tracker-app";
  extensionFrame.src = chrome.runtime.getURL("app.html");
  extensionFrame.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 300px;
    border: none;
    z-index: 999999;
    background: white;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  `;

  document.body.appendChild(extensionFrame);
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "OPEN_TRACKER") {
    initializeExtensionFrame();
  }
});
