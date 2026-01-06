# Python Examples

Comprehensive examples for using Agentic Flow API with Python.

## Table of Contents

- [Installation](#installation)
- [Authentication](#authentication)
- [Agent Execution](#agent-execution)
- [Memory Operations](#memory-operations)
- [Swarm Coordination](#swarm-coordination)
- [Error Handling](#error-handling)
- [Advanced Patterns](#advanced-patterns)

## Installation

```bash
pip install agent-control-plane
# or
poetry add agent-control-plane
```

## Authentication

### Using API Key

```python
from agentic_flow import AgenticFlow

client = AgenticFlow(
    api_key='af_live_1234567890abcdef'
)
```

### Using Environment Variables

```python
import os
from agentic_flow import AgenticFlow

client = AgenticFlow(
    api_key=os.environ.get('AGENTIC_FLOW_API_KEY')
)
```

### With Configuration File

```python
from agentic_flow import AgenticFlow
from dotenv import load_dotenv

load_dotenv()

client = AgenticFlow(
    api_key=os.getenv('AGENTIC_FLOW_API_KEY'),
    base_url=os.getenv('AGENTIC_FLOW_BASE_URL', 'https://api.agent-control-plane.io')
)
```

## Agent Execution

### Basic Agent Execution

```python
def execute_agent():
    result = client.agents.execute(
        agent='coder',
        task='Build a REST API with authentication'
    )

    print(result.output)

if __name__ == '__main__':
    execute_agent()
```

### With Full Configuration

```python
from agentic_flow import AgenticFlow
from agentic_flow.types import AgentExecutionRequest

def execute_agent_configured():
    request = AgentExecutionRequest(
        agent='coder',
        task='Build a REST API with authentication',
        model='claude-sonnet-4-5-20250929',
        provider='anthropic',
        temperature=0.7,
        max_tokens=4096,
        timeout=300000
    )

    response = client.agents.execute(request)

    print(f"Agent: {response.agent}")
    print(f"Execution Time: {response.execution_time}ms")
    print(f"Tokens Used: {response.tokens_used}")
    print(f"Cost: ${response.cost}")
    print(f"\nOutput:\n{response.output}")

if __name__ == '__main__':
    execute_agent_configured()
```

### Streaming Output

```python
def execute_with_streaming():
    stream = client.agents.execute_stream(
        agent='coder',
        task='Build a REST API'
    )

    for chunk in stream:
        print(chunk.token, end='', flush=True)

    print('\n\nCompleted!')

if __name__ == '__main__':
    execute_with_streaming()
```

### Batch Execution

```python
def batch_execute():
    result = client.agents.batch(
        tasks=[
            {
                'agent': 'researcher',
                'task': 'Research REST API best practices'
            },
            {
                'agent': 'coder',
                'task': 'Implement the API endpoints'
            },
            {
                'agent': 'tester',
                'task': 'Write comprehensive tests'
            }
        ],
        max_concurrency=3,
        fail_fast=False
    )

    print(f"Completed: {result.completed}/{result.total_tasks}")

    for i, r in enumerate(result.results):
        status = '✓' if r.success else '✗'
        print(f"\nTask {i}: {status}")
        print(r.output[:100] + '...')

if __name__ == '__main__':
    batch_execute()
```

## Memory Operations

### Store Memory

```python
def store_memory():
    result = client.memory.store(
        key='auth_implementation_pattern',
        value='JWT authentication with refresh tokens works best for stateless APIs',
        metadata={
            'category': 'authentication',
            'confidence': 0.95,
            'source': 'production_experience'
        }
    )

    print(f"Memory stored: {result.memory_id}")

if __name__ == '__main__':
    store_memory()
```

### Retrieve Memory

```python
def retrieve_memory():
    results = client.memory.retrieve(
        query='How to implement authentication in REST API?',
        limit=5,
        threshold=0.7
    )

    print(f"Found {results.count} relevant memories:\n")

    for i, memory in enumerate(results.results):
        print(f"{i + 1}. [{memory.similarity:.2f}] {memory.key}")
        print(f"   {memory.value}\n")

if __name__ == '__main__':
    retrieve_memory()
```

## Swarm Coordination

### Initialize Swarm

```python
def initialize_swarm():
    swarm = client.swarm.init(
        topology='mesh',
        max_agents=10,
        consensus_protocol='raft'
    )

    print(f"Swarm initialized: {swarm.swarm_id}")
    print(f"Topology: {swarm.topology}")
    print(f"Status: {swarm.status}")

    return swarm.swarm_id

if __name__ == '__main__':
    initialize_swarm()
```

### Spawn Agents

```python
import asyncio

async def spawn_agents(swarm_id):
    agents = await asyncio.gather(
        client.swarm.spawn_agent(swarm_id, {
            'agent_type': 'coder',
            'role': 'implementation',
            'capabilities': ['coding', 'refactoring']
        }),
        client.swarm.spawn_agent(swarm_id, {
            'agent_type': 'tester',
            'role': 'quality-assurance',
            'capabilities': ['testing', 'debugging']
        }),
        client.swarm.spawn_agent(swarm_id, {
            'agent_type': 'reviewer',
            'role': 'code-review',
            'capabilities': ['review', 'security']
        })
    )

    print(f"Spawned {len(agents)} agents:")
    for agent in agents:
        print(f"- {agent.agent_id}")

# Usage
async def main():
    swarm_id = await initialize_swarm()
    await spawn_agents(swarm_id)

if __name__ == '__main__':
    asyncio.run(main())
```

## Error Handling

### Basic Error Handling

```python
from agentic_flow.exceptions import AgenticFlowError

def execute_with_error_handling():
    try:
        result = client.agents.execute(
            agent='coder',
            task='Build a REST API'
        )
        print(result.output)
    except AgenticFlowError as e:
        print(f"Error executing agent: {e.message}")

if __name__ == '__main__':
    execute_with_error_handling()
```

### Advanced Error Handling

```python
from agentic_flow.exceptions import (
    ValidationError,
    AuthenticationError,
    RateLimitError,
    AgentError
)
import time

def execute_with_advanced_error_handling():
    try:
        result = client.agents.execute(
            agent='coder',
            task='Build a REST API'
        )
        return result
    except ValidationError as e:
        print(f"Validation error: {e.details}")
        # Fix input and retry
    except AuthenticationError as e:
        print(f"Authentication failed: {e.message}")
        # Refresh token or get new API key
    except RateLimitError as e:
        retry_after = e.retry_after or 60
        print(f"Rate limited. Retrying in {retry_after} seconds...")
        time.sleep(retry_after)
        return execute_with_advanced_error_handling()  # Retry
    except AgentError as e:
        print(f"Agent error: {e.message}")
        raise

if __name__ == '__main__':
    execute_with_advanced_error_handling()
```

### Retry with Exponential Backoff

```python
import time

def execute_with_retry(max_retries=3):
    for i in range(max_retries):
        try:
            return client.agents.execute(
                agent='coder',
                task='Build a REST API'
            )
        except Exception as e:
            if i == max_retries - 1:
                raise

            delay = min(1000 * (2 ** i), 30000) / 1000  # Convert to seconds
            print(f"Retry {i + 1}/{max_retries} after {delay}s...")
            time.sleep(delay)

if __name__ == '__main__':
    execute_with_retry()
```

## Advanced Patterns

### Progress Tracking

```python
from typing import Callable, Optional

class AgentExecutionTracker:
    def __init__(self, client, on_progress: Optional[Callable] = None):
        self.client = client
        self.on_progress = on_progress

    def execute(self, request):
        import time
        start_time = time.time()

        self.emit_progress('started', {'request': request})

        stream = self.client.agents.execute_stream(request)
        output = ''

        for chunk in stream:
            output += chunk.token
            self.emit_progress('token', {'token': chunk.token, 'output': output})

        execution_time = (time.time() - start_time) * 1000
        self.emit_progress('completed', {'output': output, 'execution_time': execution_time})

        return {'success': True, 'output': output, 'execution_time': execution_time}

    def emit_progress(self, event, data):
        if self.on_progress:
            self.on_progress(event, data)

# Usage
def on_progress(event, data):
    if event == 'started':
        print('Agent started...')
    elif event == 'token':
        print(data['token'], end='', flush=True)
    elif event == 'completed':
        print(f"\n\nCompleted in {data['execution_time']}ms")

tracker = AgentExecutionTracker(client, on_progress=on_progress)
result = tracker.execute({
    'agent': 'coder',
    'task': 'Build a REST API'
})
```

### Cost Optimization

```python
def execute_with_cost_optimization(task):
    # Get model recommendations
    optimization = client.agents.optimize(
        agent='coder',
        task=task,
        priority='cost',  # or 'quality', 'speed', 'balanced'
        max_cost=0.01
    )

    print(f"Recommended model: {optimization.recommended_model}")
    print(f"Estimated cost: ${optimization.estimated_cost}")
    print(f"Quality score: {optimization.quality_score}")

    # Execute with recommended settings
    result = client.agents.execute(
        agent='coder',
        task=task,
        model=optimization.recommended_model,
        provider=optimization.provider
    )

    return result

if __name__ == '__main__':
    execute_with_cost_optimization('Build a simple REST API')
```

### Parallel Processing with ThreadPoolExecutor

```python
from concurrent.futures import ThreadPoolExecutor, as_completed

def execute_parallel_tasks(tasks, max_workers=3):
    results = []

    def execute_task(task):
        try:
            return {'success': True, 'result': client.agents.execute(task)}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(execute_task, task): i for i, task in enumerate(tasks)}

        for future in as_completed(futures):
            index = futures[future]
            results.append((index, future.result()))

    # Sort by original order
    results.sort(key=lambda x: x[0])
    return [r[1] for r in results]

# Usage
tasks = [
    {'agent': 'researcher', 'task': 'Research task 1'},
    {'agent': 'researcher', 'task': 'Research task 2'},
    {'agent': 'coder', 'task': 'Code task 1'},
    {'agent': 'coder', 'task': 'Code task 2'},
    {'agent': 'tester', 'task': 'Test task 1'}
]

results = execute_parallel_tasks(tasks, max_workers=3)
successful = sum(1 for r in results if r['success'])
print(f"Completed {successful}/{len(results)} tasks")
```

### Circuit Breaker Pattern

```python
import time
from enum import Enum

class CircuitState(Enum):
    CLOSED = 'CLOSED'
    OPEN = 'OPEN'
    HALF_OPEN = 'HALF_OPEN'

class CircuitBreaker:
    def __init__(self, client, threshold=5, timeout=60, reset_timeout=300):
        self.client = client
        self.threshold = threshold
        self.timeout = timeout
        self.reset_timeout = reset_timeout
        self.failures = 0
        self.state = CircuitState.CLOSED
        self.next_attempt = time.time()

    def execute(self, request):
        if self.state == CircuitState.OPEN:
            if time.time() < self.next_attempt:
                raise Exception('Circuit breaker is OPEN')
            self.state = CircuitState.HALF_OPEN

        try:
            result = self.client.agents.execute(request)
            self.on_success()
            return result
        except Exception as e:
            self.on_failure()
            raise

    def on_success(self):
        self.failures = 0
        self.state = CircuitState.CLOSED

    def on_failure(self):
        self.failures += 1
        if self.failures >= self.threshold:
            self.state = CircuitState.OPEN
            self.next_attempt = time.time() + self.reset_timeout
            print(f"Circuit breaker OPEN. Next attempt at {time.ctime(self.next_attempt)}")

# Usage
breaker = CircuitBreaker(client)

try:
    result = breaker.execute({
        'agent': 'coder',
        'task': 'Build a REST API'
    })
    print(result.output)
except Exception as e:
    print(f"Circuit breaker prevented execution: {e}")
```

## Testing

### Unit Tests with pytest

```python
import pytest
from unittest.mock import Mock, patch
from agentic_flow import AgenticFlow

@pytest.fixture
def client():
    return AgenticFlow(api_key='test-api-key')

def test_execute_agent_success(client):
    with patch.object(client.agents, 'execute') as mock_execute:
        mock_execute.return_value = Mock(
            success=True,
            agent='coder',
            output='Mock output'
        )

        result = client.agents.execute(
            agent='coder',
            task='Test task'
        )

        assert result.success is True
        assert result.agent == 'coder'
        mock_execute.assert_called_once_with(
            agent='coder',
            task='Test task'
        )

def test_execute_agent_error(client):
    with patch.object(client.agents, 'execute') as mock_execute:
        mock_execute.side_effect = Exception('Test error')

        with pytest.raises(Exception, match='Test error'):
            client.agents.execute(agent='coder', task='Test')
```

## Complete Example: Full Workflow

```python
import asyncio
from agentic_flow import AgenticFlow
import os

async def full_workflow():
    client = AgenticFlow(api_key=os.getenv('AGENTIC_FLOW_API_KEY'))

    try:
        # 1. Initialize swarm
        print('Initializing swarm...')
        swarm = await client.swarm.init(
            topology='mesh',
            max_agents=5,
            consensus_protocol='raft'
        )

        # 2. Spawn agents
        print('Spawning agents...')
        await asyncio.gather(
            client.swarm.spawn_agent(swarm.swarm_id, {
                'agent_type': 'researcher',
                'role': 'research'
            }),
            client.swarm.spawn_agent(swarm.swarm_id, {
                'agent_type': 'coder',
                'role': 'implementation'
            }),
            client.swarm.spawn_agent(swarm.swarm_id, {
                'agent_type': 'tester',
                'role': 'quality-assurance'
            })
        )

        # 3. Execute tasks in parallel
        print('Executing tasks...')
        results = await client.agents.batch(
            tasks=[
                {
                    'agent': 'researcher',
                    'task': 'Research microservices architecture patterns'
                },
                {
                    'agent': 'coder',
                    'task': 'Implement user authentication service'
                },
                {
                    'agent': 'tester',
                    'task': 'Write integration tests'
                }
            ],
            max_concurrency=3
        )

        # 4. Store results in memory
        print('Storing results in memory...')
        for result in results.results:
            await client.memory.store(
                key=f"task_{result.task_id}_result",
                value=result.output,
                metadata={
                    'agent': result.agent,
                    'success': result.success,
                    'timestamp': datetime.now().isoformat()
                }
            )

        # 5. Generate summary
        print('\n=== Workflow Summary ===')
        print(f"Swarm ID: {swarm.swarm_id}")
        print(f"Tasks Completed: {results.completed}/{results.total_tasks}")
        print(f"Total Execution Time: {results.total_execution_time}ms")

        return {
            'swarm_id': swarm.swarm_id,
            'results': results.results
        }
    except Exception as e:
        print(f"Workflow failed: {e}")
        raise

if __name__ == '__main__':
    from datetime import datetime
    asyncio.run(full_workflow())
```

---

**Last Updated**: 2025-12-08
**Version**: 1.10.3
