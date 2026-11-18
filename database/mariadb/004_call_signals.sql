-- Persistent, private WebRTC signalling over authenticated HTTP polling.
CREATE TABLE IF NOT EXISTS call_signals (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uid CHAR(36) NOT NULL UNIQUE,
  call_id VARCHAR(255) NOT NULL,
  from_user_id VARCHAR(255) NOT NULL,
  to_user_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(40) NOT NULL,
  payload JSON NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_call_signals_recipient (call_id, to_user_id, id),
  INDEX idx_call_signals_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
