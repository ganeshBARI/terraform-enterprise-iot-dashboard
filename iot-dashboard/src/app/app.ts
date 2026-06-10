// 1. Add Inject and PLATFORM_ID to core imports
import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
// 2. Add isPlatformBrowser to common imports
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DeviceService } from './services/device';
import { interval, Subscription, switchMap, startWith, catchError, of, tap } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit, OnDestroy {
  devices: any[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  
  private pollingSub!: Subscription;

  constructor(
    private deviceService: DeviceService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object // 3. Inject the platform identifier
  ) {}

  ngOnInit(): void {
    // 4. Wrap the interval inside the browser check
    if (isPlatformBrowser(this.platformId)) {
      this.startRealTimeTelemetry();
    } else {
      // If running on the server during build, just load once and stop
      this.isLoading = false; 
    }
  }

  // Moved the polling logic into its own clean function
  startRealTimeTelemetry(): void {
    this.pollingSub = interval(5000)
      .pipe(
        startWith(0),
        tap(count => console.log(`[Heartbeat Monitor] Polling AWS attempt: #${count + 1}`)),
        switchMap(() => {
          return this.deviceService.getDevices().pipe(
            catchError(err => {
              console.error('[API Stream Error]:', err);
              this.errorMessage = 'Connection interrupted. Retrying...';
              return of({ status: 'Error', data: null }); 
            })
          );
        })
      )
      .subscribe({
        next: (response) => {
          if (response && response.data) {
            this.devices = [...response.data]; 
            this.isLoading = false;
            this.errorMessage = ''; 
            this.cdr.detectChanges(); 
          }
        }
      });
  }

  trackByDeviceId(index: number, device: any): string {
    return device.id; 
  }

  ngOnDestroy(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
  }
}