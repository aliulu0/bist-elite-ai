import { Injectable } from '@nestjs/common';
import {
  DashboardTimelineWidget,
  TimelineEvent,
} from './types';

@Injectable()
export class DashboardTimelineService {
  private opportunityEvents: TimelineEvent[] = [];
  private recommendationEvents: TimelineEvent[] = [];
  private portfolioEvents: TimelineEvent[] = [];
  private regimeEvents: TimelineEvent[] = [];

  addOpportunityEvent(event: Omit<TimelineEvent, 'id'>): TimelineEvent {
    const newEvent: TimelineEvent = { ...event, id: `tl-opp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` };
    this.opportunityEvents.unshift(newEvent);
    this.opportunityEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return newEvent;
  }

  addRecommendationEvent(event: Omit<TimelineEvent, 'id'>): TimelineEvent {
    const newEvent: TimelineEvent = { ...event, id: `tl-rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` };
    this.recommendationEvents.unshift(newEvent);
    this.recommendationEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return newEvent;
  }

  addPortfolioEvent(event: Omit<TimelineEvent, 'id'>): TimelineEvent {
    const newEvent: TimelineEvent = { ...event, id: `tl-pf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` };
    this.portfolioEvents.unshift(newEvent);
    this.portfolioEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return newEvent;
  }

  addRegimeEvent(event: Omit<TimelineEvent, 'id'>): TimelineEvent {
    const newEvent: TimelineEvent = { ...event, id: `tl-rg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` };
    this.regimeEvents.unshift(newEvent);
    this.regimeEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return newEvent;
  }

  getOpportunityEvents(limit: number = 20): TimelineEvent[] {
    return this.opportunityEvents.slice(0, limit);
  }

  getRecommendationEvents(limit: number = 20): TimelineEvent[] {
    return this.recommendationEvents.slice(0, limit);
  }

  getPortfolioEvents(limit: number = 20): TimelineEvent[] {
    return this.portfolioEvents.slice(0, limit);
  }

  getRegimeEvents(limit: number = 20): TimelineEvent[] {
    return this.regimeEvents.slice(0, limit);
  }

  getWidget(limit: number = 20): DashboardTimelineWidget {
    return {
      opportunityTimeline: this.opportunityEvents.slice(0, limit),
      recommendationTimeline: this.recommendationEvents.slice(0, limit),
      portfolioTimeline: this.portfolioEvents.slice(0, limit),
      regimeTimeline: this.regimeEvents.slice(0, limit),
      lastUpdated: new Date().toISOString(),
    };
  }

  getTotalEvents(): number {
    return this.opportunityEvents.length + this.recommendationEvents.length + this.portfolioEvents.length + this.regimeEvents.length;
  }

  clearAll(): void {
    this.opportunityEvents = [];
    this.recommendationEvents = [];
    this.portfolioEvents = [];
    this.regimeEvents = [];
  }

  getEventsBySymbol(symbol: string): TimelineEvent[] {
    const all = [
      ...this.opportunityEvents,
      ...this.recommendationEvents,
      ...this.portfolioEvents,
      ...this.regimeEvents,
    ];
    return all
      .filter(e => e.symbol === symbol)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getEventsByType(type: string): TimelineEvent[] {
    const all = [
      ...this.opportunityEvents,
      ...this.recommendationEvents,
      ...this.portfolioEvents,
      ...this.regimeEvents,
    ];
    return all
      .filter(e => e.type === type)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getEventsInRange(startTime: Date, endTime: Date): TimelineEvent[] {
    const all = [
      ...this.opportunityEvents,
      ...this.recommendationEvents,
      ...this.portfolioEvents,
      ...this.regimeEvents,
    ];
    return all
      .filter(e => {
        const t = new Date(e.timestamp).getTime();
        return t >= startTime.getTime() && t <= endTime.getTime();
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}
