var debug = require('debug')('backend:neo4j');
let neo4j = require('neo4j-driver');
let driver = neo4j.driver("bolt://0.0.0.0:7687", neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD));
const enums = require("../constants/enums")
const bcrypt = require("bcryptjs");

// Database init code
const init_fn = async () => {
    let session = driver.session();
    
    // Create constraints for User node
    // TODO: generate existence constraints and type constraints (recommended)
    // TODO: create indexes for faster lookups (recommended)
    debug('Creating user node constraints');
    try {
        await session.run('CREATE CONSTRAINT unique_email IF NOT EXISTS FOR (p:User) REQUIRE (p.email) IS UNIQUE', {});
        debug("Database init OK");

    } catch (error) {
        console.error(error)
        debug("[ERROR] Database init KO");

    }

    session.close();
}

init_fn()
.then()
.catch()

exports.get_driver = async () => {
	return driver
}

exports.get_num_nodes = async function () {
    let session = driver.session();
    const num_nodes = await session.run('MATCH (n) RETURN n', {
    });
    session.close();
    console.log("RESULT", (!num_nodes ? 0 : num_nodes.records.length));
    return (!num_nodes ? 0 : num_nodes.records.length);
};

// AUTH module
// TODO ...
// AUTH module end

// USER module
exports.create_new_user = async function ({
    id,
    images,
    email,
    password,
    iden_42,
    verified,
    sexuality,
    displayname,
    birthday,
    bio,
    enable_auto_location,
    fame_rating
}) {
    let session = driver.session();
    const existing_email = await session.run('MATCH (u:User) WHERE u.email = $email RETURN u', { email })
    if (existing_email.records.length != 0)
        throw new Error(enums.DbErrors.EXISTS);

    const query = `
        CREATE (u:User {
            id: $id,
            images: $images,
            email: $email,
            password: $password,
            iden_42: $iden_42,
            verified: $verified,
            sexuality: $sexuality,
            displayname: $displayname,
            birthday: $birthday,
            bio: $bio,
            enable_auto_location: $enable_auto_location,
            fame_rating: $fame_rating
        })
        RETURN u;
    `;
    const params = {
        id,
        images,
        email,
        password,
        iden_42,
        verified,
        sexuality,
        displayname,
        birthday,
        bio,
        enable_auto_location,
        fame_rating
    };
    await session.run(query, params);
}

exports.auth_email_pw = async function ({
    email,
    password
}) {
    let session = driver.session();
    const query_record = await session.run('MATCH (u:User) WHERE u.email = $email RETURN u as data', { email })
    if (query_record.records.length == 0)
        throw new Error(enums.DbErrors.NOTFOUND);
    const user = query_record.records[0].get('data').properties
    const hash = user['password']

    if (!bcrypt.compareSync(password, hash))
        throw new Error(enums.DbErrors.UNAUTHORIZED)
    
    delete user['password']
    return user
}

// TODO ...
// USER module end