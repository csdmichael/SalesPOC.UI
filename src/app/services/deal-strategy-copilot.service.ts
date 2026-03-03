import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { DealStrategyContext, DealStrategyResult } from '../models/deal-strategy.model';
import { ChatService } from './chat.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DealStrategyCopilotService {
  private context: DealStrategyContext | null = null;
  private connectedAgentName = '';
  private connectedAgentUrl = '';

  constructor(private chatService: ChatService) {}

  connect(): Observable<void> {
    this.connectedAgentName = environment.dealStrategyAgentName;
    this.connectedAgentUrl = environment.dealStrategyAgentUrl;
    return of(void 0);
  }

  setContext(context: DealStrategyContext): void {
    this.context = context;
  }

  invoke(prompt: string): Observable<DealStrategyResult> {
    const groundedPrompt = this.buildGroundedPrompt(prompt);
    return this.chatService.sendMessage(groundedPrompt).pipe(
      map(response => this.toStructuredResult(response.reply))
    );
  }

  invokeRaw(prompt: string): Observable<string> {
    const groundedPrompt = this.buildGroundedPrompt(prompt);
    return this.chatService.sendMessage(groundedPrompt).pipe(
      map(response => response.reply)
    );
  }

  private buildGroundedPrompt(prompt: string): string {
    const contextJson = JSON.stringify(this.context ?? {}, null, 2);
    return [
      `Agent: ${this.connectedAgentName}`,
      `AgentEndpoint: ${this.connectedAgentUrl}`,
      'Context:',
      contextJson,
      '',
      prompt,
      '',
      'Return JSON only with this shape:',
      '{"riskCard":"string","crossSellCard":"string","recommendedActions":["string"],"executiveSummary":"string"}'
    ].join('\n');
  }

  private toStructuredResult(reply: string): DealStrategyResult {
    const parsed = this.tryParseJson(reply);
    if (parsed) {
      return {
        riskCard: this.asText(parsed['riskCard']) || 'No explicit risk identified.',
        crossSellCard: this.asText(parsed['crossSellCard']) || 'No explicit cross-sell opportunity identified.',
        recommendedActions: this.asStringArray(parsed['recommendedActions']),
        executiveSummary: this.asText(parsed['executiveSummary']) || reply,
        rawReply: reply,
      };
    }

    return {
      riskCard: this.firstSentence(reply) || 'No explicit risk identified.',
      crossSellCard: 'No explicit cross-sell opportunity identified.',
      recommendedActions: this.extractActions(reply),
      executiveSummary: reply,
      rawReply: reply,
    };
  }

  private tryParseJson(reply: string): Record<string, unknown> | null {
    const fenced = reply.match(/```json\s*([\s\S]*?)```/i);
    const candidate = (fenced ? fenced[1] : reply).trim();
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
    return null;
  }

  private asText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.map(item => (typeof item === 'string' ? item.trim() : '')).filter(Boolean);
  }

  private firstSentence(text: string): string {
    const sentence = text.split(/[.!?]/)[0] ?? '';
    return sentence.trim();
  }

  private extractActions(text: string): string[] {
    const bulletActions = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => /^[-*\d]+[.)-]?\s+/.test(line))
      .map(line => line.replace(/^[-*\d]+[.)-]?\s+/, '').trim());

    if (bulletActions.length > 0) {
      return bulletActions;
    }

    return ['Review account risk with the rep team.', 'Prepare a targeted follow-up plan for this account.'];
  }
}
