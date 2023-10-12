import React, { useState, useEffect } from "react";
import { startOfMonth } from "date-fns/fp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
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
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const today = format(new Date(currentDate), "yyyy/MM/dd");
  const [daysCommunicated, setDaysCommunicated] = useState("");
  const currentYearMonthKey = `${currentYear}/${currentMonth}`;
  const inputValue = daysCommunicated[currentYearMonthKey] || "";


  useEffect(() => {
    const port = chrome.runtime.connect({ name: "calendarPort" });
    port.onMessage.addListener(async (message) => {
      if (message.action === "initialData") {
        const selectedDatesArray = Object.values(message.selectedDates || {});
        setSelectedDates(selectedDatesArray);
        updateSelectedCount(selectedDatesArray);
      }
    });
  
    // Obtén los datos de daysCommunicated desde el almacenamiento local
    chrome.storage.local.get({ daysCommunicated: {} }, function (result) {
      const daysCommunicatedObject = result.daysCommunicated || {};
      setDaysCommunicated(daysCommunicatedObject);
  
      // Envía los datos a tu componente de React
      port.postMessage({
        action: "setDaysCommunicated",
        data: daysCommunicatedObject,
      });
    });
  }, []);
  
  useEffect(() => {
    const dateRangeStart = format(new Date(currentYear, currentMonth - 1, 1), "yyyy/MM/dd");
    const dateRangeEnd = format(new Date(currentYear, currentMonth, 0), "yyyy/MM/dd");
    const filteredDates = selectedDates.filter((date) => {
      return date >= dateRangeStart && date <= dateRangeEnd;
    });
    const selectedCount = filteredDates.length;
    setSelectedCount(selectedCount);
  }, [currentMonth, currentYear, selectedDates]);

  const updateSelectedCount = (dates) => {
    const selectedCount = dates.length;
    setSelectedCount(selectedCount);
  };

  let selectedDateFormatted = ""; // Declarar la variable fuera de handleSelectDate

  const handleSelectDate = (day) => {
    selectedDateFormatted = format(
      new Date(currentYear, currentMonth - 1, day),
      "yyyy/MM/dd"
    );
  
    let updatedDates = [...selectedDates];
  
    if (updatedDates.includes(selectedDateFormatted)) {
      // El día ya está seleccionado, quítalo del array
      updatedDates = updatedDates.filter((date) => date !== selectedDateFormatted);
    } else {
      // El día no está seleccionado, agrégalo al array
      updatedDates.push(selectedDateFormatted);
    }
  
    setSelectedDates(updatedDates);
  
    chrome.runtime.sendMessage({
      action: "updateDates",
      dates: updatedDates,
    });
  
    updateSelectedCount(updatedDates);
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
    if (currentMonth < 12) {
      setCurrentMonth((prev) => prev + 1);
    } else {
      setCurrentMonth(1);
      setCurrentYear((prev) => prev + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth > 1) {
      setCurrentMonth((prev) => prev - 1);
    } else {
      setCurrentMonth(12);
      setCurrentYear((prev) => prev - 1);
    }
  };

  const completeCalendar = (month, year) => {
    return 35 - getStartOfMonth(year, month) - getDaysInAMonth(year, month);
  };


  const handleSaveDays = () => {
    const updatedDaysCommunicated = { ...daysCommunicated };
    chrome.runtime.sendMessage({
      action: "updateDaysCommunicated",
      data: updatedDaysCommunicated,
    });
  };

  const handleInputChange = (e) => {
    const { value } = e.target;
    setDaysCommunicated((prevDaysCommunicated) => ({
      ...prevDaysCommunicated,
      [currentYearMonthKey]: value,
    }));
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
          {Array.from({ length: getDaysInAMonth(currentYear, currentMonth) }).map((_, i) => {
          const day = i + 1;
          const dateToCheck = format(new Date(currentYear, currentMonth - 1, day), "yyyy/MM/dd");

          return (
            <p
              className={`${styles.dayOfMonth} ${
                format(new Date(currentYear, currentMonth - 1, day), "yyyy/MM/dd") === today
                  ? styles.currentDay
                  : ""
              } ${selectedDates.includes(dateToCheck) ? styles.assisted : ""}`}
              onClick={() => handleSelectDate(day)}
              key={i}
            >
              {day}
            </p>
          );
        })}
          {Array.from({
            length: completeCalendar(currentMonth, currentYear),
          }).map((_, i) => (
            <p key={i} className={styles.dayOfOtherMonth}>
              {i + 1}
            </p>
          ))}
        </div>
        <button
          onClick={followingMonth}
          className={styles.changeMonthButton + " " + styles.right}
        >
          <FontAwesomeIcon icon={faChevronRight}></FontAwesomeIcon>
        </button>
        <div className={styles.counter}>
          <span>Dias totales: </span>
          <span>
          <input
            type="text"
            placeholder="Días comunicados"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleSaveDays}
          />
          </span>
          <p>Asistencia: {selectedCount} días</p>
        </div>
      </div>
    </div>
  );
}

export default Calendar;
