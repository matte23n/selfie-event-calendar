import { NotificationSetting, Event } from '../types/models';
import notificationService from './NotificationService';
import axiosInstance from '../api/axiosInstance';
import { timeMachineService } from './TimeMachineService';

class EventNotificationService {
  private scheduledNotifications: Map<string, number[]> = new Map();
  
  constructor() {
    // Initialize
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
  private async showNotification(event: Event, notification: NotificationSetting, isRepeat = false): Promise<void> {
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
    
    // Try to use server push notification for system notifications if possible
    if (notification.type === 'system') {
      try {
        await this.sendServerPushNotification(event, title, body);
        return;
      } catch (error) {
        console.log('Failed to send server push notification, falling back to client-side', error);
      }
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
      default:
        this.showSystemNotification(event._id as string, title, body);
    }
  }
  
  /**
   * Send a push notification through the server
   */
  private async sendServerPushNotification(event: Event, title: string, body: string): Promise<void> {
    try {
      await axiosInstance.post(`/push/notify/event/${event._id}`, {
        title,
        body,
        time: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending push notification through server:', error);
      throw error;
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
      usePush: true, // Use push notification when possible
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
    
    // If advanceTime is 0, notification should be sent at event time
    if (advanceTime === 0) {
      return 0;
    }
    
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
