import { AlertEvent, AlertChannelType, ChannelDeliveryStatus } from '../alerts.types';

export interface IAlertChannel {
  readonly channelType: AlertChannelType;
  send(alert: AlertEvent): Promise<ChannelDeliveryStatus>;
  isAvailable(): boolean;
  getRateLimitRemaining(): number;
}

export interface IAlertChannelFactory {
  createChannel(config: Record<string, unknown>): IAlertChannel;
  supports(channelType: AlertChannelType): boolean;
}
