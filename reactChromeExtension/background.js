let localSelectedDates = []; // Variable para almacenar una copia local de las fechas

// Cargar fechas almacenadas en el almacenamiento local al iniciar la extensión
chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.local.get(["selectedDates"], function (result) {
    localSelectedDates = result.selectedDates || [];
    // Aquí puedes realizar alguna acción con las fechas cargadas, si es necesario
    // Por ejemplo, podrías enviar un mensaje a tus componentes React para informarles sobre las fechas iniciales cargadas.
  });
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "calendarPort") {
    chrome.storage.local.get(["selectedDates"], function (result) {
      const selectedDates = result.selectedDates || [];
      port.postMessage({ action: "initialData", selectedDates });
    });
  }
});

// Escucha los mensajes enviados desde tu componente Calendar
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "addDate") {
    addSelectedDate(request.date);
    sendResponse({ message: "Date added successfully" });
  } else if (request.action === "removeDate") {
    removeSelectedDate(request.date);
    sendResponse({ message: "Date removed successfully" });
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "getSelectedDaysForMonth") {
    const { year, month } = request;
    getSelectedDaysForMonth(year, month);
  }
});

// Función para agregar una fecha seleccionada en el almacenamiento local y en la copia local
function addSelectedDate(date) {
  chrome.storage.local.get(["selectedDates"], function (result) {
    const selectedDates = result.selectedDates || [];
    selectedDates.push(date);
    chrome.storage.local.set({ selectedDates: selectedDates }, function () {
      console.log("Date added to local storage:", date);
    });

    // Actualiza la copia local
    localSelectedDates = selectedDates;

    // Envía un mensaje a los componentes React para informarles sobre el cambio
    informComponentsAboutChange(selectedDates);
  });
}

// Función para quitar una fecha seleccionada del almacenamiento local y de la copia local
function removeSelectedDate(date) {
  chrome.storage.local.get(["selectedDates"], function (result) {
    const selectedDates = result.selectedDates || [];

    if (selectedDates.length === 0) {
      console.log("El almacenamiento local está vacío. No hay fechas para eliminar.");
      return;
    }

    const index = selectedDates.indexOf(date);
    if (index !== -1) {
      selectedDates.splice(index, 1);
      chrome.storage.local.set({ selectedDates: selectedDates }, function () {
        console.log("Date removed from local storage:", date);
      });

      // Actualiza la copia local
      localSelectedDates = selectedDates;

      // Envía un mensaje a los componentes React para informarles sobre el cambio
      informComponentsAboutChange(selectedDates);
    }
  });
}

// Función para informar a los componentes React sobre el cambio en las fechas seleccionadas
function informComponentsAboutChange(selectedDates) {
  const port = chrome.runtime.connect({ name: "calendarPort" });
  port.postMessage({ action: "updateDates", selectedDates });
}
