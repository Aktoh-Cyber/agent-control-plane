/**
 * SMS Notification Service
 * Twilio/AWS SNS-based SMS delivery with HIPAA compliance
 */

import {
  INotifier,
  NotificationChannel,
  NotificationPayload,
  NotificationResult,
  NotificationStatus,
  SMSConfig,
} from './types';

export class SMSNotifier implements INotifier {
  private config: SMSConfig;
  private deliveryLog: Map<string, NotificationResult>;
  private readonly maxSmsLength: number;

  constructor(config: SMSConfig) {
    this.config = config;
    this.deliveryLog = new Map();
    this.maxSmsLength = config.maxLength || 160;
  }

  /**
   * Send SMS notification with character limit enforcement
   */
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const result: NotificationResult = {
      id: payload.id,
      channel: NotificationChannel.SMS,
      status: NotificationStatus.PENDING,
      sentAt: new Date(),
    };

    try {
      // Validate recipient has phone number
      if (!payload.recipient.phone) {
        throw new Error('Recipient phone number not provided');
      }

      // Format phone number
      const phoneNumber = this.formatPhoneNumber(payload.recipient.phone);

      // Build SMS content (truncate if needed)
      const smsContent = this.buildSMSContent(payload);

      // Send SMS via provider
      const sent = await this.sendSMS({
        to: phoneNumber,
        from: this.config.fromNumber,
        body: smsContent,
      });

      if (sent) {
        result.status = NotificationStatus.SENT;
        result.deliveredAt = new Date();
        result.metadata = {
          messageId: `sms-${Date.now()}`,
          recipient: phoneNumber,
          segments: Math.ceil(smsContent.length / this.maxSmsLength),
        };
      }

      this.deliveryLog.set(payload.id, result);
      return result;
    } catch (error) {
      result.status = NotificationStatus.FAILED;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      this.deliveryLog.set(payload.id, result);
      throw error;
    }
  }

  /**
   * Get delivery status of SMS notification
   */
  async getStatus(notificationId: string): Promise<NotificationStatus> {
    const result = this.deliveryLog.get(notificationId);
    return result?.status || NotificationStatus.PENDING;
  }

  /**
   * Cancel pending SMS notification
   */
  async cancel(notificationId: string): Promise<boolean> {
    const result = this.deliveryLog.get(notificationId);
    if (result && result.status === NotificationStatus.PENDING) {
      result.status = NotificationStatus.FAILED;
      result.error = 'Cancelled by user';
      return true;
    }
    return false;
  }

  /**
   * Build SMS content from notification payload
   */
  private buildSMSContent(payload: NotificationPayload): string {
    const priorityPrefix = payload.priority === 'emergency' ? '🚨 URGENT: ' : '';
    const message = `${priorityPrefix}${payload.title}\n\n${payload.message}`;

    // Truncate if exceeds SMS length
    if (message.length > this.maxSmsLength) {
      const truncated = message.substring(0, this.maxSmsLength - 3) + '...';
      return truncated;
    }

    return message;
  }

  /**
   * Format phone number to E.164 standard
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Add country code if missing (assuming US)
    if (digits.length === 10) {
      return `+1${digits}`;
    }

    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }

    // Already formatted or international
    return phone.startsWith('+') ? phone : `+${digits}`;
  }

  /**
   * Send SMS via provider (Twilio/AWS SNS)
   */
  private async sendSMS(sms: { to: string; from: string; body: string }): Promise<boolean> {
    if (this.config.provider === 'aws-sns') {
      // Dynamic import — requires @aws-sdk/client-sns to be installed
      let SNSClient: any, PublishCommand: any;
      try {
        const mod = await import('@aws-sdk/client-sns' as string);
        SNSClient = mod.SNSClient;
        PublishCommand = mod.PublishCommand;
      } catch {
        throw new Error(
          'AWS SNS provider requires @aws-sdk/client-sns. Install it with: npm install @aws-sdk/client-sns'
        );
      }
      const sns = new SNSClient({});
      const command = new PublishCommand({
        PhoneNumber: sms.to,
        Message: sms.body,
        MessageAttributes: {
          'AWS.SNS.SMS.SenderID': {
            DataType: 'String',
            StringValue: 'Horsemen',
          },
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional',
          },
        },
      });
      const result = await sns.send(command);
      return !!result.MessageId;
    }

    if (this.config.provider === 'twilio') {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString('base64')}`,
          },
          body: new URLSearchParams({
            To: sms.to,
            From: sms.from,
            Body: sms.body,
          }),
        }
      );
      if (!response.ok) {
        throw new Error(`Twilio API error: ${response.status}`);
      }
      return true;
    }

    throw new Error(`Unsupported SMS provider: ${this.config.provider}`);
  }

  /**
   * Get SMS delivery report from provider
   */
  async getDeliveryReport(messageId: string): Promise<{
    status: string;
    errorCode?: string;
    errorMessage?: string;
  }> {
    if (this.config.provider === 'twilio') {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages/${messageId}.json`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString('base64')}`,
          },
        }
      );
      if (!response.ok) {
        return { status: 'unknown', errorMessage: `Twilio API error: ${response.status}` };
      }
      const data = await response.json();
      return {
        status: data.status,
        errorCode: data.error_code?.toString(),
        errorMessage: data.error_message,
      };
    }

    // AWS SNS does not support per-message delivery reports via API;
    // delivery status is tracked via CloudWatch or SNS delivery status logging.
    return { status: 'sent' };
  }
}
