# Changelog

## [Unreleased]

### Added

- OpenAPI TypeScript type generation using openapi-typescript
- Auto-generation script that fixes schema reference issues
- Integration with existing schema conversion system
- New `ApiSchema` types that leverage OpenAPI-generated types
- New `app/types/database.ts` file to replace root-level database.types.ts

### Changed

- Updated schema/index.ts to import OpenAPI generated types
- Added documentation in README for type generation
- Migrated database types to app/types directory
- Removed root-level database.types.ts
- Fixed post creation to handle field name discrepancy between API schema and backend

### Removed

- Root-level database.types.ts file

### Fixed

- POST /posts endpoint error by adding skipConversion option to API client
- Added API option to bypass automatic camelCase to snake_case conversion when needed
