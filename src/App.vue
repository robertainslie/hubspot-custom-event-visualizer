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
          <v-text-field
            v-model="eventName"
            label="Event Name"
            placeholder="Enter event name"
            outlined
            dense
          ></v-text-field>

          <div v-if="selectedElement" class="my-4">
            <div class="text-subtitle-1">Selected Element:</div>
            <code>{{ selectedElement }}</code>
          </div>

          <v-list v-if="properties.length > 0">
            <v-list-item v-for="(prop, index) in properties" :key="index">
              <v-list-item-content>
                <v-list-item-title
                  >{{ prop.name }}: {{ prop.value }}</v-list-item-title
                >
                <v-list-item-subtitle
                  >Selector: {{ prop.selector }}</v-list-item-subtitle
                >
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
            class="mt-4"
            @click="propertyDialog = true"
            :disabled="!selectedElement"
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
                  Start Mapping
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <v-card v-if="generatedScript" class="mt-4" outlined>
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
import { ref, computed, onMounted, watch } from "vue";

// State
const eventName = ref("");
const selectedElement = ref(null);
const properties = ref([]);
const isPropertyMapping = ref(false);
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

  return `document.querySelector('${
    selectedElement.value
  }').addEventListener('click', function() {
  _hsq.push(['trackCustomEvent', {
    eventName: '${eventName.value}',
    properties: ${JSON.stringify(propertiesObj, null, 2)}
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
    isPropertyMapping.value = true;
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

// Lifecycle hooks
onMounted(() => {
  const handleMessage = (event) => {
    if (event.data.type === "SELECTOR_PATH") {
      // Update tooltip/preview if needed
    } else if (event.data.type === "ELEMENT_SELECTED") {
      selectedElement.value = event.data.selector;
    } else if (event.data.type === "PROPERTY_VALUE") {
      properties.value.push({
        name: event.data.name,
        value: event.data.value,
        selector: event.data.selector,
      });
      isPropertyMapping.value = false;
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
