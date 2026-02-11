import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, timer } from 'rxjs';
import { catchError, map, retryWhen, switchMap, scan } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AgentCitation {
  title: string;
  url: string;
  content: string;
}

export interface AgentResponse {
  reply: string;
  citations?: AgentCitation[];
}

/**
 * Circuit breaker states:
 * - CLOSED: requests flow normally
 * - OPEN: requests are blocked immediately
 * - HALF_OPEN: one trial request is allowed to test recovery
 */
enum CircuitState {
  CLOSED,
  OPEN,
  HALF_OPEN,
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private agentUrl = environment.chatAgentUrl;

  // Circuit breaker configuration
  private readonly maxRetries = 5;
  private readonly retryDelayMs = 1000;
  private readonly circuitOpenDurationMs = 30000; // 30 seconds
  private readonly failureThreshold = 5;

  // Circuit breaker state
  private circuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;

  constructor(private http: HttpClient) {}

  /**
   * Sends a natural language question to the Microsoft Foundry agent.
   * The agent URL points to the Arrow Sales Agent hosted on Azure AI Foundry.
   * In production, this would proxy through your backend to avoid CORS and secure API keys.
   *
   * Implements retry (up to 5 attempts) with circuit breaker for HTTP 500 errors.
   */
  sendMessage(message: string): Observable<{ reply: string; citations?: AgentCitation[] }> {
    // If circuit is OPEN, check if enough time has passed to transition to HALF_OPEN
    if (this.circuitState === CircuitState.OPEN) {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.circuitOpenDurationMs) {
        this.circuitState = CircuitState.HALF_OPEN;
      } else {
        console.warn('Circuit breaker is OPEN. Rejecting request.');
        return of({ reply: 'The AI assistant is temporarily unavailable due to repeated failures. Please try again later.' });
      }
    }

    const proxyUrl = `${environment.apiBaseUrl2}/Chat`;
    return this.http.post<AgentResponse>(proxyUrl, { question: message }).pipe(
      map(res => ({ reply: res.reply, citations: res.citations })),
      retryWhen(errors =>
        errors.pipe(
          scan((retryCount, error) => {
            // Only retry on HTTP 500 errors
            if (error instanceof HttpErrorResponse && error.status === 500 && retryCount < this.maxRetries) {
              console.warn(`Retry ${retryCount + 1}/${this.maxRetries} after HTTP 500...`);
              return retryCount + 1;
            }
            throw error;
          }, 0),
          switchMap(retryCount => timer(this.retryDelayMs * retryCount)) // exponential-ish backoff
        )
      ),
      catchError(err => {
        if (err instanceof HttpErrorResponse && err.status === 500) {
          this.recordFailure();
          console.error('All retries exhausted for HTTP 500:', err);
        } else {
          console.error('Chat agent error:', err);
        }
        return of({ reply: 'Sorry, I could not reach the AI assistant right now. Please try again later.' });
      }),
      map(response => {
        // Successful response — reset circuit breaker
        this.recordSuccess();
        return response;
      })
    );
  }

  /** Records a failure and opens the circuit if the threshold is reached. */
  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.circuitState = CircuitState.OPEN;
      console.warn('Circuit breaker OPEN — too many consecutive failures.');
    }
  }

  /** Resets the circuit breaker on a successful response. */
  private recordSuccess(): void {
    this.failureCount = 0;
    this.circuitState = CircuitState.CLOSED;
  }
}
