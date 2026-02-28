# Responsible AI Notes

## Intended Use
SalesPOC assistant is intended for internal sales analytics and decision support. It is not intended for legal, financial, or regulatory final decisions without human review.

## Safety Controls
- Ground responses in approved enterprise data sources and APIs.
- Reject requests that seek secrets, credentials, or disallowed operations.
- Restrict actions by user role and scope.
- Capture diagnostics for failures and policy denials.

## Prompt Injection Mitigation
- Treat user prompts as untrusted input.
- Do not allow prompt instructions to override system/developer policies.
- Enforce allowlisted tools and endpoints only.

## Privacy and Data Handling
- Minimize data retained in logs.
- Avoid storing sensitive message content unless required for support.
- Use secure transport and managed identity/service principals for service-to-service calls.

## Human Oversight
- Clearly communicate uncertainty.
- Provide escalation path to sales operations/admin for disputed outputs.

## Evaluation
- Track hallucination rate, citation coverage, policy-block events, and user satisfaction.
- Run periodic red-team prompts and scenario-based regression tests.
