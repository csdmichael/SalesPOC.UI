import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AgentResponse {
  reply: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private agentUrl = environment.chatAgentUrl;

  constructor(private http: HttpClient) {}

  /**
   * Sends a natural language question to the Microsoft Foundry agent.
   * The agent URL points to the Arrow Sales Agent hosted on Azure AI Foundry.
   * In production, this would proxy through your backend to avoid CORS and secure API keys.
   */
  sendMessage(message: string): Observable<string> {
    // Since the Azure AI Foundry agent URL is a portal link,
    // we route through a backend proxy endpoint.
    // Configure your API to proxy chat requests to the Foundry agent.
    const proxyUrl = `${environment.apiBaseUrl}/Chat`;
    return this.http.post<AgentResponse>(proxyUrl, { question: message }).pipe(
      map(res => res.reply),
      catchError(err => {
        console.error('Chat agent error:', err);
        return of('Sorry, I could not reach the AI assistant right now. Please try again later.');
      })
    );
  }
}
