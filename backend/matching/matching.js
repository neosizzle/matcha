const neo4j = require('neo4j-driver');

async function findMostSimilarUser(userID1) {
    const uri = "bolt://localhost:7687";
    const user = "neo4j";
    const password = "password";
    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    const session = driver.session();

    try {
        const query = `
            MATCH (p1:Person)-[:LIKES]->(t:Technology)<-[:LIKES]-(p2:Person)
            WHERE p1.id = $userID1 AND p1 <> p2
            RETURN p2.id AS userID, COUNT(t) AS sharedInterests
            ORDER BY sharedInterests DESC
            LIMIT 1
        `;
        
        const result = await session.run(query, { userID1 });
        
        if (result.records.length > 0) {
            const record = result.records[0];
            return {
                userID: record.get('userID'),
                sharedInterests: record.get('sharedInterests').toInt(),
            };
        } else {
            return null; // No matching user found
        }
    } catch (error) {
        console.error("Error querying the database:", error);
        throw error;
    } finally {
        await session.close();
        await driver.close();
    }
}
