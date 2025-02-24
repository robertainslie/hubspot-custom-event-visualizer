# App.vue
<template>
  <v-app>
    <v-container fluid class="pa-0">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          Event Tracker
          <v-btn icon @click="close">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <!-- Event Selection Section -->
          <div class="mb-4">
            <v-text-field
              v-model="eventName"
              label="Event Name"
              placeholder="Enter event name"
              outlined
              dense
            ></v-text-field>

            <div v-if="selectedElement" class="mt-2">
              <div class="text-subtitle-1">Event Element:</div>
              <code>{{ selectedElement }}</code>
            </div>
          </div>

          <!-- Property Mapping Section -->
          <div class="mb-4">
            <v-list v-if="properties.length > 0" class="mb-2">
              <v-subheader>Mapped Properties</v-subheader>
              <v-list-item v-for="(prop, index) in properties" :key="index">
                <v-list-item-content>
                  <v-list-item-title>{{ prop.name }}</v-list-item-title>
                  <v-list-item-subtitle>
                    Value: {{ prop.value }}
                    <br />
                    Selector: <code>{{ prop.selector }}</code>
                  </v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                  <v-btn icon small @click="removeProperty(index)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </v-list-item-action>
              </v-list-item>
            </v-list>

            <v-btn
              color="primary"
              @click="propertyDialog = true"
              :disabled="!selectedElement"
              class="mb-4"
            >
              Add Property Mapping
            </v-btn>

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
          </div>

          <!-- Generated Script Section -->
          <v-card v-if="generatedScript" outlined>
            <v-card-text>
              <pre><code>{{ generatedScript }}</code></pre>
            </v-card-text>
            <v-card-actions>
              <v-btn color="primary" @click="copyScript"> Copy Script </v-btn>
            </v-card-actions>
          </v-card>
        </v-card-text>
      </v-card>
    </v-container>
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
