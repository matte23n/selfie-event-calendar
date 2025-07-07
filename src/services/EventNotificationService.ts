import { NotificationSetting, Event } from '../types/models';
import notificationService from './NotificationService';

class EventNotificationService {
  private scheduledNotifications: Map<string, number[]> = new Map();
  
  constructor() {
    // Initialize
  }
  
  /**
   * Schedule notifications for an event
   */
  public scheduleEventNotifications(event: Event): void {
    // Cancel any existing notifications for this event
    this.cancelEventNotifications(event._id as string);
    
    const timerIds: number[] = [];
    
    // No notifications to schedule
    if (!event.notifications || event.notifications.length === 0) return;
    
    const eventTime = new Date(event.startDate).getTime();
    
    // Schedule each notification
    event.notifications.forEach(notification => {
      // Calculate when to show the notification
      const advanceMs = this.calculateAdvanceTimeInMs(notification);
      const notificationTime = eventTime - advanceMs;
      
      // If notification time is in the past, skip it
      if (notificationTime < Date.now()) return;
      
      // Schedule the notification
      const timerId = window.setTimeout(() => {
        this.showNotification(event, notification);
      }, notificationTime - Date.now());
      
      timerIds.push(timerId);
      
      // If there's a repeat setting, schedule repeat notifications
      if (notification.repeat) {
        const repeatTimerIds = this.scheduleRepeatNotifications(event, notification, notificationTime);
        timerIds.push(...repeatTimerIds);
      }
    });
    
    // Store timer IDs so we can cancel them later if needed
    if (timerIds.length > 0) {
      this.scheduledNotifications.set(event._id as string, timerIds);
    }
  }
  
  /**
   * Cancel all scheduled notifications for an event
   */
  public cancelEventNotifications(eventId: string): void {
    const timerIds = this.scheduledNotifications.get(eventId);
    
    if (timerIds) {
      timerIds.forEach(id => window.clearTimeout(id));
      this.scheduledNotifications.delete(eventId);
    }
  }
  
  /**
   * Schedule repeat notifications based on the repeat settings
   */
  private scheduleRepeatNotifications(
    event: Event, 
    notification: NotificationSetting, 
    baseNotificationTime: number
  ): number[] {
    const timerIds: number[] = [];
    const repeat = notification.repeat;
    
    if (!repeat) return timerIds;
    
    if (repeat.type === 'count' && repeat.count) {
      // Repeat a specific number of times
      for (let i = 1; i <= repeat.count; i++) {
        // Repeat every minute by default
        const repeatInterval = 60 * 1000;
        const repeatTime = baseNotificationTime + (repeatInterval * i);
        
        // Skip if already in the past
        if (repeatTime < Date.now()) continue;
        
        const timerId = window.setTimeout(() => {
          this.showNotification(event, notification, true);
        }, repeatTime - Date.now());
        
        timerIds.push(timerId);
      }
    } 
    else if (repeat.type === 'interval' && repeat.interval) {
      // Repeat at a specific interval until event time
      const eventTime = new Date(event.startDate).getTime();
      let currentTime = baseNotificationTime;
      
      while (currentTime < eventTime) {
        currentTime += repeat.interval * 60 * 1000; // Convert minutes to ms
        
        // Skip if already in the past
        if (currentTime < Date.now()) continue;
        
        // Don't schedule notifications after event start
        if (currentTime >= eventTime) break;
        
        const timerId = window.setTimeout(() => {
          this.showNotification(event, notification, true);
        }, currentTime - Date.now());
        
        timerIds.push(timerId);
      }
    }
    else if (repeat.type === 'until-response') {
      // Currently we'll just repeat every 2 minutes until event time
      // In a real app, would track response and stop when user responds
      const eventTime = new Date(event.startDate).getTime();
      let currentTime = baseNotificationTime;
      
      while (currentTime < eventTime) {
        currentTime += 2 * 60 * 1000; // 2 minutes
        
        // Skip if already in the past
        if (currentTime < Date.now()) continue;
        
        // Don't schedule notifications after event start
        if (currentTime >= eventTime) break;
        
        const timerId = window.setTimeout(() => {
          this.showNotification(event, notification, true);
        }, currentTime - Date.now());
        
        timerIds.push(timerId);
      }
    }
    
    return timerIds;
  }
  
  /**
   * Show a notification for an event
   */
  private showNotification(event: Event, notification: NotificationSetting, isRepeat = false): void {
    // Get the formatted event time
    const eventTime = new Date(event.startDate).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Construct the notification message
    let title = isRepeat ? `🔔 REMINDER: ${event.title}` : `🗓️ ${event.title}`;
    let body = `${event.title || 'Event'} @ ${eventTime}`;
    
    if (notification.advanceTime > 0) {
      const timeText = this.formatAdvanceTime(notification);
      body += ` (in ${timeText})`;
    }
    
    // Show the notification based on type
    switch (notification.type) {
      case 'system':
        this.showSystemNotification(event._id as string, title, body);
        break;
      case 'alert':
        alert(`${title}\n${body}`);
        break;
      case 'email':
        // In a real app, would call an API to send an email
        console.log(`Would send email: ${title} - ${body}`);
        break;
      // case 'whatsapp':
      //   // In a real app, would integrate with WhatsApp API
      //   console.log(`Would send WhatsApp: ${title} - ${body}`);
      //   break;
      default:
        this.showSystemNotification(event._id as string, title, body);
    }
  }
  
  /**
   * Show a system notification using the NotificationService
   */
  private showSystemNotification(eventId: string, title: string, body: string): void {
    notificationService.showNotification({
      title,
      body,
      tag: `event-${eventId}`,
      requireInteraction: true,
      data: {
        action: 'openEvent',
        eventId
      }
    });
  }
  
  /**
   * Calculate advance time in milliseconds
   */
  private calculateAdvanceTimeInMs(notification: NotificationSetting): number {
    const { advanceTime, advanceUnit } = notification;
    
    switch (advanceUnit) {
      case 'minute':
        return advanceTime * 60 * 1000;
      case 'hour':
        return advanceTime * 60 * 60 * 1000;
      case 'day':
        return advanceTime * 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  }
  
  /**
   * Format advance time for display
   */
  private formatAdvanceTime(notification: NotificationSetting): string {
    const { advanceTime, advanceUnit } = notification;
    
    if (advanceTime === 0) {
      return 'now';
    }
    
    let unit = advanceUnit;
    if (advanceTime !== 1) {
      unit = `${unit}s`;
    }
    
    return `${advanceTime} ${unit}`;
  }
  
  /**
   * Schedule notifications for all events
   */
  public scheduleAllEvents(events: Event[]): void {
    // Cancel all existing notification schedules
    this.cancelAllNotifications();
    
    // Schedule notifications for each event
    events.forEach(event => {
      this.scheduleEventNotifications(event);
    });
  }
  
  /**
   * Cancel all scheduled notifications
   */
  public cancelAllNotifications(): void {
    this.scheduledNotifications.forEach((timerIds, eventId) => {
      timerIds.forEach(id => window.clearTimeout(id));
    });
    
    this.scheduledNotifications.clear();
  }
}

// Create a singleton instance
export const eventNotificationService = new EventNotificationService();
export default eventNotificationService;
