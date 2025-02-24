// content.js
let extensionFrame = null;
let currentHighlight = null;
let isSelecting = false;
let selectionMode = "event"; // 'event' or 'property'
let highlightTimeout = null;

function getUniqueSelector(element) {
  const extensionClasses = [
    "event-tracker-highlight",
    "event-tracker-highlight-flash",
  ];

  function getCleanClassList(el) {
    if (!el.className || typeof el.className !== "string") return [];
    return Array.from(el.classList).filter(
      (cls) => !extensionClasses.includes(cls) && !cls.includes(" ")
    );
  }

  // Try ID first
  if (element.id) {
    return `#${element.id}`;
  }

  // Try data attributes
  const dataAttrs = Array.from(element.attributes)
    .filter((attr) => attr.name.startsWith("data-"))
    .map((attr) => `[${attr.name}="${attr.value}"]`);

  if (dataAttrs.length > 0) {
    return `${element.tagName.toLowerCase()}${dataAttrs.join("")}`;
  }

  // Build selector path
  let path = [];
  let currentElement = element;

  while (currentElement && currentElement !== document.documentElement) {
    if (currentElement === document.body) {
      path.unshift("body");
      break;
    }

    let selector = currentElement.tagName.toLowerCase();

    // Add id if present
    if (currentElement.id) {
      selector = `#${currentElement.id}`;
      path.unshift(selector);
      break;
    }

    // Add classes (excluding extension classes)
    const cleanClasses = getCleanClassList(currentElement);
    if (cleanClasses.length > 0) {
      selector += `.${cleanClasses.join(".")}`;
    }

    // If no specific identifiers found, use nth-child
    if (selector === currentElement.tagName.toLowerCase()) {
      const parent = currentElement.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          (el) => el.tagName === currentElement.tagName
        );
        if (siblings.length > 1) {
          const index = siblings.indexOf(currentElement) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }
    }

    path.unshift(selector);
    currentElement = currentElement.parentElement;
  }

  return path.join(" > ");
}

function addHighlightStyles() {
  // Add styles if they don't exist
  if (!document.getElementById("event-tracker-styles")) {
    const style = document.createElement("style");
    style.id = "event-tracker-styles";
    style.textContent = `
      .event-tracker-highlight {
        outline: 2px solid #FF9800 !important;
        outline-offset: 2px !important;
        transition: outline-color 0.3s ease !important;
      }
      .event-tracker-highlight-flash {
        animation: highlight-flash 0.5s ease !important;
      }
      @keyframes highlight-flash {
        0% { outline-color: #FF9800; }
        50% { outline-color: #FFC107; }
        100% { outline-color: #FF9800; }
      }
    `;
    document.head.appendChild(style);
  }
}

function highlightElement(element, temporary = false) {
  if (!element) return;

  // Remove previous highlight
  if (currentHighlight && currentHighlight !== element) {
    currentHighlight.classList.remove("event-tracker-highlight");
    currentHighlight.classList.remove("event-tracker-highlight-flash");
  }

  // Add highlight to current element
  currentHighlight = element;
  element.classList.add("event-tracker-highlight");

  if (temporary) {
    element.classList.add("event-tracker-highlight-flash");
    // Clear previous timeout if exists
    if (highlightTimeout) {
      clearTimeout(highlightTimeout);
    }
    // Remove highlight after animation
    highlightTimeout = setTimeout(() => {
      element.classList.remove("event-tracker-highlight");
      element.classList.remove("event-tracker-highlight-flash");
      currentHighlight = null;
    }, 1500);
  }
}

function handleMouseMove(e) {
  if (!isSelecting) return;

  // Don't highlight the extension frame or its children
  if (e.target === extensionFrame || extensionFrame?.contains(e.target)) {
    return;
  }

  highlightElement(e.target);

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
        addHighlightStyles();
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("click", handleClick, true);
      } else {
        isSelecting = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("click", handleClick, true);
        if (currentHighlight) {
          currentHighlight.classList.remove("event-tracker-highlight");
          currentHighlight.classList.remove("event-tracker-highlight-flash");
          currentHighlight = null;
        }
        if (extensionFrame) {
          // Remove highlight styles
          const styles = document.getElementById("event-tracker-styles");
          if (styles) {
            styles.remove();
          }
          // Restore original padding
          document.body.style.paddingBottom =
            extensionFrame.dataset.originalPadding || "";
          extensionFrame.remove();
          extensionFrame = null;
        }
      }
      break;

    case "START_PROPERTY_MAPPING":
      isSelecting = true;
      selectionMode = "property";
      break;

    case "HIGHLIGHT_ELEMENT":
      const element = document.querySelector(event.data.selector);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        highlightElement(element, true);
      }
      break;

    case "COPY_TO_CLIPBOARD":
      // Create a temporary textarea element
      const textarea = document.createElement("textarea");
      textarea.value = event.data.text;
      textarea.style.cssText = `
        position: fixed;
        left: -9999px;
        top: -9999px;
        opacity: 0;
      `;
      document.body.appendChild(textarea);

      try {
        // Select the text and copy
        textarea.select();
        document.execCommand("copy");

        // Notify success
        extensionFrame.contentWindow.postMessage(
          {
            type: "COPY_COMPLETE",
            success: true,
          },
          "*"
        );
      } catch (err) {
        // Handle any errors
        extensionFrame.contentWindow.postMessage(
          {
            type: "COPY_COMPLETE",
            success: false,
            error: "Failed to copy to clipboard",
          },
          "*"
        );
      } finally {
        // Clean up
        document.body.removeChild(textarea);
      }
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
    height: 350px;
    border: none;
    z-index: 999999;
    background: white;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  `;

  document.body.appendChild(extensionFrame);

  // Add padding to body to prevent content from being hidden
  const originalBodyPadding = window.getComputedStyle(
    document.body
  ).paddingBottom;
  document.body.style.paddingBottom = "350px";

  // Store original padding to restore it when extension is closed
  extensionFrame.dataset.originalPadding = originalBodyPadding;
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "OPEN_TRACKER") {
    initializeExtensionFrame();
  }
});
