import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Paper, Tooltip } from '@mui/material';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { format, isSameDay, addDays, parse } from 'date-fns';

interface SleepRecommendationProps {
  schedule: {
    workDays: Array<{ date: Date; shiftType: 'day' | 'night' }>;
    recoveryDays: Date[];
    productiveDays: Date[];
    secondJobDays: Date[];
    preparationDays: Date[];
  };
}

const getBackgroundColor = (type: string): string => {
  if (type.includes('Night Shift')) return '#f8f1ff'; // Softer purple
  if (type.includes('Day Shift')) return '#f1f8ff'; // Softer blue
  if (type.includes('Recovery')) return '#f1fbf3'; // Softer green
  if (type.includes('Preparation')) return '#fff7f0'; // Softer orange
  return '#fafafa'; // Light grey for regular days
};

const getBorderColor = (type: string): string => {
  if (type.includes('Night Shift')) return '#e9d8ff'; // Light purple border
  if (type.includes('Day Shift')) return '#d8ebff'; // Light blue border
  if (type.includes('Recovery')) return '#d8f2dc'; // Light green border
  if (type.includes('Preparation')) return '#ffe4cc'; // Light orange border
  return '#f0f0f0'; // Light grey border
};

const isChoreDay = (type: string, details: string[]): boolean => {
  // Night shift workers sleep during day (typically 9am-5pm)
  if (type.includes('Night Shift')) {
    return false;
  }

  // Day shift workers are at work (7am-7pm typically)
  if (type.includes('Day Shift Work Day')) {
    return false;
  }

  // Get sleep time from the first detail
  const sleepDetail = details[0];
  const timeRange = sleepDetail.split(': ')[1].split(' - ');
  const sleepTime = timeRange[0];
  const wakeTime = timeRange[1].split(' ')[0];

  // Create base date for parsing
  const baseDate = new Date();
  
  // Parse sleep and wake times
  const sleepDateTime = parse(sleepTime, 'h:mm aa', baseDate);
  const wakeDateTime = parse(wakeTime, 'h:mm aa', baseDate);
  
  // Business hours in 24h format
  const businessStart = 9; // 9am
  const businessEnd = 17;  // 5pm
  
  // If sleep time is PM and wake time is AM, they sleep at night
  const sleepHour = sleepDateTime.getHours();
  const wakeHour = wakeDateTime.getHours();
  
  // Calculate available hours during business time
  let availableHours = 0;
  
  if (sleepHour >= businessEnd || sleepHour < businessStart) {
    // They're awake during business hours
    availableHours = businessEnd - businessStart;
  } else if (wakeHour >= businessStart && wakeHour < businessEnd) {
    // They wake up during business hours
    availableHours = businessEnd - wakeHour;
  }
  
  return availableHours >= 5;
};

const SleepRecommendation: React.FC<SleepRecommendationProps> = ({ schedule }) => {
  const getSleepRecommendation = (date: Date) => {
    // Check if it's a work day
    const workDay = schedule.workDays.find(wd => isSameDay(wd.date, date));
    if (workDay) {
      if (workDay.shiftType === 'night') {
        return {
          recommendation: 'Night Shift Work Day',
          details: [
            'Sleep: 9:00 AM - 5:00 PM (8 hours)',
            'Wake up at 5:00 PM, have a light meal',
            'Start shift at 7:00 PM',
            'Stay hydrated throughout your shift'
          ]
        };
      } else {
        return {
          recommendation: 'Day Shift Work Day',
          details: [
            'Sleep: 10:00 PM - 6:00 AM (8 hours)',
            'Wake up at 6:00 AM, have breakfast',
            'Start shift at 7:00 AM',
            'Stay hydrated and take regular breaks'
          ]
        };
      }
    }

    // Check if it's a recovery day
    if (schedule.recoveryDays.some(d => isSameDay(d, date))) {
      const workDay = schedule.workDays.find(wd => 
        isSameDay(wd.date, date) || isSameDay(addDays(wd.date, -1), date)
      );
      
      if (workDay?.shiftType === 'night') {
        return {
          recommendation: 'Night Shift Recovery Day',
          details: [
            'Sleep: 8:00 AM - 4:00 PM (8 hours)',
            'Optional nap: 7:00 PM - 8:00 PM',
            'Light dinner at 8:30 PM',
            'Stay hydrated and eat nutritious meals'
          ]
        };
      } else {
        return {
          recommendation: 'Day Shift Recovery Day',
          details: [
            'Sleep: 10:00 PM - 6:00 AM (8 hours)',
            'Optional nap: 2:00 PM - 3:00 PM',
            'Light exercise in the morning',
            'Stay hydrated and eat balanced meals'
          ]
        };
      }
    }

    // Check if it's a preparation day
    if (schedule.preparationDays.some(d => isSameDay(d, date))) {
      const workDay = schedule.workDays.find(wd => 
        isSameDay(wd.date, date) || isSameDay(addDays(wd.date, 1), date)
      );
      
      if (workDay?.shiftType === 'night') {
        return {
          recommendation: 'Night Shift Preparation Day',
          details: [
            'Sleep: 11:00 PM - 7:00 AM (8 hours)',
            'Optional nap: 2:00 PM - 3:00 PM',
            'Avoid caffeine after 2:00 PM',
            'Prepare meals and clothes for night shift'
          ]
        };
      } else {
        return {
          recommendation: 'Day Shift Preparation Day',
          details: [
            'Sleep: 10:00 PM - 6:00 AM (8 hours)',
            'Avoid caffeine after noon',
            'Prepare meals and clothes for morning',
            'Set out work clothes and supplies'
          ]
        };
      }
    }

    // Default to productive day
    return {
      recommendation: 'Regular Day',
      details: [
        'Sleep: 10:00 PM - 6:00 AM (8 hours)',
        'Exercise in the morning or afternoon',
        'Limit caffeine after noon',
        'Maintain regular meal times'
      ]
    };
  };

  const allScheduledDays = [
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
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <Box>
      {allScheduledDays.length > 0 ? (
        <List sx={{ 
          '& .MuiListItem-root': { 
            mb: 2.5,
            '&:last-child': { mb: 0 }
          }
        }}>
          {allScheduledDays.map(({ date, type }) => {
            const { recommendation, details } = getSleepRecommendation(date);
            const isChoreTime = isChoreDay(type, details);
            return (
              <ListItem key={date.getTime()} disableGutters>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3,
                    width: '100%',
                    bgcolor: getBackgroundColor(type),
                    border: 1,
                    borderColor: getBorderColor(type),
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 500,
                            fontSize: '1.1rem',
                            color: 'text.primary',
                            letterSpacing: '0.01em'
                          }}
                        >
                          {format(date, 'EEEE, MMMM d, yyyy')}
                        </Typography>
                        {isChoreTime && (
                          <Tooltip title="Chore Day - At least 5 hours available during 9am-5pm">
                            <StarRoundedIcon 
                              sx={{ 
                                color: 'warning.light',
                                fontSize: 22,
                                filter: 'drop-shadow(0 2px 4px rgba(255, 167, 38, 0.2))',
                                animation: 'sparkle 1.5s infinite',
                                '@keyframes sparkle': {
                                  '0%, 100%': { transform: 'scale(1)' },
                                  '50%': { transform: 'scale(1.1)' }
                                }
                              }} 
                            />
                          </Tooltip>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            color: 'text.secondary',
                            fontWeight: 500,
                            fontSize: '0.9rem',
                            mb: 0.5
                          }}
                        >
                          {type}
                        </Typography>
                        <Box component="ul" sx={{ 
                          m: 0, 
                          pl: 2,
                          '& li': {
                            mb: 0.75,
                            color: 'text.secondary',
                            '&:last-child': { mb: 0 }
                          }
                        }}>
                          {details.map((detail, index) => (
                            <Typography 
                              component="li" 
                              key={index} 
                              variant="body2"
                              sx={{ 
                                fontSize: '0.9rem',
                                lineHeight: 1.5
                              }}
                            >
                              {detail}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    }
                  />
                </Paper>
              </ListItem>
            );
          })}
        </List>
      ) : (
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ 
            textAlign: 'center',
            py: 4,
            fontStyle: 'italic'
          }}
        >
          Add work days to see your sleep schedule and recommendations
        </Typography>
      )}
    </Box>
  );
};

export default SleepRecommendation; 