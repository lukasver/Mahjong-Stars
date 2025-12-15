/**
 * Email Queue System
 *
 * Provides async email processing with retry logic and rate limiting.
 * This can be extended to use a proper job queue system like BullMQ or
 * Convex scheduled actions in the future.
 */

import {
  type EmailEventData,
  type EmailEventType,
  emailEvents,
} from "./email-events";

/**
 * Email queue item
 */
interface QueuedEmail {
  id: string;
  eventType: EmailEventType;
  data: EmailEventData;
  attempts: number;
  maxAttempts: number;
  scheduledFor: Date;
  createdAt: Date;
}

/**
 * Email queue configuration
 */
interface EmailQueueConfig {
  maxAttempts?: number;
  retryDelayMs?: number;
  batchSize?: number;
  rateLimitPerMinute?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<EmailQueueConfig> = {
  maxAttempts: 3,
  retryDelayMs: 5000, // 5 seconds
  batchSize: 10,
  rateLimitPerMinute: 60, // Respect Resend's rate limits
};

/**
 * Email Queue Manager
 *
 * In-memory queue implementation. For production, consider:
 * - Using Convex scheduled actions
 * - Integrating with BullMQ/Redis
 * - Using Resend's built-in queuing if available
 */
class EmailQueue {
  private queue: QueuedEmail[] = [];
  private processing = false;
  private config: Required<EmailQueueConfig>;
  private rateLimitTracker: Map<number, number> = new Map(); // timestamp -> count

  constructor(config: EmailQueueConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add email to queue
   */
  async enqueue(
    eventType: EmailEventType,
    data: EmailEventData,
  ): Promise<string> {
    const id = `${eventType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const queuedEmail: QueuedEmail = {
      id,
      eventType,
      data,
      attempts: 0,
      maxAttempts: this.config.maxAttempts,
      scheduledFor: new Date(),
      createdAt: new Date(),
    };

    this.queue.push(queuedEmail);

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue().catch((error) => {
        console.error("Email queue processing error:", error);
      });
    }

    return id;
  }

  /**
   * Process queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;

    this.processing = true;

    try {
      while (this.queue.length > 0) {
        // Check rate limit
        await this.checkRateLimit();

        // Get batch of emails to process
        const batch = this.queue
          .filter((item) => item.scheduledFor <= new Date())
          .slice(0, this.config.batchSize);

        if (batch.length === 0) {
          // No items ready, wait a bit
          await this.delay(1000);
          continue;
        }

        // Process batch
        await Promise.allSettled(batch.map((item) => this.processEmail(item)));

        // Remove processed items
        this.queue = this.queue.filter((item) => !batch.includes(item));
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Process a single email
   */
  private async processEmail(item: QueuedEmail): Promise<void> {
    try {
      item.attempts++;

      // Emit the email event
      await emailEvents.emit(item.eventType, item.data);

      // Success - item will be removed from queue
    } catch (error) {
      console.error(
        `Email processing failed (attempt ${item.attempts}/${item.maxAttempts}):`,
        error,
      );

      // Check if we should retry
      if (item.attempts < item.maxAttempts) {
        // Exponential backoff
        const delay = this.config.retryDelayMs * Math.pow(2, item.attempts - 1);
        item.scheduledFor = new Date(Date.now() + delay);

        // Re-add to queue
        this.queue.push(item);
      } else {
        // Max attempts reached - log for manual review
        console.error(`Email failed after ${item.maxAttempts} attempts:`, {
          id: item.id,
          eventType: item.eventType,
          data: item.data,
        });
        // In production, you might want to send to a dead letter queue
      }
    }
  }

  /**
   * Check and enforce rate limit
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const minuteAgo = now - 60000;

    // Clean old entries
    for (const [timestamp] of this.rateLimitTracker) {
      if (timestamp < minuteAgo) {
        this.rateLimitTracker.delete(timestamp);
      }
    }

    // Count emails sent in the last minute
    const recentCount = Array.from(this.rateLimitTracker.values()).reduce(
      (sum, count) => sum + count,
      0,
    );

    // If at limit, wait
    if (recentCount >= this.config.rateLimitPerMinute) {
      const oldestTimestamp = Math.min(...this.rateLimitTracker.keys());
      const waitTime = 60000 - (now - oldestTimestamp);
      if (waitTime > 0) {
        await this.delay(waitTime);
      }
    }

    // Track this batch
    const currentMinute = Math.floor(now / 60000) * 60000;
    const currentCount = this.rateLimitTracker.get(currentMinute) || 0;
    this.rateLimitTracker.set(currentMinute, currentCount + 1);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get queue status
   */
  getStatus(): {
    queueLength: number;
    processing: boolean;
    pending: number;
    retrying: number;
  } {
    const now = new Date();
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      pending: this.queue.filter((item) => item.scheduledFor <= now).length,
      retrying: this.queue.filter((item) => item.attempts > 0).length,
    };
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = [];
  }
}

/**
 * Default email queue instance
 */
export const emailQueue = new EmailQueue();

/**
 * Queue email helper function
 */
export async function queueEmail(
  eventType: EmailEventType,
  data: EmailEventData,
): Promise<string> {
  return emailQueue.enqueue(eventType, data);
}

export default emailQueue;
