<template>
  <v-app style="height: 350px">
    <v-card class="fill-height">
      <!-- Compact Header -->
      <div class="d-flex justify-space-between align-center px-4 py-1">
        <span class="text-subtitle-2">Event Tracker</span>
        <v-btn
          icon="mdi-close"
          size="small"
          variant="text"
          @click="close"
        ></v-btn>
      </div>

      <v-divider></v-divider>

      <!-- Vuetify Stepper -->
      <div class="px-4 pt-1">
        <v-stepper v-model="currentStep" class="elevation-0">
          <v-stepper-header class="elevation-0">
            <v-stepper-item
              step="1"
              :complete="isEventNameValid"
              :rules="[() => isEventNameValid]"
            >
              Event Name
            </v-stepper-item>

            <v-divider></v-divider>

            <v-stepper-item
              step="2"
              :complete="!!selectedElement"
              :rules="[() => !!selectedElement]"
            >
              Select Element
            </v-stepper-item>

            <v-divider></v-divider>

            <v-stepper-item
              step="3"
              :complete="properties.length > 0"
              :rules="[() => properties.length > 0]"
            >
              Add Properties
            </v-stepper-item>

            <v-divider></v-divider>

            <v-stepper-item
              step="4"
              :complete="!!generatedScript"
              :rules="[() => !!generatedScript]"
            >
              Copy Script
            </v-stepper-item>
          </v-stepper-header>
        </v-stepper>
      </div>

      <!-- Scrollable Content Area -->
      <div :style="{ height: contentHeight, display: 'flex' }">
        <!-- Left Column -->
        <div
          style="
            width: 50%;
            height: 100%;
            overflow-y: auto;
            border-right: 1px solid rgba(0, 0, 0, 0.12);
          "
        >
          <div class="pa-4">
            <!-- Event Configuration -->
            <div class="mb-4">
              <v-text-field
                v-model="eventName"
                label="Event Name"
                placeholder="e.g., button_click"
                outlined
                dense
                :rules="[eventNameRule]"
                :hint="eventNameHint"
                persistent-hint
              ></v-text-field>

              <!-- Selected Element Preview -->
              <div v-if="selectedElement" class="mt-4">
                <div class="d-flex align-center justify-space-between">
                  <div class="text-subtitle-2">Selected Element:</div>
                  <v-btn
                    color="primary"
                    text
                    small
                    @click="highlightElement"
                    v-if="selectedElement"
                  >
                    Highlight
                  </v-btn>
                </div>
                <v-card outlined class="mt-1 pa-2">
                  <code class="text-body-2">{{ selectedElement }}</code>
                </v-card>
              </div>
              <div
                v-else-if="isEventNameValid"
                class="mt-2 text-caption text-grey"
              >
                Hover over and click an element to track
              </div>
            </div>

            <!-- Property Configuration -->
            <div>
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="text-subtitle-1">Properties</div>
                <v-btn
                  color="primary"
                  @click="propertyDialog = true"
                  :disabled="!selectedElement"
                  small
                >
                  Add Property
                </v-btn>
              </div>

              <v-list dense v-if="properties.length > 0" class="property-list">
                <v-list-item v-for="(prop, index) in properties" :key="index">
                  <v-list-item-content>
                    <v-list-item-title
                      class="text-subtitle-2 d-flex align-center"
                    >
                      {{ prop.name }}
                      <v-btn
                        icon
                        x-small
                        @click="highlightPropertyElement(prop.selector)"
                        class="ms-2"
                      >
                        <v-icon small>mdi-eye</v-icon>
                      </v-btn>
                    </v-list-item-title>
                    <v-list-item-subtitle class="text-caption">
                      Value: {{ prop.value }}
                      <br />
                      Selector: <code>{{ prop.selector }}</code>
                    </v-list-item-subtitle>
                  </v-list-item-content>
                  <v-list-item-action>
                    <v-btn
                      icon
                      x-small
                      @click="removeProperty(index)"
                      color="error"
                    >
                      <v-icon small>mdi-delete</v-icon>
                    </v-btn>
                  </v-list-item-action>
                </v-list-item>
              </v-list>

              <div v-else class="text-body-2 text-grey">
                {{
                  selectedElement
                    ? "Add properties to track additional values"
                    : "Select an element first to add properties"
                }}
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div style="width: 50%; height: 100%; overflow-y: auto">
          <div class="pa-4">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="text-subtitle-1">Generated Script</div>
              <v-btn
                v-if="generatedScript"
                color="primary"
                small
                text
                @click="formatScript"
              >
                Format
              </v-btn>
            </div>
            <v-card
              outlined
              :color="generatedScript ? 'grey lighten-4' : 'grey lighten-3'"
            >
              <v-card-text class="pa-2">
                <div v-if="generatedScript">
                  <pre class="mb-0"><code>{{ formattedScript }}</code></pre>
                </div>
                <div v-else class="text-body-2 text-grey text-center py-4">
                  {{ getScriptPlaceholderText }}
                </div>
              </v-card-text>
              <v-divider v-if="generatedScript"></v-divider>
              <v-card-actions v-if="generatedScript" class="pa-2">
                <v-spacer></v-spacer>
                <v-btn color="primary" small @click="copyScript">
                  Copy Script
                </v-btn>
              </v-card-actions>
            </v-card>
          </div>
        </div>
      </div>

      <!-- Property Dialog -->
      <v-dialog v-model="propertyDialog" max-width="500px">
        <v-card>
          <v-card-title>Add Property</v-card-title>
          <v-card-text>
            <v-text-field
              v-model="newPropertyName"
              label="Property Name"
              :rules="[propertyNameRule]"
              @keyup.enter="startPropertyMapping"
              placeholder="e.g., button_text"
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="closePropertyDialog">Cancel</v-btn>
            <v-btn
              color="primary"
              text
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
  if (!eventName.value) return "Start by entering an event name";
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
  _hsq.push(['trackCustomEvent', {
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

const contentHeight = computed(() => {
  const baseHeight = "300px";
  const headerHeight = "49px";
  const stepperHeight = showGuidance.value ? "72px" : "0px";
  return `calc(${baseHeight} - ${headerHeight} - ${stepperHeight})`;
});

const getScriptPlaceholderText = computed(() => {
  if (!isEventNameValid.value) return "Enter a valid event name";
  if (!selectedElement.value) return "Select an element to track";
  if (properties.value.length === 0)
    return "Add properties to enhance your tracking";
  return "Your script will appear here";
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

// Message handling
onMounted(() => {
  const handleMessage = (event) => {
    if (event.data.type === "ELEMENT_SELECTED") {
      selectedElement.value = event.data.selector;
      updateCurrentStep();
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
  if (!isEventNameValid.value) {
    currentStep.value = 1;
  } else if (!selectedElement.value) {
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
.property-list {
  border: none !important;
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
</style>
