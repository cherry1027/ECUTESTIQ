# ECUTestIQ — Intelligent ECU Test Strategy Recommender

ECUTestIQ is a small two-page React research prototype demonstrating how ECU design characteristics, components, historical failure mechanisms, and operating conditions can be combined to recommend high-value automotive ECU tests.

## Live Demo

https://ecutestiq-test-strategy.charanvaranasi44.workers.dev

## Features

### 1. Test Strategy Recommender

- Configurable ECU type, supply voltage, temperature range, MCU type, communication interface, and system load
- Selectable ECU components
- Deterministic test recommendations from local synthetic rules
- Priority ranking and synthetic risk scores
- Test conditions, target components, and potential failure mechanisms
- Visual traceability:

  `Design Characteristic → Component → Failure Mechanism → Recommended Test`

- Transparent risk-score calculation and recommendation rationale

### 2. Failure Knowledge & Test Optimization

- 26 synthetic historical ECU failure records
- Filters for component, failure mechanism, temperature, voltage, and operating condition
- Failure-mechanism and operating-condition charts
- Component/failure relationship heatmap
- Test Budget Optimizer supporting 1–50 available tests
- Estimated failure-mode coverage
- Deterministic random-test baseline comparison
- Ranked test scenario queue

## Methodology

```text
Test Score =
Design Relevance +
Historical Failure Association +
Environmental Stress +
Scenario Interaction
