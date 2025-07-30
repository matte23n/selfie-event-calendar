export class TimeMachineService {
  private _virtualTime: Date;
  private _usingSystemTime: boolean = true;
  private _listeners: ((time: Date) => void)[] = [];

  constructor() {
    this._virtualTime = new Date();
  }

  public getCurrentTime(): Date {
    return new Date(this._virtualTime);
  }

  public isUsingSystemTime(): boolean {
    return this._usingSystemTime;
  }

  public setTime(newTime: Date): Promise<void> {
    this._virtualTime = new Date(newTime);
    this._usingSystemTime = false;
    this.notifyListeners();

    if (typeof window !== 'undefined') {
      const event = new CustomEvent('timeMachineChanged', {
        detail: { time: this._virtualTime },
      });
      window.dispatchEvent(event);
    }

    return Promise.resolve();
  }

  public moveForward(minutes: number): void {
    const newTime = new Date(this._virtualTime);
    newTime.setMinutes(newTime.getMinutes() + minutes);
    this.setTime(newTime);
  }

  public moveBackward(minutes: number): void {
    const newTime = new Date(this._virtualTime);
    newTime.setMinutes(newTime.getMinutes() - minutes);
    this.setTime(newTime);
  }

  public resetToSystemTime(): Promise<void> {
    this._virtualTime = new Date();
    this._usingSystemTime = true;
    this.notifyListeners();
    
    return Promise.resolve();
  }

  public addListener(listener: (time: Date) => void): () => void {
    this._listeners.push(listener);
    
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this._listeners.forEach(listener => listener(this.getCurrentTime()));
  }

  public isInFuture(date: Date): boolean {
    return date.getTime() > this._virtualTime.getTime();
  }

  public isInPast(date: Date): boolean {
    return date.getTime() < this._virtualTime.getTime();
  }

  public isToday(date: Date): boolean {
    const virtualDate = this._virtualTime;
    return (
      date.getFullYear() === virtualDate.getFullYear() &&
      date.getMonth() === virtualDate.getMonth() &&
      date.getDate() === virtualDate.getDate()
    );
  }
}

export const timeMachineService = new TimeMachineService();
