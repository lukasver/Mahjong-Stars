/**
 * Event-driven email notification system
 *
 * This module provides a scalable way to trigger emails based on domain events.
 * Emails are decoupled from business logic, making the system more maintainable
 * and testable.
 */

import { templates } from "@mjs/emails";
import notificator from "./index";

type EmailTemplate = keyof typeof templates;

/**
 * Email event types
 */
export type EmailEventType =
  | "user.email_verified"
  | "kyc.verified"
  | "kyc.rejected"
  | "transaction.tokens_distributed"
  | "transaction.refunded"
  | "transaction.payment_reminder"
  | "sale.starting_soon"
  | "sale.closing_soon"
  | "sale.milestone"
  | "security.alert";

/**
 * Base email event data
 */
interface BaseEmailEventData {
  to: string | string[];
  subject: string;
  from?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

/**
 * Email event data for each event type
 */
export interface EmailEventData extends BaseEmailEventData {
  eventType: EmailEventType;
  template: keyof typeof templates;
  props: Record<string, unknown>;
}

/**
 * Email event handler function type
 */
type EmailEventHandler = (data: EmailEventData) => Promise<void>;

/**
 * Event emitter for email notifications
 */
class EmailEventEmitter {
  private handlers: Map<EmailEventType, EmailEventHandler[]> = new Map();

  /**
   * Register an event handler
   */
  on(eventType: EmailEventType, handler: EmailEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Remove an event handler
   */
  off(eventType: EmailEventType, handler: EmailEventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit an email event
   */
  async emit(eventType: EmailEventType, data: EmailEventData): Promise<void> {
    const handlers = this.handlers.get(eventType) || [];

    // Execute all handlers in parallel
    await Promise.allSettled(
      handlers.map((handler) =>
        handler(data).catch((error) => {
          console.error(`Email event handler failed for ${eventType}:`, error);
          // Don't throw - allow other handlers to execute
        }),
      ),
    );
  }

  /**
   * Clear all handlers for an event type
   */
  clear(eventType?: EmailEventType): void {
    if (eventType) {
      this.handlers.delete(eventType);
    } else {
      this.handlers.clear();
    }
  }
}

/**
 * Default email event emitter instance
 */
export const emailEvents = new EmailEventEmitter();

/**
 * Default email handler that sends emails via the notificator
 */
const defaultEmailHandler: EmailEventHandler = async (data) => {
  await notificator.send({
    template: data.template as EmailTemplate,
    props: data.props,
    to: Array.isArray(data.to)
      ? data.to.map((email) => ({ email }))
      : { email: data.to },
    subject: data.subject,
    from: data.from,
    replyTo: data.replyTo,
    tags: data.tags,
  });
};

/**
 * Register default email handler for all event types
 */
const eventTypes: EmailEventType[] = [
  "user.email_verified",
  "kyc.verified",
  "kyc.rejected",
  "transaction.tokens_distributed",
  "transaction.refunded",
  "transaction.payment_reminder",
  "sale.starting_soon",
  "sale.closing_soon",
  "sale.milestone",
  "security.alert",
];

eventTypes.forEach((eventType) => {
  emailEvents.on(eventType, defaultEmailHandler);
});

/**
 * Helper functions to emit common email events
 */
export const emailEventHelpers = {
  /**
   * Emit user email verified event
   */
  async userEmailVerified(data: {
    userName: string;
    userEmail: string;
    dashboardUrl?: string;
    supportEmail?: string;
    companyName?: string;
  }): Promise<void> {
    await emailEvents.emit("user.email_verified", {
      eventType: "user.email_verified",
      template: "postRegistrationWelcome",
      to: data.userEmail,
      subject: `Welcome to ${data.companyName || "our platform"}!`,
      props: {
        userName: data.userName,
        dashboardUrl: data.dashboardUrl,
        supportEmail: data.supportEmail,
        companyName: data.companyName,
      },
      tags: [{ name: "type", value: "onboarding" }],
    });
  },

  /**
   * Emit KYC verified event
   */
  async kycVerified(data: {
    userName: string;
    userEmail: string;
    kycTier?: string;
    purchaseLimit?: string;
    dashboardUrl?: string;
    salesUrl?: string;
    supportEmail?: string;
    tokenName?: string;
  }): Promise<void> {
    await emailEvents.emit("kyc.verified", {
      eventType: "kyc.verified",
      template: "kycVerified",
      to: data.userEmail,
      subject: "🎉 KYC Verification Complete!",
      props: {
        userName: data.userName,
        kycTier: data.kycTier,
        purchaseLimit: data.purchaseLimit,
        dashboardUrl: data.dashboardUrl,
        salesUrl: data.salesUrl,
        supportEmail: data.supportEmail,
        tokenName: data.tokenName,
      },
      tags: [{ name: "type", value: "kyc" }],
    });
  },

  /**
   * Emit KYC rejected event
   */
  async kycRejected(data: {
    userName: string;
    userEmail: string;
    rejectionReason?: string;
    resubmitUrl?: string;
    supportEmail?: string;
    tokenName?: string;
  }): Promise<void> {
    await emailEvents.emit("kyc.rejected", {
      eventType: "kyc.rejected",
      template: "kycRejected",
      to: data.userEmail,
      subject: "KYC Verification Update - Action Required",
      props: {
        userName: data.userName,
        rejectionReason: data.rejectionReason,
        resubmitUrl: data.resubmitUrl,
        supportEmail: data.supportEmail,
        tokenName: data.tokenName,
      },
      tags: [{ name: "type", value: "kyc" }],
    });
  },

  /**
   * Emit tokens distributed event
   */
  async tokensDistributed(data: {
    userName: string;
    userEmail: string;
    tokenName: string;
    tokenSymbol: string;
    tokenAmount: string;
    walletAddress: string;
    transactionHash?: string;
    transactionUrl?: string;
    distributionDate: string;
    vestingSchedule?: string;
    dashboardUrl?: string;
    supportEmail?: string;
  }): Promise<void> {
    await emailEvents.emit("transaction.tokens_distributed", {
      eventType: "transaction.tokens_distributed",
      template: "tokensDistributed",
      to: data.userEmail,
      subject: `🎉 Your ${data.tokenAmount} ${data.tokenSymbol} tokens have been distributed!`,
      props: {
        userName: data.userName,
        tokenName: data.tokenName,
        tokenSymbol: data.tokenSymbol,
        tokenAmount: data.tokenAmount,
        walletAddress: data.walletAddress,
        transactionHash: data.transactionHash,
        transactionUrl: data.transactionUrl,
        distributionDate: data.distributionDate,
        vestingSchedule: data.vestingSchedule,
        dashboardUrl: data.dashboardUrl,
        supportEmail: data.supportEmail,
      },
      tags: [{ name: "type", value: "transaction" }],
    });
  },

  /**
   * Emit refund processed event
   */
  async refundProcessed(data: {
    userName: string;
    userEmail: string;
    refundAmount: string;
    refundCurrency: string;
    transactionId: string;
    refundMethod: string;
    refundTimeline?: string;
    refundReason?: string;
    dashboardUrl?: string;
    supportEmail?: string;
    tokenName?: string;
  }): Promise<void> {
    await emailEvents.emit("transaction.refunded", {
      eventType: "transaction.refunded",
      template: "refundProcessed",
      to: data.userEmail,
      subject: `Refund Processed - ${data.refundAmount} ${data.refundCurrency}`,
      props: {
        userName: data.userName,
        refundAmount: data.refundAmount,
        refundCurrency: data.refundCurrency,
        transactionId: data.transactionId,
        refundMethod: data.refundMethod,
        refundTimeline: data.refundTimeline,
        refundReason: data.refundReason,
        dashboardUrl: data.dashboardUrl,
        supportEmail: data.supportEmail,
        tokenName: data.tokenName,
      },
      tags: [{ name: "type", value: "transaction" }],
    });
  },

  /**
   * Emit payment reminder event
   */
  async paymentReminder(data: {
    userName: string;
    userEmail: string;
    tokenName: string;
    tokenSymbol: string;
    purchaseAmount: string;
    paidCurrency: string;
    transactionId: string;
    paymentDeadline?: string;
    paymentInstructions?: string;
    paymentUrl?: string;
    dashboardUrl?: string;
    supportEmail?: string;
  }): Promise<void> {
    await emailEvents.emit("transaction.payment_reminder", {
      eventType: "transaction.payment_reminder",
      template: "paymentReminder",
      to: data.userEmail,
      subject: `Payment Reminder - Complete your ${data.tokenName} purchase`,
      props: {
        userName: data.userName,
        tokenName: data.tokenName,
        tokenSymbol: data.tokenSymbol,
        purchaseAmount: data.purchaseAmount,
        paidCurrency: data.paidCurrency,
        transactionId: data.transactionId,
        paymentDeadline: data.paymentDeadline,
        paymentInstructions: data.paymentInstructions,
        paymentUrl: data.paymentUrl,
        dashboardUrl: data.dashboardUrl,
        supportEmail: data.supportEmail,
      },
      tags: [{ name: "type", value: "transaction" }],
    });
  },

  /**
   * Emit sale starting soon event
   */
  async saleStartingSoon(data: {
    userEmails: string[];
    tokenName: string;
    tokenSymbol: string;
    saleStartTime: string;
    tokenPrice?: string;
    minPurchase?: string;
    maxPurchase?: string;
    totalTokens?: string;
    saleUrl?: string;
    kycRequired?: boolean;
    calendarUrl?: string;
    supportEmail?: string;
  }): Promise<void> {
    await emailEvents.emit("sale.starting_soon", {
      eventType: "sale.starting_soon",
      template: "saleStartingSoon",
      to: data.userEmails,
      subject: `🚀 ${data.tokenName} Sale Starting Soon!`,
      props: {
        tokenName: data.tokenName,
        tokenSymbol: data.tokenSymbol,
        saleStartTime: data.saleStartTime,
        tokenPrice: data.tokenPrice,
        minPurchase: data.minPurchase,
        maxPurchase: data.maxPurchase,
        totalTokens: data.totalTokens,
        saleUrl: data.saleUrl,
        kycRequired: data.kycRequired,
        calendarUrl: data.calendarUrl,
        supportEmail: data.supportEmail,
      },
      tags: [{ name: "type", value: "sale" }],
    });
  },

  /**
   * Emit sale closing soon event
   */
  async saleClosingSoon(data: {
    userEmails: string[];
    tokenName: string;
    tokenSymbol: string;
    saleEndTime: string;
    tokensRemaining?: string;
    progressPercentage?: string;
    totalRaised?: string;
    saleUrl?: string;
    supportEmail?: string;
  }): Promise<void> {
    await emailEvents.emit("sale.closing_soon", {
      eventType: "sale.closing_soon",
      template: "saleClosingSoon",
      to: data.userEmails,
      subject: `⏰ ${data.tokenName} Sale Closing Soon!`,
      props: {
        tokenName: data.tokenName,
        tokenSymbol: data.tokenSymbol,
        saleEndTime: data.saleEndTime,
        tokensRemaining: data.tokensRemaining,
        progressPercentage: data.progressPercentage,
        totalRaised: data.totalRaised,
        saleUrl: data.saleUrl,
        supportEmail: data.supportEmail,
      },
      tags: [{ name: "type", value: "sale" }],
    });
  },

  /**
   * Emit sale milestone event
   */
  async saleMilestone(data: {
    userEmails: string[];
    tokenName: string;
    tokenSymbol: string;
    milestone: string;
    progressPercentage: string;
    totalRaised?: string;
    tokensSold?: string;
    tokensRemaining?: string;
    saleUrl?: string;
    shareUrl?: string;
    supportEmail?: string;
  }): Promise<void> {
    await emailEvents.emit("sale.milestone", {
      eventType: "sale.milestone",
      template: "saleMilestone",
      to: data.userEmails,
      subject: `🎉 ${data.tokenName} Sale Milestone - ${data.milestone} Complete!`,
      props: {
        tokenName: data.tokenName,
        tokenSymbol: data.tokenSymbol,
        milestone: data.milestone,
        progressPercentage: data.progressPercentage,
        totalRaised: data.totalRaised,
        tokensSold: data.tokensSold,
        tokensRemaining: data.tokensRemaining,
        saleUrl: data.saleUrl,
        shareUrl: data.shareUrl,
        supportEmail: data.supportEmail,
      },
      tags: [{ name: "type", value: "sale" }],
    });
  },

  /**
   * Emit security alert event
   */
  async securityAlert(data: {
    userName: string;
    userEmail: string;
    alertType:
    | "login"
    | "email_change"
    | "password_change"
    | "device_change"
    | "other";
    eventDescription: string;
    eventTime: string;
    eventLocation?: string;
    deviceInfo?: string;
    ipAddress?: string;
    actionUrl?: string;
    supportEmail?: string;
    tokenName?: string;
  }): Promise<void> {
    await emailEvents.emit("security.alert", {
      eventType: "security.alert",
      template: "securityAlert",
      to: data.userEmail,
      subject: "Security Alert - Account Activity",
      props: {
        userName: data.userName,
        alertType: data.alertType,
        eventDescription: data.eventDescription,
        eventTime: data.eventTime,
        eventLocation: data.eventLocation,
        deviceInfo: data.deviceInfo,
        ipAddress: data.ipAddress,
        actionUrl: data.actionUrl,
        supportEmail: data.supportEmail,
        tokenName: data.tokenName,
      },
      tags: [{ name: "type", value: "security" }],
    });
  },
};

export default emailEvents;
