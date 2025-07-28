import { Task } from '../Calendar';
import axiosInstance from '../api/axiosInstance';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  renotifyInterval?: number;
  data?: any;
  usePush?: boolean;
}

class NotificationService {
  private notificationPermission: NotificationPermission = 'default';
  private activeNotifications: Map<string, { notification: Notification, timerId?: number }> = new Map();
  private snoozeTimers: Map<string, number> = new Map();
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.checkPermission();
    this.registerServiceWorker();
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/serviceWorker.js', {
          scope: '/'
        });
        console.log('ServiceWorker registration successful:', this.serviceWorkerRegistration);
        const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: 'BIfkA26WHqJ99bVptvUUsKn4bCKMbv2n67ntlEma7emv7K888L3KDl0DcA3VcQP2Q0lRSfNQUuxoEv1OzU8KwBw',
        });
        await axiosInstance.post('/push/subscribe', {
        subscription
      });
      
      } catch (error) {
        console.error('ServiceWorker registration failed:', error);
      }
    }
  }

  public async getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (this.serviceWorkerRegistration) {
      return this.serviceWorkerRegistration;
    }
    
    if ('serviceWorker' in navigator) {
      try {
        return await navigator.serviceWorker.ready;
      } catch (err) {
        console.error('Error getting ServiceWorker registration', err);
      }
    }
    
    return null;
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

  public async showNotification(options: NotificationOptions): Promise<Notification | null> {
    const hasPermission = await this.checkPermission();
    
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      if (options.tag && this.activeNotifications.has(options.tag)) {
        this.activeNotifications.get(options.tag)?.notification.close();
        if (this.activeNotifications.get(options.tag)?.timerId) {
          clearTimeout(this.activeNotifications.get(options.tag)?.timerId);
        }
      }

      if (options.usePush && 'serviceWorker' in navigator) {
        const registration = await this.getServiceWorkerRegistration();
        if (registration) {
          await registration.showNotification(options.title, {
            body: options.body,
            icon: options.icon || '/notification-icon.png',
            tag: options.tag,
            requireInteraction: options.requireInteraction || false,
            data: options.data,
            badge: '/favicon.ico',
            actions: options.data?.actions || []
          });
          
          const placeholderNotification = {
            close: () => {
              console.log('Closing push notification placeholder');
            },
            data: options.data,
            onclick: null
          } as unknown as Notification;
          
          if (options.tag) {
            let timerId: number | undefined = undefined;
            
            if (options.renotifyInterval) {
              timerId = window.setTimeout(() => {
                this.showNotification(options);
              }, options.renotifyInterval * 60 * 1000);
            }
            
            this.activeNotifications.set(options.tag, { 
              notification: placeholderNotification,
              timerId
            });
          }
          
          return placeholderNotification;
        }
      }

      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/notification-icon.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        data: options.data
      });

      notification.onclick = (event) => {
        window.focus();
        
        if (notification.data?.action === 'openTask') {
          window.dispatchEvent(new CustomEvent('openTask', { 
            detail: notification.data.taskId 
          }));
        } else if (notification.data?.action === 'openEvent') {
          window.dispatchEvent(new CustomEvent('openEvent', { 
            detail: notification.data.eventId 
          }));
        }
        
        notification.close();
      };

      notification.onclose = () => {
        if (options.tag) {
          this.activeNotifications.delete(options.tag);
        }
      };

      if (options.tag) {
        let timerId: number | undefined = undefined;
        
        if (options.renotifyInterval) {
          timerId = window.setTimeout(() => {
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

  public async notifyTask(task: Task, urgencyLevel: string): Promise<void> {
    if (!task._id) return;
    
    const taskId = task._id.toString();
    const dueDate = new Date(task.dueDate);
    
    let title = '';
    let body = '';
    let requireInteraction = false;
    let renotifyInterval: number | undefined = undefined;
    
    switch (urgencyLevel) {
      case 'overdue':
        title = '🔴 SCADUTO: ' + task.title;
        body = `Questa attività è scaduta il ${dueDate.toLocaleDateString()}`;
        requireInteraction = true;
        renotifyInterval = 30;
        break;
      case 'urgent':
        title = '⚠️ URGENTE: ' + task.title;
        body = `Questa attività scade entro le prossime 24 ore!`;
        requireInteraction = true;
        renotifyInterval = 60;
        break;
      case 'high':
        title = '❗ Alta Priorità: ' + task.title;
        body = `Questa attività scade tra pochi giorni (${dueDate.toLocaleDateString()})`;
        renotifyInterval = 120;
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
      usePush: true,
      data: {
        action: 'openTask',
        taskId: taskId
      }
    });
  }

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
      usePush: true
    });
  }

  public snoozeNotification(tag: string, minutes: number = 15): void {
    if (this.activeNotifications.has(tag)) {
      this.activeNotifications.get(tag)?.notification.close();
      
      if (this.activeNotifications.get(tag)?.timerId) {
        clearTimeout(this.activeNotifications.get(tag)?.timerId);
      }
      
      this.activeNotifications.delete(tag);
    }
    
    if (this.snoozeTimers.has(tag)) {
      clearTimeout(this.snoozeTimers.get(tag));
    }
    
    const timerId = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('checkTask', { 
        detail: { tag }
      }));
      
      this.snoozeTimers.delete(tag);
    }, minutes * 60 * 1000);
    
    this.snoozeTimers.set(tag, timerId);
  }

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

export const notificationService = new NotificationService();
export default notificationService;
