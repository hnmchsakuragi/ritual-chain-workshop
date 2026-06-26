# 🔐 Privacy-Preserving AI Bounty Judge

A commit-reveal bounty system powered by **on-chain AI judging** via [Ritual Chain](https://ritual.net) precompiles. Built to eliminate the one flaw that plagues every open bounty: **copying.**

## The Problem

In a standard on-chain bounty:
1. Alice submits answer `X`
2. Bob sees Alice's submission
3. Bob submits `X` but slightly improved
4. Bob wins — Alice gets nothing

## The Solution: Commit-Reveal

Participants submit only a **commitment hash** first. After the deadline, they reveal their actual answer. The contract verifies the hash matches. No one can copy what they can't see.

### Lifecycle

```
                    ┌──────────────────────────────┐
                    │         Bounty Created        │
                    │      (owner sets deadline)    │
                    └──────────┬───────────────────┘
                               │
                    ┌──────────▼───────────────────┐
                    │     Submission Phase          │
                    │  Participants call:           │
                    │  submitCommitment(bountyId,   │
                    │       keccak256(answer,salt,  │
                    │       msg.sender,bountyId))   │
                    └──────────┬───────────────────┘
                               │  Deadline passes
                    ┌──────────▼───────────────────┐
                    │     Reveal Phase              │
                    │  Participants call:           │
                    │  revealAnswer(bountyId,       │
                    │       answer, salt)           │
                    └──────────┬───────────────────┘
                               │
                    ┌──────────▼───────────────────┐
                    │     AI Judging Phase          │
                    │  Owner calls:                 │
                    │  judgeAll(bountyId, llmInput) │
                    │  ↓                            │
                    │  Ritual LLM precompile scores │
                    │  eligible (revealed) answers  │
                    └──────────┬───────────────────┘
                               │
                    ┌──────────▼───────────────────┐
                    │     Finalization              │
                    │  Owner calls:                 │
                    │  finalizeWinner(bountyId,     │
                    │       winnerIndex)            │
                    └──────────────────────────────┘
```

## Contract Architecture

```
AIJudge.sol
├── Commit-Reveal Layer
│   ├── submitCommitment() — store keccak256 hash
│   └── revealAnswer() — verify & store plaintext
├── Judging Layer
│   └── judgeAll() — batch AI evaluation via Ritual precompile
└── Payout Layer
    └── finalizeWinner() — transfer bounty to winner
```

## Deployed Contracts

| Contract | Address | Network |
|---|---|---|
| AIJudge (Commit-Reveal) | `0x5401fbedc3613755c76da9d728335b456da04cda` | Ritual Chain (1979) |

## Test Plan

### Commit Phase
- [x] Can submit commitment
- [x] Cannot submit empty commitment
- [x] Cannot reveal without committing first
- [x] Double submission overwrites (allowed by design)

### Reveal Phase
- [x] Can reveal with correct answer + salt
- [x] Cannot reveal with wrong answer (hash mismatch)
- [x] Cannot reveal with wrong salt (hash mismatch)
- [x] Cannot reveal before submission deadline
- [x] Cannot reveal after reveal deadline

### Judging Phase
- [x] Can judge all eligible (revealed) answers
- [x] Non-revealed answers are excluded from judging
- [x] Only owner can trigger judging

### Finalization
- [x] Owner can finalize winner
- [x] Winner receives bounty
- [x] Duplicate answers are handled correctly

## Architecture Note: Commit-Reveal vs Ritual-Native

**Chosen: Commit-Reveal (On-Chain)**

| Aspect | Commit-Reveal | Ritual-Native (TEE) |
|---|---|---|
| **Where answers hidden** | Off-chain until reveal | Encrypted on-chain, decrypted inside TEE |
| **Trust model** | Game-theoretic (economic disincentive to copy) | Cryptographic (TEE guarantees) |
| **Gas cost** | Low (2 tx per submission: commit + reveal) | Higher (encrypted calldata) |
| **UX complexity** | Participants must remember to reveal | Seamless — encryption is automatic |
| **Ritual dependency** | Only for LLM judging (precompile) | Full TEE + batch decryption pipeline |

Commit-reveal was chosen for this iteration because it minimizes Ritual-specific dependencies while still addressing the core copying problem. The trade-off is that participants must actively reveal — uncooperative participants lose their stake. A Ritual-native TEE solution would be more elegant but requires deeper integration with Ritual's encrypted execution environment.

## Reflection

> In a bounty system, **commitments should be public** (to prove participation), but **answers should stay hidden** until the reveal phase to prevent copying. **The salt and individual answer content should remain private** until reveal — only the participant knows them. **AI should decide which answer is best** based on objective evaluation criteria, removing human bias from judging. **Humans should decide the bounty parameters** — what problem to solve, the reward amount, the evaluation criteria, and edge cases like ties or disputes. The AI's role is execution of fair evaluation; the human's role is defining what "fair" means for that specific bounty. This separation ensures that bounties remain tamper-proof while still being flexible enough to handle real-world complexity.
