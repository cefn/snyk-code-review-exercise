# Page references

See Cefn PR diffs
https://gist.github.com/cefn/58c0272c44ef42c356281c0d4bd7ff23

See original PR diff
https://github.com/snyk/snyk-code-review-exercise/pull/1

# Issues pre-existing

- No CI
- Tests minimal
- Linting fails

# Issues in PR

Quality Issues

- maxSatisfying not minSatisfying
- Typo in `dependecies` (sic)
- Use of as Object - should be as Record<string,unknown>
- Ideally functions would be more atomic (separation of concerns).
- Use of async function declaration and .then() is unusual
- newDeps plural subDep singular
- Tests and Linting fail
- No test coverage for feature
- Error cases not tested, not handled (e.g. unavailable package)

Proposed approaches

- Add concurrent retrieval - suggest per-server p-limit pool
- Add recorded network requests
- Add inline snapshots for complex trees, errors

Feature questions:

- will recursive dependencies always be needed? Should it be a flag, a separate endpoint?
- getDependencies needs a return type (should be out of the NPMPackage tree)

Next steps

- Review PR 4 in cefn/snyk-code-review-exercise
- Add pre-commit lint hook?
- Simplify NPMPackage to minimum
- Case of empty dependencies - don't add empty object?
