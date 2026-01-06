# Security Architecture

Comprehensive security diagrams showing encryption, authentication, authorization, and compliance patterns.

## Table of Contents

1. [Security Layers](#security-layers)
2. [HIPAA Encryption](#hipaa-encryption)
3. [Authentication Flow](#authentication-flow)
4. [Authorization Model](#authorization-model)
5. [PII Scrubbing](#pii-scrubbing)
6. [Security Monitoring](#security-monitoring)

---

## Security Layers

### Defense in Depth

```mermaid
graph TB
    subgraph "Perimeter Security"
        WAF[Web Application Firewall]
        DDoS[DDoS Protection]
        EDGE_TLS[TLS Termination]
    end

    subgraph "Network Security"
        VPC[Virtual Private Cloud]
        SG[Security Groups]
        ACL[Network ACLs]
        FIREWALL[Internal Firewall]
    end

    subgraph "Application Security"
        AUTH[Authentication]
        AUTHZ[Authorization]
        RATE_LIMIT[Rate Limiting]
        INPUT_VAL[Input Validation]
    end

    subgraph "Data Security"
        ENCRYPTION[Data Encryption]
        KEY_MGR[Key Management]
        PII_SCRUB[PII Scrubbing]
        ACCESS_CTRL[Access Control]
    end

    subgraph "Infrastructure Security"
        SECRETS[Secrets Management]
        IAM[Identity & Access Mgmt]
        AUDIT[Audit Logging]
        MONITOR[Security Monitoring]
    end

    subgraph "Compliance"
        HIPAA[HIPAA Compliance]
        GDPR[GDPR Compliance]
        SOC2[SOC 2 Controls]
    end

    WAF --> VPC
    DDoS --> VPC
    EDGE_TLS --> VPC

    VPC --> SG
    SG --> ACL
    ACL --> FIREWALL

    FIREWALL --> AUTH
    AUTH --> AUTHZ
    AUTHZ --> RATE_LIMIT
    RATE_LIMIT --> INPUT_VAL

    INPUT_VAL --> ENCRYPTION
    ENCRYPTION --> KEY_MGR
    KEY_MGR --> PII_SCRUB
    PII_SCRUB --> ACCESS_CTRL

    ACCESS_CTRL --> SECRETS
    SECRETS --> IAM
    IAM --> AUDIT
    AUDIT --> MONITOR

    MONITOR --> HIPAA
    MONITOR --> GDPR
    MONITOR --> SOC2

    style WAF fill:#ef5350
    style AUTH fill:#ff9800
    style ENCRYPTION fill:#ba68c8
    style HIPAA fill:#4caf50
```

---

## HIPAA Encryption

### Encryption Architecture

```mermaid
graph TB
    subgraph "Key Management"
        KEK[Key Encryption Key<br/>Env Variable]
        KM[Key Manager]
        MASTER_KEY[Master Encryption Keys]
        ROTATION[Key Rotation Policy<br/>90 days]
    end

    subgraph "Encryption Layer"
        HIPAA_ENC[HIPAA Encryption Service]
        AES_GCM[AES-256-GCM]
        IV_GEN[IV Generator]
        AUTH_TAG[Authentication Tag]
    end

    subgraph "Data Types"
        PHI[Protected Health Information]
        PII[Personally Identifiable Info]
        SENSITIVE[Sensitive Business Data]
    end

    subgraph "Storage"
        ENCRYPTED_DB[(Encrypted Database)]
        VECTOR_STORE[(Encrypted Vectors)]
        FILE_STORE[Encrypted Files]
    end

    subgraph "Audit & Compliance"
        ACCESS_LOG[Access Logs]
        ENCRYPTION_LOG[Encryption Events]
        COMPLIANCE_REPORT[Compliance Reports]
    end

    KEK --> KM
    KM --> MASTER_KEY
    MASTER_KEY --> ROTATION
    ROTATION -.->|Triggers| KM

    MASTER_KEY --> HIPAA_ENC
    HIPAA_ENC --> AES_GCM
    AES_GCM --> IV_GEN
    AES_GCM --> AUTH_TAG

    PHI --> HIPAA_ENC
    PII --> HIPAA_ENC
    SENSITIVE --> HIPAA_ENC

    HIPAA_ENC --> ENCRYPTED_DB
    HIPAA_ENC --> VECTOR_STORE
    HIPAA_ENC --> FILE_STORE

    HIPAA_ENC -.-> ACCESS_LOG
    HIPAA_ENC -.-> ENCRYPTION_LOG
    ACCESS_LOG --> COMPLIANCE_REPORT
    ENCRYPTION_LOG --> COMPLIANCE_REPORT

    style KEK fill:#ff9800
    style MASTER_KEY fill:#ba68c8
    style HIPAA_ENC fill:#ef5350
    style AES_GCM fill:#d32f2f
    style PHI fill:#4caf50
    style COMPLIANCE_REPORT fill:#42a5f5
```

### Encryption/Decryption Flow

```mermaid
sequenceDiagram
    participant App
    participant HIPAAEnc as HIPAA Encryption
    participant KeyMgr as Key Manager
    participant Crypto as Crypto Module
    participant DB as Database

    Note over App,DB: Encryption Process
    App->>HIPAAEnc: encrypt(plaintext, options)
    HIPAAEnc->>KeyMgr: getMasterKey()
    KeyMgr-->>HIPAAEnc: masterKey

    HIPAAEnc->>Crypto: generateIV()
    Crypto-->>HIPAAEnc: iv (16 bytes)

    HIPAAEnc->>Crypto: createCipher(AES-256-GCM, key, iv)
    Crypto-->>HIPAAEnc: cipher

    HIPAAEnc->>Crypto: cipher.update(plaintext)
    HIPAAEnc->>Crypto: cipher.final()
    Crypto-->>HIPAAEnc: ciphertext

    HIPAAEnc->>Crypto: cipher.getAuthTag()
    Crypto-->>HIPAAEnc: authTag (16 bytes)

    HIPAAEnc->>HIPAAEnc: package(iv + authTag + ciphertext)
    HIPAAEnc-->>App: encryptedData

    App->>DB: store(encryptedData)
    DB-->>App: stored

    Note over App,DB: Decryption Process
    App->>DB: retrieve(id)
    DB-->>App: encryptedData

    App->>HIPAAEnc: decrypt(encryptedData)
    HIPAAEnc->>HIPAAEnc: extract(iv, authTag, ciphertext)
    HIPAAEnc->>KeyMgr: getMasterKey()
    KeyMgr-->>HIPAAEnc: masterKey

    HIPAAEnc->>Crypto: createDecipher(AES-256-GCM, key, iv)
    Crypto-->>HIPAAEnc: decipher

    HIPAAEnc->>Crypto: decipher.setAuthTag(authTag)
    HIPAAEnc->>Crypto: decipher.update(ciphertext)
    HIPAAEnc->>Crypto: decipher.final()

    alt Authentication Success
        Crypto-->>HIPAAEnc: plaintext
        HIPAAEnc-->>App: decrypted data
    else Authentication Failed
        Crypto-->>HIPAAEnc: Error (data tampered)
        HIPAAEnc-->>App: DecryptionError
    end
```

---

## Authentication Flow

### Multi-Factor Authentication

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant AuthServer
    participant MFA as MFA Service
    participant DB as User DB
    participant Session

    Note over User,Session: Phase 1: Credentials
    User->>Client: Enter username/password
    Client->>AuthServer: POST /auth/login
    AuthServer->>DB: verifyCredentials(username, password)

    alt Invalid Credentials
        DB-->>AuthServer: Invalid
        AuthServer-->>Client: 401 Unauthorized
        Client-->>User: Invalid credentials
    else Valid Credentials
        DB-->>AuthServer: Valid
        AuthServer->>AuthServer: Generate MFA challenge
        AuthServer->>MFA: sendChallenge(user, method)

        Note over User,Session: Phase 2: MFA
        MFA->>User: SMS/Email with code
        AuthServer-->>Client: MFA Required

        User->>Client: Enter MFA code
        Client->>AuthServer: POST /auth/mfa
        AuthServer->>MFA: verifyCode(user, code)

        alt Invalid MFA Code
            MFA-->>AuthServer: Invalid
            AuthServer-->>Client: 401 MFA Failed
        else Valid MFA Code
            MFA-->>AuthServer: Valid
            AuthServer->>Session: createSession(user)
            Session-->>AuthServer: sessionToken

            Note over User,Session: Phase 3: Session
            AuthServer-->>Client: 200 OK (accessToken, refreshToken)
            Client-->>User: Login successful
        end
    end
```

### Token-Based Authentication

```mermaid
flowchart TD
    LOGIN[User Login] --> VALIDATE{Validate<br/>Credentials}

    VALIDATE -->|Invalid| ERROR[Return 401 Error]
    VALIDATE -->|Valid| GENERATE[Generate Tokens]

    GENERATE --> ACCESS_TOKEN[Access Token<br/>JWT, expires 15min]
    GENERATE --> REFRESH_TOKEN[Refresh Token<br/>Opaque, expires 30 days]

    ACCESS_TOKEN --> STORE_ACCESS[Store in Memory]
    REFRESH_TOKEN --> STORE_REFRESH[Store in HttpOnly Cookie]

    STORE_ACCESS --> RESPONSE[Return to Client]
    STORE_REFRESH --> RESPONSE

    RESPONSE --> API_CALL{API<br/>Request}

    API_CALL --> CHECK_TOKEN{Verify<br/>Access Token}

    CHECK_TOKEN -->|Valid| AUTHORIZE[Authorize Request]
    CHECK_TOKEN -->|Expired| REFRESH_FLOW[Refresh Flow]
    CHECK_TOKEN -->|Invalid| ERROR

    REFRESH_FLOW --> CHECK_REFRESH{Verify<br/>Refresh Token}

    CHECK_REFRESH -->|Valid| GENERATE
    CHECK_REFRESH -->|Invalid| REQUIRE_LOGIN[Require Re-login]

    AUTHORIZE --> PROCESS[Process Request]
    PROCESS --> SUCCESS[Return Response]

    style LOGIN fill:#42a5f5
    style GENERATE fill:#66bb6a
    style AUTHORIZE fill:#4caf50
    style ERROR fill:#ef5350
    style REQUIRE_LOGIN fill:#ff9800
```

---

## Authorization Model

### Role-Based Access Control (RBAC)

```mermaid
graph TB
    subgraph "Users"
        USER1[User 1]
        USER2[User 2]
        USER3[User 3]
    end

    subgraph "Roles"
        ADMIN[Administrator]
        COORDINATOR[Swarm Coordinator]
        AGENT_MGR[Agent Manager]
        VIEWER[Viewer]
    end

    subgraph "Permissions"
        P1[swarm:create]
        P2[swarm:read]
        P3[swarm:update]
        P4[swarm:delete]
        P5[agent:spawn]
        P6[agent:read]
        P7[agent:terminate]
        P8[task:create]
        P9[task:read]
        P10[memory:read]
        P11[memory:write]
    end

    subgraph "Resources"
        R1[Swarms]
        R2[Agents]
        R3[Tasks]
        R4[Memory]
        R5[Configuration]
    end

    USER1 --> ADMIN
    USER2 --> COORDINATOR
    USER3 --> VIEWER

    ADMIN --> P1
    ADMIN --> P2
    ADMIN --> P3
    ADMIN --> P4
    ADMIN --> P5
    ADMIN --> P6
    ADMIN --> P7
    ADMIN --> P8
    ADMIN --> P9
    ADMIN --> P10
    ADMIN --> P11

    COORDINATOR --> P1
    COORDINATOR --> P2
    COORDINATOR --> P3
    COORDINATOR --> P5
    COORDINATOR --> P6
    COORDINATOR --> P8
    COORDINATOR --> P9
    COORDINATOR --> P10
    COORDINATOR --> P11

    AGENT_MGR --> P2
    AGENT_MGR --> P5
    AGENT_MGR --> P6
    AGENT_MGR --> P7
    AGENT_MGR --> P9
    AGENT_MGR --> P10

    VIEWER --> P2
    VIEWER --> P6
    VIEWER --> P9
    VIEWER --> P10

    P1 --> R1
    P2 --> R1
    P3 --> R1
    P4 --> R1
    P5 --> R2
    P6 --> R2
    P7 --> R2
    P8 --> R3
    P9 --> R3
    P10 --> R4
    P11 --> R4

    style ADMIN fill:#ef5350
    style COORDINATOR fill:#ff9800
    style AGENT_MGR fill:#66bb6a
    style VIEWER fill:#42a5f5
```

### Permission Check Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant AuthZ as Authorization Service
    participant RBAC as RBAC Engine
    participant PolicyDB as Policy Database

    Client->>API: Request with Access Token
    API->>API: Extract user from token

    API->>AuthZ: authorize(user, resource, action)
    AuthZ->>RBAC: checkPermission(user, resource, action)

    RBAC->>PolicyDB: getUserRoles(user)
    PolicyDB-->>RBAC: roles[]

    RBAC->>PolicyDB: getRolePermissions(roles)
    PolicyDB-->>RBAC: permissions[]

    RBAC->>RBAC: Match permission (resource:action)

    alt Permission Granted
        RBAC-->>AuthZ: Authorized
        AuthZ-->>API: Allow
        API->>API: Process request
        API-->>Client: 200 OK (result)
    else Permission Denied
        RBAC-->>AuthZ: Unauthorized
        AuthZ-->>API: Deny
        API-->>Client: 403 Forbidden
    end
```

---

## PII Scrubbing

### PII Detection and Scrubbing

```mermaid
flowchart TD
    INPUT[Input Data] --> SCAN[Scan for PII]

    SCAN --> DETECT{Detect<br/>PII Types}

    DETECT -->|Email| EMAIL_PATTERN[Email Pattern<br/>example@domain.com]
    DETECT -->|SSN| SSN_PATTERN[SSN Pattern<br/>XXX-XX-XXXX]
    DETECT -->|Phone| PHONE_PATTERN[Phone Pattern<br/>XXX-XXX-XXXX]
    DETECT -->|Credit Card| CC_PATTERN[Credit Card Pattern<br/>XXXX-XXXX-XXXX-XXXX]
    DETECT -->|API Key| API_PATTERN[API Key Pattern<br/>sk_xxx...]
    DETECT -->|IP Address| IP_PATTERN[IP Pattern<br/>XXX.XXX.XXX.XXX]

    EMAIL_PATTERN --> SCRUB_EMAIL[Scrub: email@*****.com]
    SSN_PATTERN --> SCRUB_SSN[Scrub: ***-**-XXXX]
    PHONE_PATTERN --> SCRUB_PHONE[Scrub: ***-***-XXXX]
    CC_PATTERN --> SCRUB_CC[Scrub: ****-****-****-XXXX]
    API_PATTERN --> SCRUB_API[Scrub: sk_***REDACTED***]
    IP_PATTERN --> SCRUB_IP[Scrub: ***.***.***.***]

    SCRUB_EMAIL --> AGGREGATE[Aggregate Scrubbed Data]
    SCRUB_SSN --> AGGREGATE
    SCRUB_PHONE --> AGGREGATE
    SCRUB_CC --> AGGREGATE
    SCRUB_API --> AGGREGATE
    SCRUB_IP --> AGGREGATE

    AGGREGATE --> LOG[Log PII Detection Event]
    LOG --> OUTPUT[Clean Output Data]

    style INPUT fill:#42a5f5
    style DETECT fill:#ff9800
    style SCRUB_EMAIL fill:#ba68c8
    style SCRUB_SSN fill:#ba68c8
    style SCRUB_CC fill:#ba68c8
    style OUTPUT fill:#4caf50
```

### PII Scrubbing Pipeline

```mermaid
sequenceDiagram
    participant Source
    participant PIIScrubber
    participant Patterns
    participant Audit
    participant Sink

    Source->>PIIScrubber: Input text with PII
    PIIScrubber->>Patterns: Load scrubbing patterns

    Patterns-->>PIIScrubber: Regex patterns loaded

    loop For each pattern
        PIIScrubber->>PIIScrubber: Search for pattern
        alt Pattern Found
            PIIScrubber->>PIIScrubber: Replace with mask
            PIIScrubber->>Audit: Log PII detection
            Audit-->>PIIScrubber: Logged
        end
    end

    PIIScrubber->>PIIScrubber: Validate scrubbed output
    PIIScrubber-->>Sink: Scrubbed text

    Sink->>Sink: Store safe data
```

---

## Security Monitoring

### Security Event Pipeline

```mermaid
graph TB
    subgraph "Event Sources"
        AUTH_EVENTS[Authentication Events]
        ACCESS_EVENTS[Access Events]
        ENCRYPTION_EVENTS[Encryption Events]
        ANOMALY_EVENTS[Anomaly Detection]
    end

    subgraph "Collection"
        EVENT_COLLECTOR[Security Event Collector]
        EVENT_BUFFER[Event Buffer]
    end

    subgraph "Analysis"
        THREAT_DETECT[Threat Detection]
        PATTERN_MATCH[Pattern Matching]
        ML_ANALYSIS[ML-based Analysis]
        RISK_SCORE[Risk Scoring]
    end

    subgraph "Response"
        AUTO_BLOCK[Auto-block]
        ALERT[Security Alert]
        INCIDENT[Create Incident]
        AUDIT_LOG[Audit Log]
    end

    subgraph "Monitoring"
        SIEM[SIEM Dashboard]
        SOC[SOC Team]
        COMPLIANCE[Compliance Reports]
    end

    AUTH_EVENTS --> EVENT_COLLECTOR
    ACCESS_EVENTS --> EVENT_COLLECTOR
    ENCRYPTION_EVENTS --> EVENT_COLLECTOR
    ANOMALY_EVENTS --> EVENT_COLLECTOR

    EVENT_COLLECTOR --> EVENT_BUFFER
    EVENT_BUFFER --> THREAT_DETECT
    EVENT_BUFFER --> PATTERN_MATCH
    EVENT_BUFFER --> ML_ANALYSIS

    THREAT_DETECT --> RISK_SCORE
    PATTERN_MATCH --> RISK_SCORE
    ML_ANALYSIS --> RISK_SCORE

    RISK_SCORE -->|High Risk| AUTO_BLOCK
    RISK_SCORE -->|Medium Risk| ALERT
    RISK_SCORE -->|Low Risk| AUDIT_LOG

    AUTO_BLOCK --> INCIDENT
    ALERT --> INCIDENT
    INCIDENT --> SOC

    AUDIT_LOG --> SIEM
    INCIDENT --> SIEM
    SIEM --> COMPLIANCE
    SOC --> COMPLIANCE

    style EVENT_COLLECTOR fill:#42a5f5
    style RISK_SCORE fill:#ff9800
    style AUTO_BLOCK fill:#ef5350
    style SOC fill:#4caf50
```

---

## Related Documentation

- [System Architecture](./SYSTEM_ARCHITECTURE.md) - Overall system design
- [Deployment](./DEPLOYMENT.md) - Infrastructure security
- [Error Handling](./ERROR_HANDLING.md) - Security error flows
- [Data Flow](./DATA_FLOW.md) - Encrypted data flows
- [Agent Lifecycle](./AGENT_LIFECYCLE.md) - Secure agent management

---

**Last Updated**: 2025-12-08
**Diagram Count**: 9 interactive Mermaid.js diagrams
