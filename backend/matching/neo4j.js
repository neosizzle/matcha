var debug = require('debug')('backend:neo4j');
let neo4j = require('neo4j-driver');
let driver = neo4j.driver("bolt://0.0.0.0:7687", neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD));
const enums = require("../constants/enums")
const bcrypt = require("bcryptjs");

exports.get_match = async function({
    id,
    num_of_matches
}) {
    let session = driver.session();
    const user_1_exist = await session.run('MATCH (u:User) WHERE u.id = $id RETURN u', { id });
    if (!user_1_exist)
        throw new Error(enums.DbErrors.EXISTS);

    const query = 
}