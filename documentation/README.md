# Let's Glance Documentation

This directory is the source of truth for architecture, request flows, performance decisions, and operational behavior.

## Documentation structure

- Architecture documents describe system boundaries and ownership.
- Flowcharts show services, data movement, caches, and external integrations.
- Sequence diagrams show request timing, authentication, mutations, and failure paths.
- Performance documents record budgets, measurements, bottlenecks, and verified optimizations.
- Architecture Decision Records explain important decisions, alternatives, and trade-offs.

## Diagram format

Use Mermaid diagrams inside Markdown so they remain version-controlled, reviewable, searchable, and renderable in GitHub and Cursor.

Every diagram must:

- Reflect implemented or explicitly proposed behavior.
- Name trust boundaries, cache layers, and network hops.
- Show failure paths where they affect system behavior.
- Avoid invented services or interactions.
- Stay synchronized with the related implementation.

## Current documents

- [BFF architecture and ownership](./bff-architecture.md)
- [Same-EC2 production deployment](./ec2-deployment.md)

## Planned documents

- Authentication request sequence
- Feed loading and prefetch flow
- Swipe mutation and optimistic update flow
- Multi-layer caching architecture
- Image upload and CDN delivery flow
- Rendering, chunking, and hydration strategy
