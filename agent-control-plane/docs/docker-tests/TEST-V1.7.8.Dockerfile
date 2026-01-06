# Test agent-control-plane v1.7.8 with fixed agentdb dependency
FROM node:18-alpine

RUN apk add --no-cache python3 make g++ sqlite sqlite-dev

WORKDIR /test

RUN echo "========================================" && \
    echo "Testing npx agent-control-plane@latest" && \
    echo "========================================" && \
    npx agent-control-plane@latest --version 2>&1 | head -20

CMD ["echo", "✅ Test complete"]
