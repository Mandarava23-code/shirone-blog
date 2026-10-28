import { cleanupContentFixtures } from "./content-fixture-utils";

export default async function teardown(): Promise<void> {
	await cleanupContentFixtures();
}
