---
name: system-design
description: "Use when designing a real system or writing a system design doc — requirements and non-functional targets, back-of-the-envelope capacity estimates (QPS, storage, bandwidth), API and data model, scaling path, caching, queues, consistency and availability trade-offs, failure modes, SLOs, cost, and rollout plans."
license: MIT
---

# System Design

Makes the agent design systems the way strong senior engineers do at work: start from numbers
and constraints, choose the simplest architecture that meets them, make trade-offs explicit,
plan for failure, and leave a design doc that reviewers can challenge and operators can run.

## When to Use This Skill
- Writing a design doc or RFC for a new service, feature or major change
- Estimating capacity, storage growth or cost before choosing infrastructure
- Deciding between sync vs async, SQL vs NoSQL, cache vs replica, monolith vs services
- Reviewing a proposed architecture for bottlenecks, single points of failure and missing SLOs
- Preparing for a system design interview with practical, defensible reasoning

Deep dives live elsewhere: `microservices`, `message-queues`, `caching-strategies`,
`rate-limiting`, `idempotency`, `multi-tenancy`, `event-sourcing`, `api-design`, `data-modeling`.
Diagrams: `architecture-diagrams`. Recording decisions: `adr-records`. SLOs: `sre-practices`.
Validating estimates: `load-testing`. Security review: `threat-modeling`.

## Workflow
1. **Frame the problem**: users, core use cases (3–5), explicit non-goals, deadlines, team size.
2. **Set non-functional targets with numbers**: peak QPS, p95/p99 latency, availability SLO,
   durability, consistency needs per operation, data residency, budget.
3. **Estimate capacity** (below) and note which numbers are guesses to validate.
4. **Define the API and data model** before boxes: endpoints/events, entities, access patterns, keys.
5. **Draw the simplest design that meets targets**: usually one service + one relational DB + cache + queue.
6. **Deep-dive the hot spots** the estimates expose: the hottest read path, write path, fan-out, large objects.
7. **Walk failure modes**: each dependency slow, down, or returning garbage; region loss; bad deploy.
8. **Cost it** roughly per month at launch and at 10x; name the dominant line item.
9. **Plan rollout and migration**: feature flags, dual writes/backfill, rollback, observability.
10. **Write the doc**, list alternatives considered with why rejected, and get review.

## Back-of-the-Envelope Estimates
```text
seconds/day            = 86,400  (~1e5)
avg QPS                = DAU × actions per user per day / 86,400
peak QPS               = avg × peak factor (measure it; assume 2–5x without data)
read:write ratio       → decides cache/replica vs write scaling
storage/year           = writes/day × bytes per record × 365 × replication factor (+ indexes ~ +30–100%)
bandwidth              = QPS × response bytes
concurrency (Little)   = throughput × latency      e.g. 2,000 rps × 0.05 s = 100 in flight
availability, serial   = product of dependencies   e.g. 0.999 × 0.999 × 0.9995 ≈ 0.9975
downtime budget/month  = 99.9% → ~43.8 min; 99.95% → ~21.9 min; 99.99% → ~4.4 min
```
Worked example — link shortener, 10M DAU, 1 create and 20 redirects per user per day:
writes ≈ 10M / 86,400 ≈ 116/s avg (peak ~500/s); reads ≈ 2,300/s avg (peak ~10k/s);
5 years × 10M/day × 500 B ≈ 9 TB before replication. Conclusion: reads dominate → cache hot
codes at the edge/Redis; writes fit one well-indexed database; storage needs a plan by year two.

Latency orders of magnitude (approximate, for reasoning only): memory access ~100 ns; SSD read
~tens of µs; round trip within a region ~1 ms or less; cross-continent ~70–150 ms. Each extra
cross-region call on the request path costs more than almost any code optimisation.

## Trade-offs to Decide Explicitly
| Decision | Option A → when | Option B → when |
|----------|-----------------|-----------------|
| Scaling a DB | Vertical + read replicas → most apps for a long time | Sharding/partitioning → write throughput or data size beyond one node |
| Consistency | Strong (single leader, transactions) → money, inventory, permissions | Eventual (async replication, caches, events) → feeds, counts, search |
| Communication | Sync request/response → user needs the answer now | Async queue/stream → slow, bursty, retryable or fan-out work |
| Data store | Relational → relationships, transactions, ad-hoc queries | Key-value/document/wide-column → known access patterns at very high scale |
| Caching | Cache-aside with TTL → read-heavy, tolerates staleness | No cache, faster query/index → correctness-critical or low hit rate |
| Architecture | Modular monolith → small team, evolving domain | Services → independent scaling/deploys, clear ownership boundaries |
| Multi-region | Single region + backups → most SLOs ≤ 99.9% | Active-active → regional SLO or residency, accepting conflict handling and cost |

## Design Doc Template
```markdown
# <System> design — <author>, <date>, status: draft|in review|approved
## Context and goals            (problem, users, success metrics, non-goals)
## Requirements                 (functional; non-functional with numbers: QPS, p99, SLO, RPO/RTO)
## Estimates                    (traffic, storage, bandwidth, with assumptions marked)
## API and data model           (endpoints/events, schemas, keys, access patterns)
## Architecture                 (diagram; request path for top 2 flows, step by step)
## Deep dives                   (hot paths, consistency, caching, queues, idempotency)
## Failure modes                (dependency → impact → detection → mitigation)
## Security and privacy         (authn/z, data classification, threat model link)
## Operations                   (SLOs, dashboards, alerts, runbooks, capacity triggers)
## Cost                         (launch and 10x, dominant drivers)
## Rollout and migration        (flags, backfill, rollback, success criteria)
## Alternatives considered      (option, why not)
## Open questions
```

## Rules
- Start from requirements and numbers; never start from a favourite technology.
- Prefer the boring option the team can operate; every new datastore or broker needs an owner and on-call.
- State the consistency requirement per operation, not per system.
- Put timeouts, retries with backoff and jitter, and idempotency on every network hop.
- Design for the next 10x, document what changes at 100x; do not build 100x now.
- Make every async path observable: queue depth, age of oldest message, dead-letter count.
- Write down rejected alternatives and the reasons; that is what reviewers check first.

## Common Mistakes
- **Microservices on day one**: distributed monolith, network failures everywhere. Fix: modular monolith with clear module boundaries.
- **Cache as the source of truth**: data loss on eviction or restart. Fix: the database is the source; cache is disposable.
- **Ignoring the peak**: averages hide the 9am spike. Fix: size for measured peak plus headroom.
- **Synchronous fan-out to many services**: tail latency multiplies. Fix: parallelise with deadlines, or precompute asynchronously.
- **No backpressure**: queues grow without bound. Fix: bounded queues, rate limits, load shedding.
- **Hot keys and celebrity problems**: one shard melts. Fix: key salting, request coalescing, edge caching.
- **No migration or rollback plan**: Fix: expand/contract schema changes and flags (`schema-migrations`, `feature-flags`).

## Verify
- Every non-functional target has a number and a way to measure it (metric, dashboard, SLO).
- Load test the critical path at estimated peak × 1.5 (`load-testing`); compare p99 and saturation with the estimates.
- Run a failure exercise per critical dependency (kill, slow down, return errors) and confirm the documented mitigation works.
- Reviewers can trace the top two request flows end to end from the doc alone.
- Revisit estimates after a month in production and update the doc and capacity triggers.
