---
name: agentic-cloud-user-tools
description: User management, storage, and system utilities
---

# Agentic Cloud User Tools

Utilities for user management, storage, and system operations.

## Profile Management

```javascript
// Get profile
mcp__agentic -
  cloud__user_profile({
    user_id: 'your_id',
  });

// Update profile
mcp__agentic -
  cloud__user_update_profile({
    user_id: 'your_id',
    updates: {
      full_name: 'New Name',
      bio: 'Developer interested in AI',
      github_username: 'username',
    },
  });

// Get statistics
mcp__agentic -
  cloud__user_stats({
    user_id: 'your_id',
  });
```

## Storage Management

```javascript
// Upload file
mcp__agentic -
  cloud__storage_upload({
    bucket: 'my-bucket',
    path: 'data/file.json',
    content: JSON.stringify(data),
    content_type: 'application/json',
  });

// List files
mcp__agentic -
  cloud__storage_list({
    bucket: 'my-bucket',
    path: 'data/',
    limit: 100,
  });

// Get public URL
mcp__agentic -
  cloud__storage_get_url({
    bucket: 'my-bucket',
    path: 'data/file.json',
    expires_in: 3600, // seconds
  });

// Delete file
mcp__agentic -
  cloud__storage_delete({
    bucket: 'my-bucket',
    path: 'data/file.json',
  });
```

## Real-time Subscriptions

```javascript
// Subscribe to database changes
mcp__agentic -
  cloud__realtime_subscribe({
    table: 'tasks',
    event: 'INSERT', // UPDATE, DELETE, *
    filter: 'status=eq.pending',
  });

// List subscriptions
mcp__agentic - cloud__realtime_list();

// Unsubscribe
mcp__agentic -
  cloud__realtime_unsubscribe({
    subscription_id: 'sub_id',
  });
```

## Execution Monitoring

```javascript
// Monitor execution stream
mcp__agentic -
  cloud__execution_stream_subscribe({
    stream_type: 'gendev-swarm',
    deployment_id: 'deployment_id',
  });

// Get stream status
mcp__agentic -
  cloud__execution_stream_status({
    stream_id: 'stream_id',
  });

// List generated files
mcp__agentic -
  cloud__execution_files_list({
    stream_id: 'stream_id',
    created_by: 'gendev',
    file_type: 'javascript',
  });

// Get file content
mcp__agentic -
  cloud__execution_file_get({
    file_id: 'file_id',
  });
```

## System Health

```javascript
// Check system health
mcp__agentic - cloud__system_health();

// View audit logs
mcp__agentic -
  cloud__audit_log({
    user_id: 'your_id',
    limit: 100,
  });
```

## Queen Seraphina Chat

```javascript
// Seek guidance from Queen Seraphina
mcp__agentic -
  cloud__seraphina_chat({
    message: 'How should I architect my distributed system?',
    enable_tools: true, // Allow her to create swarms/deploy code
    conversation_history: [
      { role: 'user', content: 'Previous message' },
      { role: 'assistant', content: 'Previous response' },
    ],
  });
```

## Email Verification

```javascript
mcp__agentic -
  cloud__user_verify_email({
    token: 'verification_token_from_email',
  });
```

## Storage Buckets

- **public**: Publicly accessible files
- **private**: User-only access
- **shared**: Team collaboration
- **temp**: Auto-deleted after 24h

## Best Practices

1. Use appropriate storage buckets
2. Set expiration on temporary URLs
3. Monitor real-time subscriptions
4. Clean up unused subscriptions
5. Regular audit log reviews
6. Enable 2FA for security (coming soon)
