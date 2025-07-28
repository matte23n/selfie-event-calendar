import { NotificationSetting, Event } from '../types/models';
import notificationService from './NotificationService';
import axiosInstance from '../api/axiosInstance';

class EventNotificationService {
  private scheduledNotifications: Map<string, number[]> = new Map();
    
  public cancelEventNotifications(eventId: string): void {
    const timerIds = this.scheduledNotifications.get(eventId);
    
    if (timerIds) {
      timerIds.forEach(id => window.clearTimeout(id));
      this.scheduledNotifications.delete(eventId);
    }
  }
  
  private scheduleRepeatNotifications(
    event: Event, 
    notification: NotificationSetting, 
    baseNotificationTime: number
  ): number[] {
    const timerIds: number[] = [];
    const repeat = notification.repeat;
    
    if (!repeat) return timerIds;
    
    if (repeat.type === 'count' && repeat.count) {
      for (let i = 1; i <= repeat.count; i++) {
        const repeatInterval = 60 * 1000;
        const repeatTime = baseNotificationTime + (repeatInterval * i);
        
        if (repeatTime < Date.now()) continue;
        
        const timerId = window.setTimeout(() => {
          this.showNotification(event, notification, true);
        }, repeatTime - Date.now());
        
        timerIds.push(timerId);
      }
    } 
    else if (repeat.type === 'interval' && repeat.interval) {
      const eventTime = new Date(event.startDate).getTime();
      let currentTime = baseNotificationTime;
      
      while (currentTime < eventTime) {
        currentTime += repeat.interval * 60 * 1000; 
        
        if (currentTime < Date.now()) continue;
        
        if (currentTime >= eventTime) break;
        
        const timerId = window.setTimeout(() => {
          this.showNotification(event, notification, true);
        }, currentTime - Date.now());
        
        timerIds.push(timerId);
      }
    }
    else if (repeat.type === 'until-response') {
      const eventTime = new Date(event.startDate).getTime();
      let currentTime = baseNotificationTime;
      
      while (currentTime < eventTime) {
        currentTime += 2 * 60 * 1000; 
        
        if (currentTime < Date.now()) continue;
        
        if (currentTime >= eventTime) break;
        
        const timerId = window.setTimeout(() => {
          this.showNotification(event, notification, true);
        }, currentTime - Date.now());
        
        timerIds.push(timerId);
      }
    }
    
    return timerIds;
  }
  
  private async showNotification(event: Event, notification: NotificationSetting, isRepeat = false): Promise<void> {
    const eventTime = new Date(event.startDate).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let title = isRepeat ? `🔔 REMINDER: ${event.title}` : `🗓️ ${event.title}`;
    let body = `${event.title || 'Event'} @ ${eventTime}`;
    
    if (notification.advanceTime > 0) {
      const timeText = this.formatAdvanceTime(notification);
      body += ` (in ${timeText})`;
    }
    
    if (notification.type === 'system') {
      try {
        await this.sendServerPushNotification(event, title, body);
        return;
      } catch (error) {
        console.log('Failed to send server push notification, falling back to client-side', error);
      }
    }
    
    switch (notification.type) {
      case 'system':
        this.showSystemNotification(event._id as string, title, body);
        break;
      case 'alert':
        alert(`${title}\n${body}`);
        break;
      case 'email':
        console.log(`Would send email: ${title} - ${body}`);
        break;
      default:
        this.showSystemNotification(event._id as string, title, body);
    }
  }
  
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
  
  private showSystemNotification(eventId: string, title: string, body: string): void {
    notificationService.showNotification({
      title,
      body,
      tag: `event-${eventId}`,
      requireInteraction: true,
      usePush: true,
      data: {
        action: 'openEvent',
        eventId
      }
    });
  }
  
  private calculateAdvanceTimeInMs(notification: NotificationSetting): number {
    const { advanceTime, advanceUnit } = notification;
    
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
