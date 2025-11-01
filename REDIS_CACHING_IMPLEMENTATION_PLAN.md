# Redis Caching Implementation Plan for Board Queries

## Overview

This document outlines the comprehensive plan for implementing Redis caching in the `src/lib/server/db/queries/board-queries.ts` file to improve performance and reduce database load.

## Analysis of Current Board Queries

### Cacheable Operations (Read-Heavy)
1. **`getAll(userId, onlyDeleted)`** - Frequently accessed, good candidate for caching
2. **`getWithColumnsAndTasksById(userId, boardId)`** - Complex query with joins, excellent caching candidate

### Write Operations (Cache Invalidation Required)
1. **`create(userId, boardData)`** - Invalidate user's board list cache
2. **`createWithDefaultColumns(userId, boardData)`** - Invalidate user's board list cache
3. **`updateById(userId, boardObj)`** - Invalidate specific board and list caches
4. **`deleteById(userId, boardId)`** - Invalidate specific board and list caches
5. **`unDeleteById(userId, boardId)`** - Invalidate specific board and list caches
6. **`deletePermanentlyById(userId, boardId)`** - Invalidate specific board and list caches

## Cache Key Strategy

### Key Naming Convention
```
boards:{organizationId}:{userId}:all:{onlyDeleted}
boards:{organizationId}:{userId}:board:{boardId}
boards:{organizationId}:invalidation_set
```

### Key Structure
- **Board List Cache**: `boards:{orgId}:{userId}:all:{deleted}` (boolean: true/false)
- **Individual Board Cache**: `boards:{orgId}:{userId}:board:{boardId}`
- **Invalidation Set**: `boards:{orgId}:invalidation_set` (Redis Set for tracking cache keys)

## TTL Configuration

### Cache Expiration Times
- **Board List Cache**: 15 minutes (900 seconds) - frequently updated
- **Individual Board Cache**: 30 minutes (1800 seconds) - less frequently updated
- **Invalidation Set**: 24 hours (86400 seconds) - for cleanup purposes

## Implementation Strategy

### 1. Cache-Aside Pattern for Read Operations

#### For `getAll()`:
```typescript
async getAll(userId: string, onlyDeleted = false) {
  const activeOrgId = await getActiveOrganizationId(userId);
  if (!activeOrgId) return undefined;

  const cacheKey = `boards:${activeOrgId}:${userId}:all:${onlyDeleted}`;

  // Try cache first
  const cached = await redis.get<Board[]>(cacheKey);
  if (cached) return cached;

  // Fallback to database
  const boards = await db.query.board.findMany({...});

  // Cache the result
  if (boards) {
    await redis.set(cacheKey, boards, { ex: 900 }); // 15 minutes
    await redis.sadd(`boards:${activeOrgId}:invalidation_set`, cacheKey);
  }

  return boards;
}
```

#### For `getWithColumnsAndTasksById()`:
```typescript
async getWithColumnsAndTasksById(userId: string, boardId: string, onlyDeleted = false) {
  const activeOrgId = await getActiveOrganizationId(userId);
  if (!activeOrgId) return undefined;

  const cacheKey = `boards:${activeOrgId}:${userId}:board:${boardId}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  // Fallback to database
  const board = await db.query.board.findFirst({...});

  // Cache the result
  if (board) {
    await redis.set(cacheKey, board, { ex: 1800 }); // 30 minutes
    await redis.sadd(`boards:${activeOrgId}:invalidation_set`, cacheKey);
  }

  return board;
}
```

### 2. Cache Invalidation for Write Operations

#### Invalidation Helper Function:
```typescript
async function invalidateBoardCaches(organizationId: string, userId?: string, boardId?: string) {
  const pipeline = redis.pipeline()

  if (boardId && userId) {
    // Invalidate specific board cache
    pipeline.del(`boards:${organizationId}:${userId}:board:${boardId}`)
  }

  if (userId) {
    // Invalidate user's board lists
    pipeline.del(`boards:${organizationId}:${userId}:all:false`)
    pipeline.del(`boards:${organizationId}:${userId}:all:true`)
  }
  else {
    // Invalidate all board lists for the organization
    const invalidationSet = `boards:${organizationId}:invalidation_set`
    const keysToInvalidate = await redis.smembers(invalidationSet)

    if (keysToInvalidate.length > 0) {
      pipeline.del(...keysToInvalidate)
      pipeline.del(invalidationSet)
    }
  }

  await pipeline.exec()
}
```

#### For Write Operations:
```typescript
async create(userId: string, boardData: BoardData) {
  try {
    const activeOrgId = await getActiveOrganizationId(userId);
    if (!activeOrgId) return undefined;

    const [newBoard] = await db.insert(board).values({...}).returning();

    // Invalidate caches
    await invalidateBoardCaches(activeOrgId, userId);

    return newBoard;
  } catch (error) {
    console.error('ERROR: while `create` in boards.\n', error);
    return undefined;
  }
}
```

## Error Handling Strategy

### Cache Failure Resilience
```typescript
async function getCachedData<T>(key: string, fallback: () => Promise<T>): Promise<T> {
  try {
    const cached = await redis.get<T>(key)
    if (cached !== null)
      return cached
  }
  catch (error) {
    console.warn(`Cache read failed for key ${key}:`, error)
    // Continue to fallback
  }

  return await fallback()
}

async function setCachedData<T>(key: string, data: T, ttl: number): Promise<void> {
  try {
    await redis.set(key, data, { ex: ttl })
  }
  catch (error) {
    console.warn(`Cache write failed for key ${key}:`, error)
    // Don't throw - cache failures shouldn't break the application
  }
}
```

## Performance Considerations

### 1. Auto-Pipelining
- Enable auto-pipelining in Redis client for better performance
- Batch multiple cache operations when possible

### 2. Cache Warming
- Consider implementing cache warming for frequently accessed boards
- Pre-populate cache during low-traffic periods

### 3. Memory Management
- Monitor Redis memory usage
- Implement cache eviction policies if needed
- Use appropriate TTL values to prevent memory bloat

## Monitoring and Observability

### Cache Metrics to Track
1. **Cache Hit Rate**: Percentage of requests served from cache
2. **Cache Miss Rate**: Percentage of requests that hit the database
3. **Cache Invalidation Frequency**: How often caches are invalidated
4. **Average Response Time**: Before and after caching implementation

### Logging Strategy
```typescript
// Add cache operation logging
console.log(`Cache HIT for key: ${cacheKey}`)
console.log(`Cache MISS for key: ${cacheKey}`)
console.log(`Cache INVALIDATED for pattern: boards:${orgId}:*`)
```

## Implementation Steps

1. **Import Redis client** from `../cache`
2. **Add cache helper functions** for get/set operations with error handling
3. **Implement cache invalidation helper** function
4. **Update read operations** (`getAll`, `getWithColumnsAndTasksById`) with cache-aside pattern
5. **Update write operations** with cache invalidation
6. **Add comprehensive error handling** for cache failures
7. **Test thoroughly** to ensure data consistency

## Testing Strategy

### Unit Tests
- Test cache hit/miss scenarios
- Test cache invalidation logic
- Test error handling when Redis is unavailable

### Integration Tests
- Test end-to-end board operations with caching
- Verify data consistency between cache and database
- Test concurrent access scenarios

### Performance Tests
- Measure response time improvements
- Test cache behavior under load
- Monitor memory usage patterns

## Rollback Plan

### If Issues Arise
1. **Feature Flag**: Implement a feature flag to disable caching
2. **Graceful Degradation**: Ensure application works without cache
3. **Monitoring**: Set up alerts for cache-related errors
4. **Quick Disable**: Environment variable to bypass caching

## Future Enhancements

### Potential Improvements
1. **Cache Warming**: Pre-populate frequently accessed data
2. **Smart Invalidation**: More granular invalidation strategies
3. **Cache Compression**: Compress large objects before caching
4. **Distributed Caching**: Consider cache replication for high availability
5. **Cache Analytics**: Detailed analytics on cache performance

## Configuration

### Environment Variables
```env
# Redis Configuration (already exists)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Cache Configuration (optional)
BOARD_CACHE_TTL_SECONDS=900
BOARD_LIST_CACHE_TTL_SECONDS=1800
ENABLE_BOARD_CACHING=true
```

This implementation plan provides a robust, scalable caching solution that will significantly improve the performance of board-related operations while maintaining data consistency and providing graceful degradation in case of cache failures.
