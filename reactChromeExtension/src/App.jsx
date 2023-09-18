import * as React from 'react';
import Calendar from './Calendar.jsx'
import styles from "./Styles.module.css"
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

export default function BasicDateCalendar() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Calendar styles={styles} />
    </LocalizationProvider>
  );
}

