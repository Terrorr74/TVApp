# SOP: Git Workflow

## Branch Strategy

- `main` — stable branch; direct commits for solo work
- Feature branches (`feature/description`) for larger changes or anything touching the Android build or Docker config

## Commit Convention

Keep commits small and focused. Message format:

```
<type>: <short description>

<optional body>
```

Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `style`

Examples:
- `feat: add yt-dlp proxy for stream extraction`
- `fix: prevent focus loss on PlayerPage unmount`
- `docs: update system doc with yt-dlp proxy`

## Before Committing

- Run `cd web && npm run build` to catch TypeScript errors
- If touching Android: `cd android && ./gradlew assembleDebug` to verify the APK builds
- Update `.agent/` docs if the system has changed (new API endpoint, new page, new Docker service, etc.)

## After Significant Changes

Update `.agent/System/system.md` to reflect:
- New files or folders in the project structure
- New API endpoints or changed response shapes
- New Docker services
- New environment variables
- Routing changes
