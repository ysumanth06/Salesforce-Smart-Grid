<!-- Parent: sf-ai-agentscript/SKILL.md -->

# Testing & Validation Guide

> The 100-Turn Gauntlet: Automated Batch Testing with LLM-as-Judge Scoring

---

## Enterprise Testing Infrastructure

### Testing Center Overview

A centralized hub for batch-testing utterances without deactivating your agent.

**Capabilities:**

- ✅ Run tests against draft or committed versions
- ✅ No need to deactivate the live agent
- ✅ Execute up to 100 test cases simultaneously
- ✅ Compare results across different script versions
- ✅ Export test results for stakeholder review

> 💡 Think of it as "staging" for your agent - test safely while production runs.

---

## The 5 Quality Metrics

| Metric               | Description                                         | Scale     |
| -------------------- | --------------------------------------------------- | --------- |
| **Completeness**     | Did the response include ALL necessary information? | 0-5       |
| **Coherence**        | Did the agent sound natural vs raw JSON output?     | 0-5       |
| **Topic Assertion**  | Did the agent route to the correct topic?           | Pass/Fail |
| **Action Assertion** | Did the agent invoke the expected actions?          | Pass/Fail |
| **Combined Score**   | Determines production readiness                     | Composite |

> ⚠️ 100% assertions with 0% coherence = correct but robotic. Both matter.

---

## Coherence: The Difference

| Coherence: 0/5 ❌                                                                | Coherence: 5/5 ✅                                                                                                                                                       |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **USER:** "I want a refund for order #123"                                       | **USER:** "I want a refund for order #123"                                                                                                                              |
| **AGENT:** `{"status": "success", "case_id": "5008000123", "refund_auth": true}` | **AGENT:** Great news! Your refund has been approved. For your records, your case number is 5008000123. The refund should appear on your card within 3-5 business days. |
| _Raw JSON dump - not conversational_                                             | _Complete information in natural language_                                                                                                                              |

---

## LLM-as-Judge

A "Judge LLM" evaluates the "Agent LLM" using criteria that match your use case.

**Benefits:**

- ✅ **Scalable**: Evaluate thousands of responses automatically
- ✅ **Customizable**: Criteria match your specific use case
- ✅ **Consistent**: Removes human reviewer variability
- ✅ **Explainable**: Each score includes reasoning
- ✅ **Iterative**: Refine criteria based on edge cases

> 💡 The Judge LLM compares responses against your "Golden Response" definition.

---

## Batch Testing Workflow

### Step 1: Prepare Test Cases

Create a set of test utterances covering:

- Happy path scenarios
- Edge cases
- Error conditions
- Multi-turn conversations

### Step 2: Define Assertions

For each test case, specify:

- **Expected Topic**: Which topic should be activated
- **Expected Actions**: Which actions should be invoked
- **Golden Response**: Ideal response pattern

### Step 3: Run Batch

```bash
# Run agent tests (--api-name refers to an AiEvaluationDefinition, not the agent)
sf agent test run --api-name MyTestDef --wait 10 -o TARGET_ORG --json
```

### Step 4: Analyze Results

| Metric               | Score | Status  |
| -------------------- | ----- | ------- |
| **TOPIC ASSERTION**  | 100%  | ✅ PASS |
| **ACTION ASSERTION** | 100%  | ✅ PASS |
| **COMPLETENESS**     | 100%  | ✅ PASS |
| **COHERENCE**        | 0%    | ❌ FAIL |

---

## The Coherence Collapse Problem

### Symptom

Batch test shows:

- Topic assertions: 100% ✅
- Action assertions: 100% ✅
- Completeness: 100% ✅
- Coherence: 0% ❌

### Root Cause

Agent returns raw action output instead of natural language response.

```yaml
# Problem: No instruction to format response
actions:
  get_order: @actions.get_order_details
    set @variables.order_data = @outputs.data
# LLM just dumps the data
```

### Fix

Add explicit formatting instructions:

```yaml
instructions: ->
  run @actions.get_order_details
    set @variables.order_data = @outputs.data

  | Here are your order details:
  | - Order Number: {!@variables.order_data.number}
  | - Status: {!@variables.order_data.status}
  | - Estimated Delivery: {!@variables.order_data.eta}
  |
  | Is there anything else I can help with?
```

---

## Metadata Lifecycle

### The Three-Phase Lifecycle

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   ✏️ Draft   │  →   │  🔒 Commit  │  →   │  ✅ Activate │
│   EDITABLE  │      │  READ-ONLY  │      │    LIVE     │
└─────────────┘      └─────────────┘      └─────────────┘
```

> ⚠️ **Key Insight**: Commit doesn't deploy - it freezes. Activate makes it live.

---

### Phase 1: Draft (EDITABLE)

Your working copy. Edit freely, run tests, iterate rapidly.

**Capabilities:**

- ✅ Edit script content
- ✅ Preview changes
- ✅ Run batch tests
- ✅ No version number yet

---

### Phase 2: Commit (READ-ONLY)

Freeze the script. Generates version number and Authoring Bundle.

**Capabilities:**

- ✅ Script becomes immutable
- ✅ Authoring Bundle compiled
- ✅ Version number assigned (v1.0)
- ✅ Ready for activation

---

### Phase 3: Activate (LIVE)

Deploy to production. Assign to Connections and go live.

**Capabilities:**

- ✅ Assign to Connections (Slack, Chat)
- ✅ Monitor in real-time
- ✅ Agent goes live
- ✅ Rollback if needed

---

## Test Case Design

### Coverage Categories

| Category           | Examples                                      |
| ------------------ | --------------------------------------------- |
| **Happy Path**     | Standard refund request, order lookup         |
| **Edge Cases**     | Empty cart, expired offers, boundary values   |
| **Error Handling** | Invalid input, service failures               |
| **Security**       | Unauthorized access attempts                  |
| **Multi-Turn**     | Conversation continuity, context preservation |

### Test Case Template

```yaml
test_case:
  name: "High-risk customer full refund"
  utterance: "I want a refund for order #12345"
  context:
    customer_id: "CUST_001"
    churn_risk: 85
  expected:
    topic: "refund_processor"
    actions: ["get_churn_score", "process_refund"]
    response_contains: ["approved", "full refund"]
  assertions:
    topic_match: true
    action_sequence: true
    coherence_min: 4
```

---

## Validation Commands

### Pre-Deployment Validation

```bash
# Validate authoring bundle syntax
sf agent validate authoring-bundle --api-name MyAgent -o TARGET_ORG --json

# Run agent tests
sf agent test run --api-name MyTestDef --wait 10 -o TARGET_ORG --json
```

### Common Validation Errors

| Error                        | Cause              | Fix                        |
| ---------------------------- | ------------------ | -------------------------- |
| `Invalid default_agent_user` | User doesn't exist | Create Einstein Agent User |
| `Topic not found`            | Typo in transition | Check topic name spelling  |
| `Mixed indentation`          | Tabs + spaces      | Use consistent formatting  |
| `Action not callable`        | Wrong protocol     | Check target protocol      |

---

## Continuous Testing

### CI/CD Integration

```yaml
# Example GitHub Actions workflow
name: Agent Testing
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate Agent
        run: sf agent validate authoring-bundle --api-name MyAgent -o TARGET_ORG --json
      - name: Run Tests
        run: sf agent test run --api-name MyTestDef --wait 10 -o TARGET_ORG --json
```

### Test Automation Best Practices

1. **Run validation on every commit**
2. **Run full test suite before merge**
3. **Monitor coherence scores over time**
4. **Alert on assertion failures**
5. **Track coverage by topic and action**

---

## Key Takeaways

| #   | Concept                                                                                      |
| --- | -------------------------------------------------------------------------------------------- |
| 1   | **Testing Center** - Run up to 100 tests simultaneously                                      |
| 2   | **5 Quality Metrics** - Completeness, Coherence, Topic/Action Assertions, Combined           |
| 3   | **LLM-as-Judge** - Automated scoring against golden responses                                |
| 4   | **Coherence Matters** - 100% assertions with 0% coherence = technically correct but unusable |
| 5   | **Three-Phase Lifecycle** - Draft (edit) → Commit (freeze) → Activate (live)                 |
| 6   | **CI/CD Integration** - Automate validation and testing in deployment pipeline               |
