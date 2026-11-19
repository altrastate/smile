# Twenty-phase roadmap

The sequence below is fixed. A phase does not start until the previous phase is accepted.

01. Project audit, architecture foundation and design system.
02. Public website shell, navigation and homepage.
03. Product catalogue, categories, search and product details.
04. Authentication, business applications and approval workflows.
05. Producer dashboard and live storefront management.
06. Manufacturer and supplier dashboards.
07. Inventory, variants and pricing management.
08. Shopping cart and checkout.
09. Orders and vendor fulfilment.
10. Payment integrations and reconciliation.
11. Delivery and logistics management.
12. Business directory and networking.
13. Wholesale quotations and negotiations.
14. Service provider directory.
15. Admin console and moderation.
16. Notifications and communication.
17. Regional country and currency support.
18. Mobile API preparation and shared application services.
19. Security, integration, performance and end-to-end testing.
20. Production launch, documentation and handover.

Phase 01 and Phase 02 are complete. Phase 03 is implemented and its migration is applied. Phase 03.1 verified that foundation. It is conditionally accepted: the public visibility matrix was not executed with fixture rows because Docker is unavailable and those rows were not created in the linked database. Phase 04 is implemented in the application and in migration `20261119113107_identity_and_applications.sql`. That migration has not been applied, and the row-level policies have not been executed against a database, so Phase 04 is conditionally accepted. Phase 05 has not been started.
