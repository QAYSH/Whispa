# WhisperBox — End-to-End Encrypted Messaging

> A secure real-time messaging application where encryption happens entirely on the client. The server never sees plaintext — only you and your recipient can read your messages.

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=for-the-badge)](https://whispa.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## 📖 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Encryption Flow](#-encryption-flow)
- [Key Management](#-key-management)
- [Security Trade-offs](#%EF%B8%8F-security-trade-offs)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Known Limitations](#-known-limitations)

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                     │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  React   │  │  Zustand  │  │  Crypto  │  │ WebSocket  │  │
│  │  Pages   │→ │  Store    │→ │  Layer   │→ │  Client    │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
│       │                           │              │          │
│       │    ┌──────────────────────┘              │          │
│       │    │  Web Crypto API                     │          │
│       │    │  • RSA-OAEP 2048                    │          │
│       │    │  • AES-GCM 256                      │          │
│       │    │  • PBKDF2 + AES-KW                  │          │
│       │    └──────────────────────                │          │
│       │                                          │          │
│  ━━━━━┿━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┿━━━━━━━━  │
│       │         ONLY CIPHERTEXT CROSSES          │          │
│  ━━━━━┿━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┿━━━━━━━━  │
└───────┼──────────────────────────────────────────┼──────────┘
        │               HTTPS / WSS               │
        ▼                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVER (WhisperBox API)                   │
│                                                             │
│  • Stores encrypted blobs verbatim                          │
│  • Manages user identities & auth (JWT)                     │
│  • Handles encrypted key exchange                           │
│  • Routes messages via WebSocket / REST                     │
│  • NEVER decrypts or inspects payloads                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Separation of Concerns

| Responsibility | Client | Server |
|---|:---:|:---:|
| Key generation | ✅ | ❌ |
| Encryption / Decryption | ✅ | ❌ |
| Private key storage | ✅ (memory) | ❌ |
| Public key storage | ✅ | ✅ |
| Authentication (JWT) | ✅ | ✅ |
| Message routing | ❌ | ✅ |
| Ciphertext storage | ❌ | ✅ |

---

## 🔐 Encryption Flow

### Sending a Message

```
Sender                                              Recipient
  │                                                      │
  │  1. Generate random AES-256-GCM key + 96-bit IV     │
  │  2. Encrypt plaintext with AES key                   │
  │  3. Encrypt AES key with recipient's RSA public key  │
  │  4. Encrypt AES key with sender's own public key     │
  │  5. Send {ciphertext, iv, encryptedKey,              │
  │           encryptedKeyForSelf} to server              │
  │───────────────── encrypted blob ────────────────────→│
  │                                                      │
  │                  Server stores blob                   │
  │                  (cannot decrypt)                     │
  │                                                      │
  │                                                      │
  │                  6. Recipient receives blob           │
  │                  7. Decrypt encryptedKey with         │
  │                     private RSA key                   │
  │                  8. Use recovered AES key to          │
  │                     decrypt ciphertext                │
  │                  9. Display plaintext                 │
```

### Hybrid Encryption Detail

Each message uses a **fresh random AES-GCM key** (never reused). The AES key itself is encrypted twice:

1. **`encryptedKey`** — encrypted with the **recipient's RSA-OAEP public key** so only they can decrypt
2. **`encryptedKeyForSelf`** — encrypted with the **sender's RSA-OAEP public key** so the sender can re-read their own sent messages

This approach combines the speed of symmetric encryption (AES-GCM) with the security of asymmetric key exchange (RSA-OAEP).

---

## 🔑 Key Management

### Registration Flow

```
1. Client generates RSA-OAEP 2048-bit keypair
2. Client generates random 128-bit PBKDF2 salt
3. Client derives AES-KW wrapping key from password (100,000 iterations)
4. Client wraps private key with AES-KW wrapping key
5. Client sends to server:
   - Public key (base64)
   - Wrapped private key (base64)
   - PBKDF2 salt (base64)
   - Password (hashed server-side with bcrypt)
```

### Login Flow

```
1. Server returns: wrapped_private_key, pbkdf2_salt, public_key
2. Client re-derives wrapping key from password + salt
3. Client unwraps private key into CryptoKey object (memory only)
4. Private key is NEVER persisted to storage
5. Keys are held in Zustand store (in-memory)
```

### Key Storage Summary

| Key Material | Where | Encrypted? |
|---|---|---|
| RSA Public Key | Server + Client memory | No (public) |
| RSA Private Key | Client memory only | Yes (AES-KW wrapped on server) |
| AES Wrapping Key | Derived at login, never stored | N/A (derived) |
| PBKDF2 Salt | Server | No (salt is not secret) |
| Per-message AES Key | Generated per message, never stored | Yes (RSA-OAEP encrypted in payload) |

---

## ⚖️ Security Trade-offs

### What We Do Well
- **Zero-knowledge server** — the server stores only ciphertext blobs
- **Per-message keys** — each message uses a fresh AES-GCM key, limiting blast radius
- **No plaintext private key storage** — private key wrapped with password-derived key
- **PBKDF2 with 100K iterations** — resistant to brute-force password attacks
- **Session-only tokens** — access tokens in sessionStorage, cleared on tab close
- **Security headers** — X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy

### Known Trade-offs

| Trade-off | Risk | Mitigation |
|---|---|---|
| **No forward secrecy** | If RSA private key is compromised, past messages could be decrypted | Per-message AES keys limit window; future: Diffie-Hellman ratchet (Signal protocol) |
| **No replay protection** | A captured encrypted blob could be re-submitted | Server-side message IDs prevent exact duplicates; timestamps provide ordering |
| **RSA-2048 vs RSA-4096** | 2048-bit provides ~112-bit security, sufficient for near-term | Could upgrade to 4096-bit or ECDH P-384 for stronger guarantees |
| **Password-derived wrapping** | Wrapping key is only as strong as the user's password | PBKDF2 with 100K iterations + password strength requirements mitigate |
| **In-memory key storage** | Keys are lost on page refresh (requires re-login) | Better UX vs IndexedDB persistence (which has XSS risks) |
| **No key pinning** | MITM could theoretically substitute public keys | Trust-on-first-use model; future: key fingerprint verification UI |

---

## ✨ Features

- **End-to-End Encryption** — AES-256-GCM + RSA-OAEP 2048-bit hybrid scheme
- **Real-time Messaging** — WebSocket with automatic reconnection
- **REST Fallback** — Messages sent via REST when WebSocket unavailable
- **JWT Auth** — Secure token-based authentication with auto-refresh
- **User Search** — Find and message any registered user
- **Conversation History** — Load and decrypt past messages
- **Message Status** — Sending → Sent → Delivered visual indicators
- **E2EE Indicators** — Lock icons and badges confirming encryption
- **Responsive Design** — Desktop sidebar + mobile slide-out panel
- **Graceful Error Handling** — Decryption failures shown as `[Failed to decrypt]`

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| State | Zustand |
| HTTP | Axios (with interceptors) |
| Crypto | Web Crypto API |
| Icons | Lucide React |
| Routing | React Router v7 |
| Deployment | Vercel |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Install & Run

```bash
# Clone
git clone https://github.com/your-username/whispa.git
cd whispa

# Install dependencies
npm install

# Start dev server (with API proxy)
npm run dev

# Build for production
npm run build
```

### Environment

- **Development**: API requests are proxied through Vite (`/api` → `https://whisperbox.koyeb.app`)
- **Production**: Direct API calls to `https://whisperbox.koyeb.app`

---

## 🚧 Known Limitations

1. **No forward secrecy** — uses static RSA keypairs rather than ephemeral Diffie-Hellman exchanges
2. **Keys lost on refresh** — private key lives only in memory; page refresh requires re-login
3. **No offline support** — messages cannot be composed or queued when fully offline
4. **No file/media sharing** — text messages only
5. **No read receipts** — `read` status is a UI placeholder, not server-tracked
6. **No key verification UI** — users cannot compare key fingerprints out-of-band
7. **Single device** — no multi-device key sync mechanism

---

## 📂 Project Structure

```
src/
├── api/                    # API layer (auth, messages, users)
│   ├── auth.ts             # Register, login, logout, refresh
│   ├── client.ts           # Axios instance with interceptors
│   ├── message.ts          # Send/receive messages, conversations
│   └── user.ts             # User search, public key retrieval
├── components/
│   ├── Chat/               # Chat UI components
│   │   ├── MessageBubble   # Message display with status
│   │   ├── MobileSidebar   # Responsive slide-out panel
│   │   └── TypingIndicator # Typing animation
│   ├── Common/             # Shared components
│   │   ├── Avatar          # Initial-based colored avatar
│   │   ├── EmptyState      # Placeholder screens
│   │   └── EncryptedBadge  # E2EE indicator
│   └── Conversation/       # Conversation list components
├── crypto/                 # All encryption logic
│   ├── aes.ts              # AES-GCM 256-bit encrypt/decrypt
│   ├── rsa.ts              # RSA-OAEP 2048-bit operations
│   ├── hybrid.ts           # Combined AES+RSA hybrid scheme
│   └── KeyDerivation.ts    # PBKDF2 + AES-KW key wrapping
├── hooks/                  # Custom React hooks
│   ├── useWebsocket.ts     # WebSocket with auto-reconnect
│   └── useDebounce.ts      # Input debounce utility
├── pages/                  # Route pages
│   ├── Login.tsx           # Login with key unwrapping
│   ├── Register.tsx        # Registration with key generation
│   └── Chat.tsx            # Main messaging interface
├── store/                  # Zustand state management
│   └── useStore.ts         # Auth, crypto, and message stores
├── types/                  # TypeScript interfaces
│   └── index.ts            # User, Message, Conversation types
└── utils/                  # Utility functions
    └── conversations.ts    # Conversation list helpers
```

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.
