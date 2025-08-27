# Local JSON Schemas

This directory contains local JSON schema files used for validation of configuration files in the GenCV project.

## Purpose

These schema files are used instead of online schemas to:

1. Avoid validation errors due to unreachable online schemas
2. Provide validation even when working offline
3. Ensure consistent validation across all development environments

## Schema Files

- `package-schema.json` - Schema for package.json files
- `tsconfig-schema.json` - Schema for tsconfig.json files
- `turbo-schema.json` - Schema for turbo.json files

## Usage

These schemas are automatically used by VS Code when editing the corresponding files, thanks to the configuration in `.vscode/settings.json`.

## Customization

Feel free to update these schema files if you need to add validation for additional properties or make them more comprehensive.
