import crypto from 'crypto';

/**
 * Encapsulates Samsara webhook signature validation logic.
 * Keeps secret handling isolated so other modules can simply
 * ask the verifier to check a payload/signature pair.
 */
export class SamsaraWebhookVerifier {
  private readonly secret: string;

  constructor(secret: string) {
    if (!secret) {
      throw new Error('Samsara webhook secret is required');
    }
    this.secret = secret;
  }

  /**
   * Factory helper that loads the secret from environment variables.
   * Falls back to SAMSARA_API_KEY for legacy setups so existing installs
   * keep working while teams migrate to a dedicated webhook secret.
   */
  static fromEnvironment(): SamsaraWebhookVerifier {
    const secret = process.env.SAMSARA_WEBHOOK_SECRET || process.env.SAMSARA_API_KEY;
    if (!secret) {
      throw new Error('Samsara webhook secret or API key not configured');
    }

    return new SamsaraWebhookVerifier(secret);
  }

  verify(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto.createHmac('sha256', this.secret).update(payload).digest('hex');

      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch (error) {
      console.error('Samsara webhook verification failed:', error);
      return false;
    }
  }
}

