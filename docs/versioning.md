# Versioning Strategy

## Semantic Versioning

We follow [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

## Examples

| Version | Description |
|---------|-------------|
| v0.1.0 | Initial development release |
| v0.2.0 | Added portfolio engine |
| v0.3.0 | Added position sizing |
| v1.0.0 | First stable release |
| v1.1.0 | Added new analysis feature |
| v1.1.1 | Fixed cache bug |

## Pre-release Versions

| Label | Purpose | Example |
|-------|---------|---------|
| alpha | Internal testing | v1.0.0-alpha.1 |
| beta | External testing | v1.0.0-beta.1 |
| rc | Release candidate | v1.0.0-rc.1 |

## Version Bumping Rules

### Major (X.0.0)
- API breaking changes
- Database schema breaking changes
- Complete UI redesign
- Technology stack changes

### Minor (0.X.0)
- New API endpoints
- New features
- New engine modules
- New UI components

### Patch (0.0.X)
- Bug fixes
- Security patches
- Performance improvements
- Documentation updates

## Version Sources

Versions are tracked in:
- `package.json` (root and each app)
- `CHANGELOG.md`
- Git tags
