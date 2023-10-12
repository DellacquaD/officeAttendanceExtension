let selectedDates = []; // Cambiar de objeto a array
let daysCommunicated = {}; //
let calendarPort; // Declara el puerto fuera de las funciones
let currentYearMonthKey = "";

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.local.get(["selectedDates"], function (result) {
    selectedDates = result.selectedDates || [];
  });
  chrome.storage.local.get(["daysCommunicated"], function (result) {
    daysCommunicated = result.daysCommunicated || {};
  });
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "calendarPort") {
    calendarPort = port; // Asigna el puerto a la variable global

    chrome.storage.local.get(["selectedDates", "daysCommunicated"], function (result) {
      const selectedDates = result.selectedDates || [];
      const daysCommunicated = result.daysCommunicated || {};
      calendarPort.postMessage({ action: "initialData", selectedDates, daysCommunicated });
    });
  }
});


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
  if (request.action === "updateDates") {
    const updatedDates = request.dates;

    // Actualiza el almacenamiento local con las fechas actualizadas
    chrome.storage.local.set({ selectedDates: updatedDates }, function () {
      console.log("Dates updated in local storage:", updatedDates);
    });

    // Envía un mensaje a los componentes React para informarles sobre el cambio
    informComponentsAboutChange(updatedDates);
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "updateDaysCommunicated") {
    const updatedDaysCommunicated = request.data;
    console.log("Datos que se van a guardar:", updatedDaysCommunicated);
    chrome.storage.local.set({ daysCommunicated: updatedDaysCommunicated }, function () {
      console.log("Datos guardados en el almacenamiento local:", updatedDaysCommunicated);
    });

    // Guarda el objeto directamente en el almacenamiento local
    chrome.storage.local.set({ daysCommunicated: updatedDaysCommunicated }, function () {
      console.log("El objeto se guardó de la siguiente manera:", updatedDaysCommunicated);
    });
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "getDaysCommunicated") {
    // Obtén los datos del almacenamiento local
    chrome.storage.local.get({ daysCommunicated: {} }, function (result) {
      const daysCommunicatedObject = result.daysCommunicated;
      console.log("Datos cargados desde el almacenamiento local:", daysCommunicatedObject);

      // Envía los datos a tu componente de React
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "setDaysCommunicated",
          data: daysCommunicatedObject,
        });
      });
    });
  }
});



// Función para agregar una fecha seleccionada en el almacenamiento local y en el array
function addSelectedDate(date) {
  const updatedDates = [...selectedDates]; // Copia el array de fechas seleccionadas
  updatedDates.push(date);

  // Actualiza el almacenamiento local con las fechas actualizadas
  chrome.storage.local.set({ selectedDates: updatedDates }, function () {
    console.log("Date added to local storage:", date);
  });

  // Actualiza el array de fechas seleccionadas
  selectedDates = updatedDates;

  // Envía un mensaje a los componentes React para informarles sobre el cambio
  informComponentsAboutChange(updatedDates);
}

// Función para quitar una fecha seleccionada del almacenamiento local y del array
function removeSelectedDate(date) {
  const updatedDates = [...selectedDates]; // Copia el array de fechas seleccionadas
  const index = updatedDates.indexOf(date);

  if (index !== -1) {
    updatedDates.splice(index, 1);

    // Actualiza el almacenamiento local con las fechas actualizadas
    chrome.storage.local.set({ selectedDates: updatedDates }, function () {
      console.log("Date removed from local storage:", date);
    });

    // Actualiza el array de fechas seleccionadas
    selectedDates = updatedDates;

    // Envía un mensaje a los componentes React para informarles sobre el cambio
    informComponentsAboutChange(updatedDates);
  }
}

// Función para informar a los componentes React sobre el cambio en las fechas seleccionadas
function informComponentsAboutChange(selectedDates) {
  if (calendarPort) {
    // Verifica si el puerto existe antes de enviar el mensaje
    calendarPort.postMessage({ action: "updateDates", selectedDates });
  }
}
