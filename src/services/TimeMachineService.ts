import eventNotificationService from './EventNotificationService';

export class TimeMachineService {
  private _virtualTime: Date;
  private _usingSystemTime: boolean = true;
  private _listeners: ((time: Date) => void)[] = [];

  constructor() {
    // Initialize with system time
    this._virtualTime = new Date();
  }

  /**
   * Get the current virtual time
   */
  public getCurrentTime(): Date {
    return new Date(this._virtualTime);
  }

  /**
   * Check if we're using the system time or a custom time
   */
  public isUsingSystemTime(): boolean {
    return this._usingSystemTime;
  }

  /**
   * Set the virtual time to a specific date and time
   */
  public setTime(newTime: Date): Promise<void> {
    const oldTime = this._virtualTime;
    this._virtualTime = new Date(newTime);
    this._usingSystemTime = false;
    this.notifyListeners();
    
    // Reschedule notifications if time has changed significantly (more than 1 minute)
    if (Math.abs(this._virtualTime.getTime() - oldTime.getTime()) > 60000) {
      // Dispatch a custom event to trigger notification rescheduling
      if (typeof window !== 'undefined') {
        eventNotificationService.cancelAllNotifications();
      }
    }

    // Create and dispatch a custom event for other components
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('timeMachineChanged', {
        detail: { time: this._virtualTime },
      });
      window.dispatchEvent(event);
    }

    return Promise.resolve();
  }

  /**
   * Move virtual time forward by specified minutes
   */
  public moveForward(minutes: number): void {
    const newTime = new Date(this._virtualTime);
    newTime.setMinutes(newTime.getMinutes() + minutes);
    this.setTime(newTime);
  }

  /**
   * Move virtual time backward by specified minutes
   */
  public moveBackward(minutes: number): void {
    const newTime = new Date(this._virtualTime);
    newTime.setMinutes(newTime.getMinutes() - minutes);
    this.setTime(newTime);
  }

  /**
   * Reset virtual time to system time
   */
  public resetToSystemTime(): Promise<void> {
    const oldTime = this._virtualTime;
    this._virtualTime = new Date();
    this._usingSystemTime = true;
    this.notifyListeners();
    
    // Reschedule notifications if time has changed significantly (more than 1 minute)
    if (Math.abs(this._virtualTime.getTime() - oldTime.getTime()) > 60000) {
      // Dispatch a custom event to trigger notification rescheduling
      if (typeof window !== 'undefined') {
        eventNotificationService.cancelAllNotifications();
      }
    }
    
    return Promise.resolve();
  }

  /**
   * Add a listener to be notified on time changes
   */
  public addListener(listener: (time: Date) => void): () => void {
    this._listeners.push(listener);
    
    // Return function to remove this listener
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners that time has changed
   */
  private notifyListeners(): void {
    this._listeners.forEach(listener => listener(this.getCurrentTime()));
  }

  /**
   * Check if a date is in the future according to virtual time
   */
  public isInFuture(date: Date): boolean {
    return date.getTime() > this._virtualTime.getTime();
  }

  /**
   * Check if a date is in the past according to virtual time
   */
  public isInPast(date: Date): boolean {
    return date.getTime() < this._virtualTime.getTime();
  }

  /**
   * Check if a date is today according to virtual time
   */
  public isToday(date: Date): boolean {
    const virtualDate = this._virtualTime;
    return (
      date.getFullYear() === virtualDate.getFullYear() &&
      date.getMonth() === virtualDate.getMonth() &&
      date.getDate() === virtualDate.getDate()
    );
  }
}

// Singleton instance
export const timeMachineService = new TimeMachineService();
