import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  alpha,
  SelectChangeEvent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { addDays, isSameDay } from 'date-fns';

interface ScheduleFormProps {
  schedule: {
    workDays: Array<{ date: Date; shiftType: 'day' | 'night' }>;
    recoveryDays: Date[];
    productiveDays: Date[];
    secondJobDays: Date[];
    preparationDays: Date[];
  };
  setSchedule: React.Dispatch<React.SetStateAction<{
    workDays: Array<{ date: Date; shiftType: 'day' | 'night' }>;
    recoveryDays: Date[];
    productiveDays: Date[];
    secondJobDays: Date[];
    preparationDays: Date[];
  }>>;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({ schedule, setSchedule }) => {
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [shiftType, setShiftType] = React.useState<'day' | 'night'>('day');

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
  };

  const handleShiftTypeChange = (event: SelectChangeEvent<'day' | 'night'>) => {
    setShiftType(event.target.value as 'day' | 'night');
  };

  const handleAddWorkDay = () => {
    if (selectedDate) {
      setSchedule(prev => {
        // Check if this work day already exists
        const workDayExists = prev.workDays.some(wd => isSameDay(wd.date, selectedDate));
        if (workDayExists) {
          return prev; // Don't make any changes if the work day already exists
        }

        const newWorkDay = { date: selectedDate, shiftType };
        const recoveryDay = addDays(selectedDate, 1);
        const preparationDay = addDays(selectedDate, -1);
        const choreDay = addDays(selectedDate, -2);

        // Helper function to check if a date has any type of schedule
        const hasAnySchedule = (date: Date) => {
          return prev.workDays.some(wd => isSameDay(wd.date, date)) ||
                 prev.recoveryDays.some(d => isSameDay(d, date)) ||
                 prev.preparationDays.some(d => isSameDay(d, date)) ||
                 prev.productiveDays.some(d => isSameDay(d, date)) ||
                 prev.secondJobDays.some(d => isSameDay(d, date));
        };

        // Remove any existing days that conflict with the new work day
        const filteredRecoveryDays = prev.recoveryDays.filter(d => !isSameDay(d, selectedDate));
        const filteredPreparationDays = prev.preparationDays.filter(d => !isSameDay(d, selectedDate));
        const filteredProductiveDays = prev.productiveDays.filter(d => !isSameDay(d, selectedDate));
        const filteredSecondJobDays = prev.secondJobDays.filter(d => !isSameDay(d, selectedDate));

        // Only add auxiliary days if they don't have any schedule yet
        const newRecoveryDays = [
          ...filteredRecoveryDays,
          ...(!hasAnySchedule(recoveryDay) ? [recoveryDay] : [])
        ];
        
        const newPreparationDays = [
          ...filteredPreparationDays,
          ...(!hasAnySchedule(preparationDay) ? [preparationDay] : [])
        ];
        
        const newProductiveDays = [
          ...filteredProductiveDays,
          ...(!hasAnySchedule(choreDay) ? [choreDay] : [])
        ];

        return {
          ...prev,
          workDays: [...prev.workDays, newWorkDay],
          recoveryDays: newRecoveryDays,
          preparationDays: newPreparationDays,
          productiveDays: newProductiveDays,
          secondJobDays: filteredSecondJobDays
        };
      });
      setSelectedDate(null);
    }
  };

  return (
    <Box>
      <Typography 
        variant="h5" 
        component="h2" 
        sx={{ 
          mb: 3,
          color: 'primary.main',
          fontWeight: 500
        }}
      >
        Add Work Days
      </Typography>
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: 2,
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: alpha('#fff', 0.9)
            },
            '&.Mui-focused': {
              backgroundColor: '#fff',
              boxShadow: '0 4px 20px rgba(156, 39, 176, 0.15)'
            }
          }
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Select Work Date"
            value={selectedDate}
            onChange={handleDateChange}
            sx={{ 
              flex: 2,
              '& .MuiInputLabel-root': {
                color: 'text.secondary'
              }
            }}
          />
        </LocalizationProvider>

        <FormControl sx={{ flex: 1 }}>
          <InputLabel id="shift-type-label" sx={{ color: 'text.secondary' }}>
            Shift Type
          </InputLabel>
          <Select
            labelId="shift-type-label"
            value={shiftType}
            label="Shift Type"
            onChange={handleShiftTypeChange}
          >
            <MenuItem value="day">Day Shift</MenuItem>
            <MenuItem value="night">Night Shift</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          onClick={handleAddWorkDay}
          disabled={!selectedDate}
          startIcon={<AddRoundedIcon />}
          sx={{
            flex: { xs: '1', sm: 'none' },
            alignSelf: { sm: 'stretch' },
            background: 'linear-gradient(45deg, #9c27b0 30%, #ff4081 90%)',
            color: 'white',
            px: 4,
            '&:hover': {
              background: 'linear-gradient(45deg, #7b1fa2 30%, #f50057 90%)',
            },
            '&.Mui-disabled': {
              background: 'linear-gradient(45deg, #e1bee7 30%, #f8bbd0 90%)',
              color: 'rgba(255, 255, 255, 0.8)'
            }
          }}
        >
          Add Work Day
        </Button>
      </Box>
    </Box>
  );
};

export default ScheduleForm; 