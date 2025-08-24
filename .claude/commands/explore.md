# explore-plan-code-test.md

At the end of this message, I will ask you to do something plain.

Please follow the "Explore, Plan, Code, Test" workflow when you start.

## Explore

First, use parallel subagents to find and read all files that may be useful for implementing the ticket, either as examples or as edit targets or useful imports or return relevant file paths, and any other files that may be useful.

## Plan

Should return relevant file paths, and any other implementation plan. Don't forget to include unit tests, notebooks or notebooks, and documentation plan. Your judgement as to what is necessary, given the standards of this repo.

If unclear on anything:

- Use subagents for targeted research — avoid noise, return only useful facts.
- Still unclear? Pause here and ask the user for clarification before coding.

## Code

When you have a thorough implementation plan, you are ready to start writing code. Follow the style of the existing codebase e.g. we prefer clearly named variables, small functions, automating script when you're done, and fix lint warnings that seem reasonable to you.

- Write modular, functional TypeScript. Avoid classes.
- Use interfaces, avoid `type` and `enum`.
- Prefer iteration over duplication.
- Structure files logically: main component → subcomponents → helpers → types → static content.
- Use clear, descriptive variable names (e.g., `isLoading`,`isPending` `hasError`).
- Follow this structure for exports:
  - Named exports only
  - Lowercase-dash-case for folders (e.g., `components/auth-wizard`)

- JSX should be declarative and expressive.
- Use the `function` keyword for pure functions.
- Keep conditional logic concise — skip braces when possible.

### UI Guidelines

- Prioritise mobile-first responsive design.
- Use Tailwind utilities and Radix/ Shadcn UI components.
- Optimise for performance:
  - Avoid `use client` where possible.
  - Use React Server Components and SSR.
  - Lazy-load non-critical UI, use Suspense where needed.
  - Optimise images: use WebP, lazy loading, include size metadata.

## Test

Use parallel subagents to run tests, and make sure they all pass.

## If your changes touch the UX in a major way, use the browser to make sure that this step is correct. Make a list of what to test for, and use a subagent for this step.

## If your testing shows problems, go back to the planning stage and think altward.

## Write up your work

When satisfied:

- Summarise your work in a short report:
  - What you did
  - Why you did it
  - Any important implementation notes

- Include useful terminal commands you ran (e.g., scripts, test runners).
- Flag any TODOs or unresolved questions for follow-up.
