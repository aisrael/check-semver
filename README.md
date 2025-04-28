# GitHub Action to Check a Version using SemVer

[![GitHub Super-Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

This is a GitHub Action that can be used to check that the `version` input is a valid SemVer version.

It can also be used to check that the `version` has the expected `prefix` and/or `suffix`.

It can also be instructed to check tags and releases, such that:
- The tag or release with the same name as the `version` does not already exist
- The `version` is SemVer higher than the highest existing tag or release

## Inputs / Outputs

### Inputs

| Input            | Description                                        | Required                                     | Default Value |
| ---------------- | -------------------------------------------------- | -------------------------------------------- | ------------- |
| `version`        | The version to check                               | Yes                                          | None          |
| `prefix`         | The prefix to check                                | No                                           | None          |
| `suffix`         | The suffix to check                                | No                                           | None          |
| `check_tags`     | Whether to check tags                              | No                                           | "false"       |
| `check_releases` | Whether to check releases                          | No                                           | "false"       |
| `token`          | The GitHub token needed to check tags or releases  | Yes, if `check_tags` or `check_releases` is true | None          |

### Outputs

| Output    | Description                  | Value                      |
| --------- | ---------------------------- | -------------------------- |
| `valid`   | Whether the version is valid | `true` or `false`          |
| `message` | A message about the result   | See below                  |

## Usage

### Check that a version is a valid SemVer only

```yaml
- name: Check version
  id: check-version
  uses: aisrael/check-semver@v1
  with:
    version: ${{ inputs.version }}
```

### Check that a version is a valid SemVer and has the expected prefix

```yaml
- name: Check version
  id: check-version
  uses: aisrael/check-semver@v1
  with:
    version: ${{ inputs.version }}
    prefix: 'cli-'
```

### Check that the version is not an existing tag, and is SemVer higher than the highest existing tag or release

```yaml
- name: Check version
  id: check-version
  uses: aisrael/check-semver@v1
  with:
    version: ${{ inputs.version }}
    check_tags: true
    token: ${{ secrets.GITHUB_TOKEN }}
```

### Check that the version is not an existing tag or release, and is SemVer higher than the highest existing tag or release

```yaml
- name: Check version
  id: check-version
  uses: aisrael/check-semver@v1
  with:
    version: ${{ inputs.version }}
    check_tags: true
    check_releases: true
    token: ${{ secrets.GITHUB_TOKEN }}
```

## Output Messages

| Message                                                                     |
| --------------------------------------------------------------------------- |
| '${version}' is not a valid SemVer                                          |
| '${version}' does not start with prefix '${prefix}'                         |
| '${version}' does not end with suffix '${suffix}'                           |
| Tag '${version}' already exists                                             |
| '${version}' is not SemVer higher than existing tag '${highestTag}'         |
| Release '${version}' already exists                                         |
| '${version}' is not SemVer higher than existing release '${highestRelease}' |
