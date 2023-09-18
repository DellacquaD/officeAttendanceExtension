import React, { useState, useEffect } from "react";
import { startOfMonth } from "date-fns/fp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import { format } from "date-fns";

const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const days = ["D", "L", "M", "M", "J", "V", "S"];

function Calendar({ styles }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [nextMonth, setNextMonth] = useState(new Date().getMonth() + 2);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [changeMonth, setChangeMonth] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [localSelectedDates, setLocalSelectedDates] = useState([]);
  const [selectedCount, setSelectedCount] = useState(0);

  const updateSelectedCount = (count) => {
    setSelectedCount(count);
  };

  const today = format(new Date(currentDate), "yyyy/MM/dd");

  useEffect(() => {
    // Se conecta al background.js para obtener los datos iniciales
    const port = chrome.runtime.connect({ name: "calendarPort" });
    port.onMessage.addListener((message) => {
      if (message.action === "initialData") {
        const selectedDates = message.selectedDates || [];
        setLocalSelectedDates(selectedDates); // Actualiza la copia local
        setSelectedDates(selectedDates); // Actualiza el estado
      }
    });
  }, []);

  const handleSelectDate = (day) => {
    const selectedDateFormatted = format(
      new Date(currentYear, currentMonth - 1, day),
      "yyyy/MM/dd"
    );
  
    let updatedDates = [...selectedDates];

    // Si la fecha ya está seleccionada, la eliminamos de la lista
    if (selectedDates.includes(selectedDateFormatted)) {
      updatedDates = selectedDates.filter(
        (date) => date !== selectedDateFormatted
      );

      // Envía el mensaje al script de fondo para eliminar la fecha
      chrome.runtime.sendMessage({
        action: "removeDate",
        date: selectedDateFormatted,
      });
    } else {
      // Si la fecha no está seleccionada, la agregamos a la lista
      updatedDates.push(selectedDateFormatted);

      // Envía el mensaje al script de fondo para agregar la fecha
      chrome.runtime.sendMessage({
        action: "addDate",
        date: selectedDateFormatted,
      });
    }

    // Actualiza el estado local con las fechas actualizadas
    setSelectedDates(updatedDates);

    // Actualiza el contador de días seleccionados
    setSelectedCount(updatedDates.length);
  };

  const getDaysInAMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  const getStartOfMonth = (year, month) => {
    const date = new Date(`${year}/${month}/1`);
    const startDate = startOfMonth(date);
    return startDate.getDay();
  };

  const followingMonth = () => {
    if (currentMonth < 12 && nextMonth < 12) {
      setCurrentMonth((prev) => prev + 1);
      setNextMonth((prev) => prev + 1);
    } else {
      setCurrentMonth(1);
      setNextMonth(2);
      setCurrentYear((prev) => prev + 1);
    }
    toggleAnimation();
  };

  const prevMonth = () => {
    if (currentMonth > 1 && nextMonth > 1) {
      setCurrentMonth((prev) => prev - 1);
      setNextMonth((prev) => prev - 1);
    } else {
      setCurrentMonth(11);
      setNextMonth(12);
      setCurrentYear((prev) => prev - 1);
    }
    toggleAnimation();
  };

  const completeCalendar = (month, year) => {
    return 42 - getStartOfMonth(year, month) - getDaysInAMonth(year, month);
  };

  const toggleAnimation = () => {
    setChangeMonth(!changeMonth);
  };

  
  return (
    <div className={styles.calendarLayout}>
      <div className={styles.calendarDetails}>
        <button
          onClick={prevMonth}
          className={styles.changeMonthButton + " " + styles.left}
        >
          <FontAwesomeIcon icon={faChevronLeft}></FontAwesomeIcon>
        </button>





        <div className={styles.gridFirstMonth}>
          <div className={styles.month}>
            <h4>
              {months[currentMonth - 1]} {currentYear}
            </h4>
          </div>
          {days.map((day, i) => (
            <p key={i} className={styles.weekDays}>
              {day}
            </p>
          ))}
          {Array.from({
            length: getStartOfMonth(currentYear, currentMonth),
          }).map((_, i) => (
            <p key={i}></p>
          ))}
          {Array.from({
            length: getDaysInAMonth(currentYear, currentMonth),
          }).map((_, i) => (
            <p
              className={`${styles.dayOfMonth} ${
                format(
                  new Date(currentYear, currentMonth - 1, i + 1),
                  "yyyy/MM/dd"
                ) === today
                  ? styles.currentDay
                  : ""
              } ${
                selectedDates.includes(
                  format(new Date(currentYear, currentMonth - 1, i + 1), "yyyy/MM/dd")
                )
                  ? styles.assisted
                  : ""
              }`}
              onClick={() => handleSelectDate(i + 1)}
              key={i}
            >
              {i + 1}
            </p>
          ))}
          {Array.from({
            length: completeCalendar(currentMonth, currentYear),
          }).map((_, i) => (
            <p key={i} className={styles.dayOfOtherMonth}>
              {i + 1}
            </p>
          ))}
        </div>
        <button
          className={styles.changeMonthButton + " " + styles.right}
          onClick={followingMonth}
        >
          <FontAwesomeIcon icon={faChevronRight}></FontAwesomeIcon>
        </button>
      </div>
    </div>
  );
}

export default Calendar;
