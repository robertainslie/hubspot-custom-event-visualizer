<template>
  <v-app style="height: 300px">
    <v-card class="fill-height">
      <!-- Fixed Header -->
      <v-card-title class="d-flex justify-space-between py-2">
        Event Tracker
        <v-btn icon @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <!-- Scrollable Content Area -->
      <div style="height: calc(300px - 49px); display: flex">
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
                placeholder="Enter event name"
                outlined
                dense
              ></v-text-field>

              <div v-if="selectedElement" class="mt-2">
                <div class="text-subtitle-2">Event Element:</div>
                <code class="text-body-2">{{ selectedElement }}</code>
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
                    <v-list-item-title class="text-subtitle-2">
                      {{ prop.name }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="text-caption">
                      Value: {{ prop.value }}
                      <br />
                      Selector: <code>{{ prop.selector }}</code>
                    </v-list-item-subtitle>
                  </v-list-item-content>
                  <v-list-item-action>
                    <v-btn icon x-small @click="removeProperty(index)">
                      <v-icon small>mdi-delete</v-icon>
                    </v-btn>
                  </v-list-item-action>
                </v-list-item>
              </v-list>

              <div v-else class="text-body-2 text-grey">
                No properties added yet
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div style="width: 50%; height: 100%; overflow-y: auto">
          <div class="pa-4">
            <div class="text-subtitle-1 mb-2">Generated Script</div>
            <v-card
              outlined
              :color="generatedScript ? 'grey lighten-4' : 'grey lighten-3'"
            >
              <v-card-text class="pa-2">
                <div v-if="generatedScript">
                  <pre class="mb-0"><code>{{ generatedScript }}</code></pre>
                </div>
                <div v-else class="text-body-2 text-grey text-center py-4">
                  Select an element and add an event name to generate the script
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
              @keyup.enter="startPropertyMapping"
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="closePropertyDialog">Cancel</v-btn>
            <v-btn
              color="primary"
              text
              @click="startPropertyMapping"
              :disabled="!newPropertyName"
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
import { ref, computed, onMounted } from "vue";

// State
const eventName = ref("");
const selectedElement = ref(null);
const properties = ref([]);
const propertyDialog = ref(false);
const newPropertyName = ref("");

// Computed
const generatedScript = computed(() => {
  if (!selectedElement.value || !eventName.value) return "";

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

// Methods
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
  if (newPropertyName.value) {
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
  navigator.clipboard
    .writeText(generatedScript.value)
    .then(() => alert("Script copied to clipboard!"))
    .catch((err) => console.error("Failed to copy script:", err));
};

// Message handling
onMounted(() => {
  const handleMessage = (event) => {
    if (event.data.type === "ELEMENT_SELECTED") {
      selectedElement.value = event.data.selector;
    } else if (event.data.type === "PROPERTY_VALUE") {
      properties.value.push({
        name: newPropertyName.value,
        value: event.data.value,
        selector: event.data.selector,
      });
      newPropertyName.value = "";
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
</style>
