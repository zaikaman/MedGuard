# Terminal 3 Bounty Findings Draft

Source context: `hackathon.md` says detailed developers can win bonus
consideration by discovering and submitting onboarding bugs and documentation
gaps. This draft is ready to submit after verifying the findings in a browser.

## Finding 1: Setup page says "Quick 4 steps" but lists five steps

**Type**: Documentation bug

**Page**: https://docs.terminal3.io/developers/adk/get-started/prerequisites/set-up-dev-env

**Observed**: The page subtitle says "Quick 4 steps to set up your development
environment", but the procedure lists steps 1 through 5:

- Get your API key and DID
- Install Rust + WASM toolchain
- Install the SDK
- Set up the SDK
- Authenticate to T3N testnet

**Expected**: Either update the subtitle to "Quick 5 steps" or merge/renumber the
steps so the count matches.

**Impact**: Small onboarding trust issue. New developers may think they missed a
step or that the page was partially updated.

## Finding 2: "Agent Auth SDK" vs "T3 Agent Developer Kit (ADK)" terminology gap

**Type**: Documentation gap

**Pages**:

- https://docs.terminal3.io/developers/adk/overview/what-is-adk
- https://docs.terminal3.io/developers/adk/get-started/prerequisites/set-up-dev-env

**Observed**: The bounty/project language refers to "Agent Auth SDK", while the
documentation primarily uses "T3 Agent Developer Kit (ADK)" and installs
`@terminal3/t3n-sdk`.

**Expected**: Add a short terminology note explaining whether Agent Auth SDK,
T3 ADK, and `@terminal3/t3n-sdk` are the same package/product surface, or how
they differ.

**Impact**: Medium onboarding ambiguity. Developers may search for a separate
"Agent Auth SDK" package or miss that `@terminal3/t3n-sdk` is the intended SDK.

## Finding 3: Multiple app-specific agent DID registration path is unclear

**Type**: Documentation gap

**Pages**:

- https://docs.terminal3.io/developers/adk/overview/what-is-adk
- https://docs.terminal3.io/developers/adk/get-started/prerequisites/set-up-dev-env
- https://docs.terminal3.io/intro/components/did

**Observed**: The docs explain tenant onboarding and `did:t3n`, but the path for
registering multiple app-specific AI agents for one application, such as
Patient Agent, Clinic Agent, and Insurer Agent, is not obvious from the
onboarding flow.

**Expected**: Add a recipe for creating/registering multiple agent identities
within one app and mapping those identities to product roles.

**Impact**: Medium implementation ambiguity for multi-agent apps.

## Finding 4: Delegation docs need more revocation/audit examples

**Type**: Documentation gap

**Pages**:

- https://docs.terminal3.io/t3n/data-owner-guide/delegate-access
- https://docs.terminal3.io/t3n/use-cases/delegate-access-to-agent

**Observed**: Delegation docs define Agent DID, authorized TEE contract,
authorized functions, allowed hosts, and revocation, but examples do not show
what audit events developers should store or how revocation should behave for
in-flight and future requests.

**Expected**: Add an end-to-end delegated-access example with event log shape,
revocation timing, future request denial, and in-flight request expectations.

**Impact**: Medium for regulated apps where auditability and revocation semantics
must be precise.
