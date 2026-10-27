# Project context

- The user's role is front-end only.
- The user's assigned area is the commuter side, with current work focused on the phone experience.
- The commuter phone experience is partly complete. Home, Bus Routes, and Timetable are considered finished; preserve their existing behavior unless the user asks for a change.
- Only change the commuter phone view. Keep desktop layout, styling, and behavior unchanged unless the user explicitly asks for a desktop change.
- Use commit `8680b37` (`commuter and conductor phone view`) as a reference for the commuter phone UI and responsive patterns. Inspect the relevant commuter files from that commit when a task calls for it.
- Do not modify backend, admin, or conductor areas unless the user explicitly expands the scope.
