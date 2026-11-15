export const projectAssessments: Record<number, string[]> = {
  1: [
    "A reader can name the intended users, their problem and the current workaround without guessing.",
    "Every first-version feature supports the user journey, and postponed ideas are explicitly excluded.",
    "Each user story has observable acceptance criteria, including invalid input and a permission failure.",
    "The chosen application type is justified by user needs, environment and maintenance trade-offs.",
    "Quality expectations, constraints, assumptions and open questions are written down and measurable where possible.",
  ],
  2: [
    "The map shows the browser, backend, database and external services, with protocols and data on each connection.",
    "Task creation, sign-in and later retrieval can be traced through real requests and stored records.",
    "Validation, session verification and ownership checks appear at the enforcement point, not only in the interface.",
    "A real browser request matches the diagram, including its method, path, important fields and response.",
    "Each boundary has a documented failure and a realistic recovery path for the user.",
  ],
  3: [
    "A new learner can follow the README from a clean folder to a running app without undocumented fixes.",
    "Runtime versions, commands and configuration examples are recorded without including real credentials.",
    "Baseline tests pass, and generated files, source files, lockfiles and ignored files are correctly distinguished.",
    "The visible change is isolated in a reviewable branch with a clean diff and passing checks.",
    "A second fresh setup or documentation rehearsal confirms that the project map is accurate.",
  ],
  4: [
    "The brief, quality targets, diagrams, data model and endpoint contracts agree with one another.",
    "Every important rule has one named owner, and trust boundaries are visible in the design.",
    "Major technology choices record alternatives and reasons rather than only naming the selected stack.",
    "Security, privacy, accessibility, performance, reliability and technical-debt plans have concrete actions.",
    "A new reader can explain the system and why its choices fit without help from the author.",
  ],
  5: [
    "The first version has one complete working path through the interface, API and database.",
    "Every feature has acceptance criteria, review evidence and tests, including two-account permission checks.",
    "Complete browser journeys work on phone and laptop using only a keyboard as well as a pointer.",
    "Each repaired bug has a regression test, and the full suite passes after the final change.",
    "A fresh setup works, secrets are absent, and the documentation matches the code that actually runs.",
  ],
  6: [
    "Staging and production use separate configuration and data, with a repeatable tested release process.",
    "The released service has HTTPS where public, health checks, useful error reports and actionable alerts.",
    "A backup has been restored into an isolated fresh database and the recovery time has been recorded.",
    "The maintenance guide names access responsibilities, monitoring, release approval, rollback and incident communication.",
    "Another person has rehearsed operating the application using only the repository and maintenance guide.",
  ],
};
