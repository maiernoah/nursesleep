import React, { useState, useMemo, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Button,
  IconButton,
  Tooltip,
  alpha
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import ScheduleForm from './components/ScheduleForm';
import SleepRecommendation from './components/SleepRecommendation';
import { format, isSameDay, addDays } from 'date-fns';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#9c27b0', // A soft purple as primary color
      light: '#e1bee7',
    },
    secondary: {
      main: '#ff4081', // A pink accent
    },
    background: {
      default: '#fdf7ff',
    }
  },
  typography: {
    fontFamily: "'Quicksand', 'Roboto', 'Arial', sans-serif",
    h3: {
      fontWeight: 500,
      letterSpacing: '0.02em',
    },
    h5: {
      fontWeight: 500,
      letterSpacing: '0.01em',
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 25,
          textTransform: 'none',
          fontSize: '1rem',
          padding: '8px 24px',
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        }
      }
    }
  }
});

type Schedule = {
  workDays: Array<{ date: Date; shiftType: 'day' | 'night' }>;
  recoveryDays: Date[];
  productiveDays: Date[];
  secondJobDays: Date[];
  preparationDays: Date[];
};

function App() {
  const [schedule, setSchedule] = useState<Schedule>({
    workDays: [],
    recoveryDays: [],
    productiveDays: [],
    secondJobDays: [],
    preparationDays: [],
  });

  const allScheduledDays = useMemo(() => [
    ...schedule.workDays.map(workDay => ({ 
      date: workDay.date, 
      type: `${workDay.shiftType === 'night' ? 'Night' : 'Day'} Shift Work Day` 
    })),
    ...schedule.recoveryDays.map(date => ({ 
      date, 
      type: 'Recovery Day' 
    })),
    ...schedule.preparationDays.map(date => ({ 
      date, 
      type: 'Preparation Day' 
    })),
    ...schedule.productiveDays.map(date => ({ 
      date, 
      type: 'Regular Day' 
    }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime()), [schedule]);

  const handleReset = useCallback(() => {
    setSchedule({
      workDays: [],
      recoveryDays: [],
      productiveDays: [],
      secondJobDays: [],
      preparationDays: [],
    });
  }, []);

  const getSleepRecommendation = useCallback((date: Date) => {
    const workDay = schedule.workDays.find(wd => isSameDay(wd.date, date));
    if (workDay) {
      if (workDay.shiftType === 'night') {
        return {
          details: [
            'Sleep: 9:00 AM - 5:00 PM (8 hours)',
            'Wake up at 5:00 PM, have a light meal',
            'Start shift at 7:00 PM',
            'Stay hydrated throughout your shift'
          ]
        };
      }
      return {
        details: [
          'Sleep: 10:00 PM - 6:00 AM (8 hours)',
          'Wake up at 6:00 AM, have breakfast',
          'Start shift at 7:00 AM',
          'Stay hydrated and take regular breaks'
        ]
      };
    }

    if (schedule.recoveryDays.some(d => isSameDay(d, date))) {
      const workDay = schedule.workDays.find(wd => 
        isSameDay(wd.date, date) || isSameDay(addDays(wd.date, -1), date)
      );
      
      if (workDay?.shiftType === 'night') {
        return {
          details: [
            'Sleep: 8:00 AM - 4:00 PM (8 hours)',
            'Optional nap: 7:00 PM - 8:00 PM',
            'Light dinner at 8:30 PM',
            'Stay hydrated and eat nutritious meals'
          ]
        };
      }
      return {
        details: [
          'Sleep: 10:00 PM - 6:00 AM (8 hours)',
          'Optional nap: 2:00 PM - 3:00 PM',
          'Light exercise in the morning',
          'Stay hydrated and eat balanced meals'
        ]
      };
    }

    if (schedule.preparationDays.some(d => isSameDay(d, date))) {
      const workDay = schedule.workDays.find(wd => 
        isSameDay(wd.date, date) || isSameDay(addDays(wd.date, 1), date)
      );
      
      if (workDay?.shiftType === 'night') {
        return {
          details: [
            'Sleep: 11:00 PM - 7:00 AM (8 hours)',
            'Optional nap: 2:00 PM - 3:00 PM',
            'Avoid caffeine after 2:00 PM',
            'Prepare meals and clothes for night shift'
          ]
        };
      }
      return {
        details: [
          'Sleep: 10:00 PM - 6:00 AM (8 hours)',
          'Avoid caffeine after noon',
          'Prepare meals and clothes for morning',
          'Set out work clothes and supplies'
        ]
      };
    }

    return {
      details: [
        'Sleep: 10:00 PM - 6:00 AM (8 hours)',
        'Exercise in the morning or afternoon',
        'Limit caffeine after noon',
        'Maintain regular meal times'
      ]
    };
  }, [schedule]);

  const handleExport = useCallback(() => {
    const csvContent = [
      ['Date', 'Day Type', 'Sleep Time', 'Wake Time', 'Recommendations'],
      ...allScheduledDays.map(({ date, type }) => {
        const { details } = getSleepRecommendation(date);
        const [sleepTime, wakeTime] = details[0].split(': ')[1].split(' - ');
        return [
          format(date, 'MM/dd/yyyy'),
          type,
          sleepTime,
          wakeTime.split(' ')[0],
          details.join('; ')
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nurse-sleep-schedule-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [allScheduledDays, getSleepRecommendation]);

  const hasWorkDays = useMemo(() => schedule.workDays.length > 0, [schedule.workDays.length]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box 
        sx={{ 
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #fdf7ff 0%, #ffffff 100%)',
          pt: 4,
          pb: 8
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 4
          }}>
            {/* Header */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}>
              <Typography 
                variant="h3" 
                component="h1"
                sx={{ 
                  background: 'linear-gradient(45deg, #9c27b0 30%, #ff4081 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 2px 4px rgba(156, 39, 176, 0.1)',
                  fontWeight: 600
                }}
              >
                Nurse Sleep Schedule
              </Typography>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={handleReset}
                disabled={!hasWorkDays}
                startIcon={<RestartAltRoundedIcon />}
                sx={{
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.04)
                  }
                }}
              >
                Reset Schedule
              </Button>
            </Box>

            {/* Schedule Form */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 4,
                background: 'linear-gradient(135deg, #ffffff 0%, #fdf7ff 100%)',
                border: '1px solid',
                borderColor: 'primary.light',
                boxShadow: '0 4px 20px rgba(156, 39, 176, 0.08)'
              }}
            >
              <ScheduleForm schedule={schedule} setSchedule={setSchedule} />
            </Paper>

            {/* Recommendations */}
            <Paper 
              elevation={0}
              sx={{ 
                p: 4,
                background: 'linear-gradient(135deg, #ffffff 0%, #fdf7ff 100%)',
                border: '1px solid',
                borderColor: 'primary.light',
                boxShadow: '0 4px 20px rgba(156, 39, 176, 0.08)'
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 3
              }}>
                <Typography 
                  variant="h5" 
                  component="h2"
                  sx={{ 
                    color: 'primary.main',
                    fontWeight: 500
                  }}
                >
                  Sleep Schedule and Recommendations
                </Typography>
                <Tooltip title="Export to CSV">
                  <IconButton 
                    color="primary"
                    onClick={handleExport}
                    disabled={!hasWorkDays}
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08)
                      }
                    }}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              <SleepRecommendation schedule={schedule} />
            </Paper>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
