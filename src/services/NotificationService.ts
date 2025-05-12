import { Task } from '../Calendar';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  renotifyInterval?: number; // in minutes
  data?: any;
}

class NotificationService {
  private notificationPermission: NotificationPermission = 'default';
  private activeNotifications: Map<string, { notification: Notification, timerId?: number }> = new Map();
  private snoozeTimers: Map<string, number> = new Map();

  constructor() {
    this.checkPermission();
  }

  private async checkPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return false;
    }

    this.notificationPermission = Notification.permission;
    
    if (this.notificationPermission === 'default') {
      this.notificationPermission = await Notification.requestPermission();
    }
    
    return this.notificationPermission === 'granted';
  }

  public async requestPermission(): Promise<boolean> {
    return await this.checkPermission();
  }

  /**
   * Shows a notification with the given options
   */
  public async showNotification(options: NotificationOptions): Promise<Notification | null> {
    const hasPermission = await this.checkPermission();
    
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      // If there's an existing notification with same tag, close it
      if (options.tag && this.activeNotifications.has(options.tag)) {
        this.activeNotifications.get(options.tag)?.notification.close();
        if (this.activeNotifications.get(options.tag)?.timerId) {
          clearTimeout(this.activeNotifications.get(options.tag)?.timerId);
        }
      }

      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/notification-icon.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        data: options.data
      });

      // Set up notification event handlers
      notification.onclick = (event) => {
        // Focus on the window/tab when notification is clicked
        window.focus();
        
        // Handle click based on notification data
        if (notification.data?.action === 'openTask') {
          window.dispatchEvent(new CustomEvent('openTask', { 
            detail: notification.data.taskId 
          }));
        }
        
        notification.close();
      };

      notification.onclose = () => {
        if (options.tag) {
          this.activeNotifications.delete(options.tag);
        }
      };

      // Store the notification if it has a tag
      if (options.tag) {
        let timerId: number | undefined = undefined;
        
        // Set up renotify if specified
        if (options.renotifyInterval) {
          timerId = window.setTimeout(() => {
            // Close old notification and create a new one
            notification.close();
            this.showNotification(options);
          }, options.renotifyInterval * 60 * 1000);
        }
        
        this.activeNotifications.set(options.tag, { 
          notification,
          timerId
        });
      }

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  /**
   * Shows task notification with appropriate urgency
   */
  public async notifyTask(task: Task, urgencyLevel: string): Promise<void> {
    if (!task._id) return;
    
    const taskId = task._id.toString();
    const dueDate = new Date(task.dueDate);
    
    // Construct notification options based on urgency
    let title = '';
    let body = '';
    let requireInteraction = false;
    let renotifyInterval: number | undefined = undefined;
    
    switch (urgencyLevel) {
      case 'overdue':
        title = '🔴 SCADUTO: ' + task.title;
        body = `Questa attività è scaduta il ${dueDate.toLocaleDateString()}`;
        requireInteraction = true;
        renotifyInterval = 30; // Remind every 30 minutes
        break;
      case 'urgent':
        title = '⚠️ URGENTE: ' + task.title;
        body = `Questa attività scade entro le prossime 24 ore!`;
        requireInteraction = true;
        renotifyInterval = 60; // Remind every hour
        break;
      case 'high':
        title = '❗ Alta Priorità: ' + task.title;
        body = `Questa attività scade tra pochi giorni (${dueDate.toLocaleDateString()})`;
        renotifyInterval = 120; // Remind every 2 hours
        break;
      case 'medium':
        title = '❕ Promemoria: ' + task.title;
        body = `Questa attività scade il ${dueDate.toLocaleDateString()}`;
        break;
      default:
        title = '📝 Attività: ' + task.title;
        body = `Scadenza: ${dueDate.toLocaleDateString()}`;
        break;
    }

    await this.showNotification({
      title,
      body,
      tag: `task-${taskId}-${urgencyLevel}`,
      requireInteraction,
      renotifyInterval,
      data: {
        action: 'openTask',
        taskId: taskId
      }
    });
  }

  /**
   * Notify user of date change
   */
  public async notifyDateChange(date: Date): Promise<void> {
    const formattedDate = date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const formattedTime = date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    await this.showNotification({
      title: '🕒 Cambiamento di Data',
      body: `La Time Machine è stata impostata a: ${formattedDate}, ${formattedTime}`,
      tag: 'time-machine-change',
      requireInteraction: true,
    });
  }

  /**
   * Snooze a notification for the specified number of minutes
   */
  public snoozeNotification(tag: string, minutes: number = 15): void {
    // Close existing notification if it's active
    if (this.activeNotifications.has(tag)) {
      this.activeNotifications.get(tag)?.notification.close();
      
      if (this.activeNotifications.get(tag)?.timerId) {
        clearTimeout(this.activeNotifications.get(tag)?.timerId);
      }
      
      this.activeNotifications.delete(tag);
    }
    
    // Clear existing snooze timer if any
    if (this.snoozeTimers.has(tag)) {
      clearTimeout(this.snoozeTimers.get(tag));
    }
    
    // Set a new snooze timer
    const timerId = window.setTimeout(() => {
      // After snooze period, dispatch an event to re-check this task
      window.dispatchEvent(new CustomEvent('checkTask', { 
        detail: { tag }
      }));
      
      this.snoozeTimers.delete(tag);
    }, minutes * 60 * 1000);
    
    this.snoozeTimers.set(tag, timerId);
  }

  /**
   * Cancel all active notifications
   */
  public clearAllNotifications(): void {
    this.activeNotifications.forEach(({ notification, timerId }) => {
      notification.close();
      if (timerId) clearTimeout(timerId);
    });
    this.activeNotifications.clear();
    
    this.snoozeTimers.forEach(timerId => {
      clearTimeout(timerId);
    });
    this.snoozeTimers.clear();
  }
}

// Singleton instance
export const notificationService = new NotificationService();
export default notificationService;
