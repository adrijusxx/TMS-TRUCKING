/**
 * NetSapiens API v2 TypeScript types
 *
 * API Documentation: https://docs.ns-api.com/reference
 * Auth: Bearer API Key (nsd_ prefix = domain/office-manager scope)
 */

// ============================================
// CONFIGURATION
// ============================================

export interface NSConfig {
  apiKey: string;
  baseUrl: string;   // e.g. https://yokopbx.com/ns-api/v2
  domain: string;    // auto-discovered via GET /domains/~
}

// ============================================
// DOMAIN & USERS
// ============================================

export interface NSDomain {
  domain: string;
  description?: string;
  territory?: string;
  dial_plan?: string;
  max_user?: number;
  time_zone?: string;
}

export interface NSUser {
  user: string;           // extension number
  domain: string;
  name_first?: string;
  name_last?: string;
  name_full?: string;
  email?: string;
  scope?: string;         // 'Basic User', 'Office Manager', etc.
  dial?: string;          // DID number
  subscriber_login?: string;
  department?: string;
  site?: string;
  time_zone?: string;
}

// ============================================
// ACTIVE CALLS
// ============================================

export interface NSActiveCall {
  callid: string;
  orig_callid?: string;
  orig_from_user?: string;
  orig_from_name?: string;
  orig_to_user?: string;
  orig_to_name?: string;
  term_from_user?: string;
  term_to_user?: string;
  time_start?: string;
  time_answer?: string;
  duration?: number;
  direction?: string;
  call_type?: string;
  state?: string;
}

export interface NSCallInitiateParams {
  destination: string;
  origination?: string;   // answer device phone number
  auto?: 'yes' | 'no';
}

export interface NSCallResult {
  success: boolean;
  callId?: string;
  error?: string;
}

// ============================================
// CDR (Call Detail Records)
// ============================================

export interface NSCdr {
  cdr_id?: string;
  callid?: string;
  orig_callid?: string;
  orig_from_uri?: string;
  orig_from_user?: string;
  orig_from_name?: string;
  orig_to_uri?: string;
  orig_to_user?: string;
  orig_to_name?: string;
  term_from_uri?: string;
  term_to_uri?: string;
  time_start: string;
  time_answer?: string;
  time_release?: string;
  duration?: number;
  time_talking?: number;
  time_ringing?: number;
  direction?: string;         // 'inbound' | 'outbound' | 'internal'
  call_type?: string;
  release_cause?: string;
  release_text?: string;
  recording_url?: string;
  has_recording?: boolean;
  // Transcription & sentiment (if available)
  transcription?: string;
  sentiment?: string;
}

export interface NSCdrQueryParams {
  startDate?: string;       // ISO date
  endDate?: string;         // ISO date
  user?: string;            // filter by extension
  direction?: string;       // inbound | outbound | internal
  limit?: number;
  offset?: number;
}

// ============================================
// MESSAGING / SMS
// ============================================

export interface NSSmsMessage {
  to: string;
  from: string;
  message: string;
}

export interface NSMessageSession {
  session_id?: string;
  participants?: string[];
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

// ============================================
// VOICEMAIL
// ============================================

export interface NSVoicemail {
  id: string;
  folder: string;           // 'new' | 'saved' | 'deleted'
  from?: string;
  from_name?: string;
  to?: string;
  duration?: number;
  created_at?: string;
  audio_url?: string;
  transcription?: string;
  read?: boolean;
}

// ============================================
// RECORDINGS
// ============================================

export interface NSRecording {
  callid: string;
  url: string;
  duration?: number;
  created_at?: string;
  file_size?: number;
}

// ============================================
// CONTACTS
// ============================================

export interface NSContact {
  id?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  phone_number?: string;
  phone_mobile?: string;
  phone_business?: string;
  email?: string;
  notes?: string;
}

// ============================================
// EVENT SUBSCRIPTIONS
// ============================================

export interface NSSubscription {
  id?: string;
  event: string;            // e.g. 'call', 'sms', 'voicemail'
  target_url: string;
  active?: boolean;
  created_at?: string;
}

// ============================================
// DEVICES
// ============================================

export interface NSDevice {
  aor: string;              // Address of Record (e.g., "101@domain")
  device?: string;          // Device identifier
  mac_address?: string;
  model?: string;
  user?: string;            // Extension
  domain?: string;
  device_type?: string;     // 'sip', 'webrtc', etc.
  transport?: string;       // 'udp', 'tcp', 'tls', 'wss'
  auth_username?: string;   // SIP auth username (may differ from extension)
  sip_password?: string;    // SIP auth password (if exposed by API)
  registration_status?: string;
  contact?: string;         // SIP Contact URI
  user_agent?: string;      // UA string
}

// ============================================
// API RESPONSE WRAPPERS
// ============================================

export interface NSPaginatedResponse<T> {
  data: T[];
  total?: number;
  limit?: number;
  offset?: number;
}

export interface NSApiError {
  error?: string;
  message?: string;
  status?: number;
}
