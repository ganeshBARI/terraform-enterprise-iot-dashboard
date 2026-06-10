import { ApplicationConfig, provideZoneChangeDetection,provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(), provideClientHydration(),
    provideZoneChangeDetection({ eventCoalescing: true }),provideHttpClient() // Registers global asynchronous HTTP pipeline services
    
  ]
};
