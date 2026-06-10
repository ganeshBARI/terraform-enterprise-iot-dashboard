import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  // Hardcoded live AWS API Gateway endpoint URL we created in Step 2
  private apiUrl = 'https://pvxdz3dzhc.execute-api.ap-south-1.amazonaws.com/Prod/devices/';

  constructor(private http: HttpClient) { }

  getDevices(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}