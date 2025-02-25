<template>
  <v-app style="height: 400px; overflow: hidden">
    <v-card class="fill-height">
      <!-- Header with HubSpot Orange Background -->
      <div
        class="d-flex justify-space-between align-center px-4 py-2"
        style="background-color: #ff7a59; color: white"
      >
        <span class="text-h5">HubSpot Custom Event Visualization Tracker</span>
        <v-btn
          icon="mdi-close"
          size="small"
          variant="text"
          color="white"
          @click="close"
        ></v-btn>
      </div>

      <v-divider></v-divider>

      <!-- Vuetify Stepper with Auto-Highlighting -->
      <div class="px-4 pt-2">
        <v-stepper v-model="currentStep" class="elevation-0">
          <v-stepper-header class="elevation-0">
            <v-stepper-item
              step="1"
              :complete="!!selectedElement"
              :rules="[() => !!selectedElement]"
              class="step-item"
              :class="{ 'current-step': currentStep === 1 }"
            >
              <span>1. Hover & Click to Select an Element to Click Track</span>
            </v-stepper-item>

            <v-divider></v-divider>

            <v-stepper-item
              step="2"
              :complete="isEventNameValid"
              :rules="[() => isEventNameValid]"
              class="step-item"
              :class="{ 'current-step': currentStep === 2 }"
            >
              <span>2. Add HubSpot Internal Event Name</span>
            </v-stepper-item>

            <v-divider></v-divider>

            <v-stepper-item
              step="3"
              :complete="properties.length > 0"
              :rules="[() => properties.length > 0]"
              class="step-item"
              :class="{ 'current-step': currentStep === 3 }"
            >
              <div>
                <span
                  >3. Add Event Property Names Then Click Elements to Capture
                  Values</span
                >
                <div v-if="selectedElement" class="text-caption">
                  when Element: <code>{{ selectedElementShort }}</code> is
                  clicked
                </div>
              </div>
            </v-stepper-item>

            <v-divider></v-divider>

            <v-stepper-item
              step="4"
              :complete="!!generatedScript"
              :rules="[() => !!generatedScript]"
              class="step-item"
              :class="{ 'current-step': currentStep === 4 }"
            >
              <span>4. Copy Script & Paste in HubSpot Custom JS Event</span>
            </v-stepper-item>
          </v-stepper-header>
        </v-stepper>
      </div>

      <!-- Scrollable Content Area with Fixed Height -->
      <div class="columns-container">
        <!-- Left Column -->
        <div class="column left-column">
          <div class="pa-4">
            <!-- Current Step Indicator -->
            <div class="mb-3 step-indicator">
              <v-chip
                color="#FF7A59"
                text-color="white"
                class="font-weight-medium"
                >Step {{ currentStep }}: {{ currentStepTitle }}</v-chip
              >
            </div>

            <!-- Selected Element Preview -->
            <div v-if="selectedElement" class="mb-4">
              <div class="d-flex align-center justify-space-between">
                <div class="text-subtitle-2">Selected Element:</div>
                <v-btn
                  color="#FF7A59"
                  text
                  small
                  @click="highlightElement"
                  v-if="selectedElement"
                >
                  Highlight Selected Element
                </v-btn>
              </div>
              <v-card outlined class="mt-1 pa-2">
                <code class="text-body-2">{{ selectedElement }}</code>
              </v-card>
            </div>
            <div v-else class="mb-4 element-instruction">
              <v-alert
                type="info"
                density="compact"
                variant="tonal"
                color="#FF7A59"
              >
                Hover over elements on the page and click to select one for
                tracking
              </v-alert>
            </div>

            <!-- Event Configuration -->
            <div class="mb-4">
              <v-text-field
                v-model="eventName"
                label="HubSpot Custom Event Name"
                placeholder="e.g., pe123456_cart_interaction "
                outlined
                dense
                :rules="[eventNameRule]"
                :hint="eventNameHint"
                persistent-hint
                :disabled="!selectedElement"
                @input="checkAndAdvanceStep"
              ></v-text-field>
            </div>

            <!-- Property Configuration -->
            <div>
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="text-subtitle-1">Properties</div>
                <v-btn
                  color="#FF7A59"
                  @click="propertyDialog = true"
                  :disabled="!selectedElement || !isEventNameValid"
                  small
                >
                  Add Property
                </v-btn>
              </div>

              <v-table
                v-if="properties.length > 0"
                class="property-table"
                density="compact"
              >
                <thead>
                  <tr>
                    <th>Property Name</th>
                    <th>Sample Value</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(prop, index) in properties" :key="index">
                    <td class="property-name">{{ prop.name }}</td>
                    <td class="property-value">
                      <div class="text-truncate">{{ prop.value }}</div>
                      <div class="text-caption text-grey">
                        <code>{{ getShortenedSelector(prop.selector) }}</code>
                      </div>
                    </td>
                    <td class="property-actions">
                      <v-btn
                        icon
                        density="comfortable"
                        size="small"
                        variant="text"
                        color="#FF7A59"
                        @click="highlightPropertyElement(prop.selector)"
                        class="mr-1"
                      >
                        <v-icon>mdi-eye</v-icon>
                      </v-btn>
                      <v-btn
                        icon
                        density="comfortable"
                        size="small"
                        variant="text"
                        color="error"
                        @click="removeProperty(index)"
                      >
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>

              <div v-else class="text-body-2 text-grey">
                {{
                  selectedElement && isEventNameValid
                    ? "Add properties to track additional values"
                    : selectedElement
                    ? "Enter an event name first to add properties"
                    : "Select an element first"
                }}
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="column right-column">
          <div class="pa-4">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="text-subtitle-1">Generated Script</div>
              <div>
                <v-btn
                  v-if="generatedScript"
                  color="#FF7A59"
                  small
                  text
                  class="mr-2"
                  @click="formatScript"
                >
                  {{ isScriptFormatted ? "Unformat" : "Format" }}
                </v-btn>
                <v-btn
                  v-if="generatedScript"
                  color="#FF7A59"
                  small
                  text
                  @click="copyScript"
                >
                  Copy Script
                </v-btn>
              </div>
            </div>
            <v-card outlined :color="'#213343'" class="script-card">
              <v-card-text class="pa-2" :style="{ color: 'white' }">
                <div v-if="generatedScript">
                  <pre
                    class="mb-0"
                  ><code style="color: white">{{ formattedScript }}</code></pre>
                </div>
                <div v-else class="text-body-2 text-grey text-center py-4">
                  {{ getScriptPlaceholderText }}
                </div>
              </v-card-text>
              <v-divider v-if="generatedScript"></v-divider>
              <v-card-actions v-if="generatedScript" class="pa-2">
                <v-spacer></v-spacer>
                <v-btn
                  color="#FF7A59"
                  text-color="white"
                  small
                  :style="{ backgroundColor: '#FF7A59' }"
                  @click="copyScript"
                >
                  Copy Script to Clipboard
                </v-btn>
              </v-card-actions>
            </v-card>

            <!-- Instructions for current step -->
            <v-card
              v-if="currentStepInstructions"
              class="mt-4"
              variant="outlined"
            >
              <v-card-title class="text-subtitle-1">
                <v-icon class="mr-2" color="#FF7A59"
                  >mdi-information-outline</v-icon
                >
                {{ currentStepTitle }}
              </v-card-title>
              <v-card-text class="text-body-2">
                {{ currentStepInstructions }}
              </v-card-text>
            </v-card>
          </div>
        </div>
      </div>

      <!-- Property Dialog -->
      <v-dialog v-model="propertyDialog" max-width="500px">
        <v-card>
          <v-card-title style="background-color: #ff7a59; color: white">
            Add Custom Event Internal Property Name
          </v-card-title>
          <v-card-text class="pt-4">
            <v-text-field
              v-model="newPropertyName"
              label="Custom Event Property Name"
              :rules="[propertyNameRule]"
              @keyup.enter="startPropertyMapping"
              placeholder="e.g., product_name"
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="closePropertyDialog">Cancel</v-btn>
            <v-btn
              color="#FF7A59"
              text-color="white"
              @click="startPropertyMapping"
              :disabled="!isPropertyNameValid"
            >
              Select Element
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";

// State
const eventName = ref("");
const selectedElement = ref(null);
const properties = ref([]);
const propertyDialog = ref(false);
const newPropertyName = ref("");
const showGuidance = ref(true);
const currentStep = ref(1);
const isScriptFormatted = ref(false);

// Validation rules
const eventNameRule = (value) => {
  if (!value) return "Event name is required";
  if (!/^[a-z0-9_]+$/.test(value))
    return "Use only lowercase letters, numbers, and underscores";
  return true;
};

const propertyNameRule = (value) => {
  if (!value) return "Property name is required";
  if (!/^[a-z0-9_]+$/.test(value))
    return "Use only lowercase letters, numbers, and underscores";
  if (properties.value.some((p) => p.name === value))
    return "Property name must be unique";
  return true;
};

// Computed
const isEventNameValid = computed(
  () => eventNameRule(eventName.value) === true
);
const isPropertyNameValid = computed(
  () => propertyNameRule(newPropertyName.value) === true
);

const eventNameHint = computed(() => {
  if (!selectedElement.value) return "Select an element first";
  if (!eventName.value) return "Enter an event name";
  return eventNameRule(eventName.value) === true
    ? ""
    : eventNameRule(eventName.value);
});

const generatedScript = computed(() => {
  if (!selectedElement.value || !isEventNameValid.value) return "";

  const propertiesObj = properties.value.reduce((acc, prop) => {
    acc[
      prop.name
    ] = `document.querySelector('${prop.selector}').textContent.trim()`;
    return acc;
  }, {});

  const propertiesString = Object.entries(propertiesObj)
    .map(([key, value]) => `    "${key}": ${value}`)
    .join(",\n");

  return `document.querySelector('${selectedElement.value}').addEventListener('click', function() {
  _hsq.push(['trackCustomBehavioralEvent', {
    eventName: '${eventName.value}',
    properties: {
${propertiesString}
    }
  }]);
});`;
});

const formattedScript = computed(() => {
  if (!generatedScript.value) return "";
  return isScriptFormatted.value
    ? formatJavaScript(generatedScript.value)
    : generatedScript.value;
});

const getScriptPlaceholderText = computed(() => {
  if (!selectedElement.value) return "Select an element to track";
  if (!isEventNameValid.value) return "Enter a valid event name";
  if (properties.value.length === 0)
    return "Add properties to enhance your tracking";
  return "Your script will appear here";
});

const selectedElementShort = computed(() => {
  if (!selectedElement.value) return "";
  // Get shortened version of the selector for display in step 3
  return selectedElement.value.length > 40
    ? selectedElement.value.substring(0, 37) + "..."
    : selectedElement.value;
});

// Helper function to shorten selectors for display
const getShortenedSelector = (selector) => {
  if (!selector) return "";
  return selector.length > 30 ? selector.substring(0, 27) + "..." : selector;
};

const currentStepTitle = computed(() => {
  switch (currentStep.value) {
    case 1:
      return "Select Element";
    case 2:
      return "Add Event Name";
    case 3:
      return "Add Properties";
    case 4:
      return "Copy Script";
    default:
      return "";
  }
});

const currentStepInstructions = computed(() => {
  switch (currentStep.value) {
    case 1:
      return "Hover over elements on the webpage and click on the one you want to track. The element will be highlighted with an orange outline as you hover.";
    case 2:
      return "Enter a name for this tracking event. Use only lowercase letters, numbers, and underscores. This will be the event name in HubSpot analytics.";
    case 3:
      return "Add properties to capture additional information when the tracked element is clicked. Properties can be values from other elements on the page.";
    case 4:
      return "Your script is ready! Copy it to your clipboard and paste it into a HubSpot Custom HTML or JavaScript section.";
    default:
      return "";
  }
});

// Methods
const formatJavaScript = (code) => {
  // Simple formatter - you could use a library like prettier if needed
  return code
    .split("\n")
    .map((line) => line.trim())
    .join("\n");
};

const formatScript = () => {
  isScriptFormatted.value = !isScriptFormatted.value;
};

const highlightElement = () => {
  window.parent.postMessage(
    {
      type: "HIGHLIGHT_ELEMENT",
      selector: selectedElement.value,
    },
    "*"
  );
};

const highlightPropertyElement = (selector) => {
  window.parent.postMessage(
    {
      type: "HIGHLIGHT_ELEMENT",
      selector,
    },
    "*"
  );
};

const close = () => {
  window.parent.postMessage(
    {
      type: "TOGGLE_TRACKER",
      active: false,
    },
    "*"
  );
};

const closePropertyDialog = () => {
  propertyDialog.value = false;
  newPropertyName.value = "";
};

const startPropertyMapping = () => {
  if (isPropertyNameValid.value) {
    propertyDialog.value = false;
    window.parent.postMessage(
      {
        type: "START_PROPERTY_MAPPING",
        propertyName: newPropertyName.value,
      },
      "*"
    );
  }
};

const removeProperty = (index) => {
  properties.value.splice(index, 1);
  updateCurrentStep();
};

const copyScript = () => {
  window.parent.postMessage(
    {
      type: "COPY_TO_CLIPBOARD",
      text: generatedScript.value,
    },
    "*"
  );
};

const checkAndAdvanceStep = () => {
  // Check if the current field is valid and automatically advance to the next step
  if (currentStep.value === 1 && selectedElement.value) {
    currentStep.value = 2;
  } else if (currentStep.value === 2 && isEventNameValid.value) {
    currentStep.value = 3;
  }

  updateCurrentStep();
};

// Message handling
onMounted(() => {
  const handleMessage = (event) => {
    if (event.data.type === "ELEMENT_SELECTED") {
      selectedElement.value = event.data.selector;
      updateCurrentStep();

      // Automatically advance to the next step when element is selected
      if (currentStep.value === 1) {
        setTimeout(() => {
          currentStep.value = 2;
        }, 500);
      }
    } else if (event.data.type === "PROPERTY_VALUE") {
      properties.value.push({
        name: newPropertyName.value,
        value: event.data.value,
        selector: event.data.selector,
      });
      newPropertyName.value = "";
      updateCurrentStep();
    } else if (event.data.type === "COPY_COMPLETE") {
      if (event.data.success) {
        alert("Script copied to clipboard!");
        currentStep.value = 4;
      }
    }
  };

  window.addEventListener("message", handleMessage);

  // Notify parent that tracker is ready
  window.parent.postMessage(
    {
      type: "TOGGLE_TRACKER",
      active: true,
    },
    "*"
  );

  // Cleanup
  return () => {
    window.removeEventListener("message", handleMessage);
  };
});

// Step handling
const updateCurrentStep = () => {
  if (!selectedElement.value) {
    currentStep.value = 1;
  } else if (!isEventNameValid.value) {
    currentStep.value = 2;
  } else if (properties.value.length === 0) {
    currentStep.value = 3;
  } else {
    currentStep.value = 4;
  }
};

// Watch for step changes
watch(eventName, () => updateCurrentStep());
</script>

<style>
html,
body {
  overflow: hidden !important;
  height: 100%;
}
</style>

<style scoped>
/* Fixed height container for Chrome extension iframe */
.v-application {
  overflow: hidden;
}

/* Column layout with fixed height and independent scrolling */
.columns-container {
  display: flex;
  height: 235px; /* Fixed height for the content area */
  overflow: hidden;
}

.column {
  width: 50%;
  height: 100%;
  overflow-y: auto; /* Each column scrolls independently */
  overflow-x: hidden;
}

.left-column {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

/* Custom scrollbar for better UX */
.column::-webkit-scrollbar {
  width: 6px;
}

.column::-webkit-scrollbar-track {
  background-color: #f1f1f1;
}

.column::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 3px;
}

.column::-webkit-scrollbar-thumb:hover {
  background-color: #aaa;
}

/* Script card */
.script-card {
  background-color: #213343;
}

.script-card code {
  color: white;
}

/* Property table */
.property-table {
  border: none !important;
}

.property-name {
  font-weight: 500;
  white-space: nowrap;
}

.property-value {
  max-width: 200px;
  overflow: hidden;
}

.property-actions {
  white-space: nowrap;
  width: 90px;
}

pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

code {
  font-family: monospace;
  font-size: 0.9em;
}

:deep(.v-stepper) {
  box-shadow: none !important;
  background: transparent !important;
}

:deep(.v-stepper-header) {
  box-shadow: none !important;
  height: auto !important;
  padding: 8px 0 !important;
}

:deep(.v-stepper-item) {
  font-size: 0.875rem !important;
}

/* Highlight current step */
.current-step {
  background-color: rgba(255, 122, 89, 0.1) !important;
  border-radius: 4px !important;
  font-weight: 600 !important;
}

.current-step :deep(.v-stepper-item__label) {
  color: #ff7a59 !important;
}

.step-indicator {
  margin-bottom: 16px;
}

.element-instruction {
  border-left: 4px solid #ff7a59;
  padding-left: 12px;
}
</style>
