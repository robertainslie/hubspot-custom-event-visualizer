// content.js
let extensionFrame = null;
let currentHighlight = null;
let isSelecting = false;
let selectionMode = "event"; // 'event' or 'property'

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

function handleMouseMove(e) {
  if (!isSelecting) return;

  // Don't highlight the extension frame or its children
  if (e.target === extensionFrame || extensionFrame?.contains(e.target)) {
    return;
  }

  // Remove previous highlight
  if (currentHighlight) {
    currentHighlight.classList.remove("event-tracker-highlight");
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

function handleClick(e) {
  if (!isSelecting) return;

  e.preventDefault();
  e.stopPropagation();

  if (e.target === extensionFrame || extensionFrame?.contains(e.target)) {
    return;
  }

  const selector = getUniqueSelector(e.target);
  const value = e.target.textContent.trim();

  if (selectionMode === "event") {
    extensionFrame?.contentWindow.postMessage(
      {
        type: "ELEMENT_SELECTED",
        selector: selector,
      },
      "*"
    );
  } else if (selectionMode === "property") {
    extensionFrame?.contentWindow.postMessage(
      {
        type: "PROPERTY_VALUE",
        selector: selector,
        value: value,
      },
      "*"
    );
    // Reset back to event mode after property selection
    selectionMode = "event";
  }
}

window.addEventListener("message", (event) => {
  if (event.source !== extensionFrame?.contentWindow) return;

  switch (event.data.type) {
    case "TOGGLE_TRACKER":
      if (event.data.active) {
        isSelecting = true;
        selectionMode = "event";
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
      selectionMode = "property";
      break;
  }
});

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

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "OPEN_TRACKER") {
    initializeExtensionFrame();
  }
});
