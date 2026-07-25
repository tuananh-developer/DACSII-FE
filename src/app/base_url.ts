import { Injectable } from "@angular/core";
import { environment } from "../environments/environment";

@Injectable({
  providedIn: "root",
})
export class BaseUrlService {
  // Base URL trỏ tới nhóm endpoint auth
  private authBaseUrl: string = environment.production && environment.apiUrl ? `${environment.apiUrl}/auth` : "/auth"; 
  // Base URL trỏ tới API chính
  private apiBaseUrl: string = environment.production && environment.apiUrl ? environment.apiUrl : "";

  getAuthBaseUrl(): string {
    return this.authBaseUrl;
  }

  getApiBaseUrl(): string {
    return this.apiBaseUrl;
  }

  setAuthBaseUrl(url: string) {
    this.authBaseUrl = url;
  }
}