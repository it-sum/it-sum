# Role dashboard audit

## Student dashboard

The new `/ar/student` route renders an independent RTL student workspace. The sidebar exposes Overview, Resource library, Practice quizzes, My progress and Rewards. The center column contains the study path and next action, while the side column contains a learning-health vital panel and a short-session prompt. The route renders successfully with the existing demo admin session because admin is allowed to preview student content; a true student session will use the same layout without the admin role.

The main hierarchy is clear at the audited viewport: greeting and primary action, three compact vitals, continue-learning list, next best action, and a supporting health panel. Resource cards have progress and click targets.

## Admin dashboard

The new `/ar/admin` route renders an independent admin center. Its sidebar contains Overview, Users, Content, Quizzes and Drive sync; the main area is centered with four vital metrics, a content/synchronization health panel, and a user-management panel. The top-right/RTL side placement is consistent with the language direction and the `Demo Administrator` session is visible in the sidebar footer.

Dedicated admin routes are present for `/admin/users`, `/admin/content`, `/admin/quizzes` and `/admin/sync`. The main overview includes a link back to the student workspace without merging the two role navigation models.
