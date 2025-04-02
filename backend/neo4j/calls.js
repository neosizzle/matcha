var debug = require('debug')('backend:neo4j');
let neo4j = require('neo4j-driver');
let driver = neo4j.driver("bolt://0.0.0.0:7687", neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD));
const enums = require("../constants/enums")
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

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
SESSION_EXPIRY_SECONDS = 60 * 60 * 12
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

exports.create_session_with_user = async function ({
    user_id,
}) {
    let session = driver.session();
    const existing_id = await session.run('MATCH (u:User) WHERE u.id = $user_id RETURN u as data', { user_id })
    if (existing_id.records.length == 0)
        throw new Error(enums.DbErrors.NOTFOUND);

    const user = existing_id.records[0].get('data').properties
    const new_token_hash = jwt.sign({ user }, process.env.JWT_SECRET)

    const query = `
        MATCH (u:User) WHERE u.id = $user_id
        OPTIONAL MATCH (u)-[r:HAS_SESSION]->(s:Session)
        DELETE s, r
        CREATE (ns:Session { hash: $hash })
        CREATE (u)-[:HAS_SESSION { expires_at:  datetime() + duration({seconds: $expire_secs}) }]->(ns)
        RETURN ns as data;
    `;
    const params = {
        hash: new_token_hash,
        user_id,
        expire_secs: SESSION_EXPIRY_SECONDS
    };
    const query_results = await session.run(query, params);
    const user_session = query_results.records[0].get('data').properties
    return user_session
}

exports.verify_session_with_user = async function ({
    token,
}) {
    let session = driver.session();

    const query = `
        MATCH (u:User)-[r:HAS_SESSION]->(s:Session) WHERE s.hash = $token
        return u as user, s as session, r as has_session
    `;
    const params = {
        token,
    };
    
    const query_results = await session.run(query, params);
    const user = query_results.records[0].get('user').properties
    const session_expiry = query_results.records[0].get('has_session').properties['expires_at'].toStandardDate()
    const session_hash = query_results.records[0].get('session').properties['hash']

    try {
        jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error(enums.DbErrors.UNAUTHORIZED)
    }

    if (!user)
        throw new Error(enums.DbErrors.UNAUTHORIZED)

    if (session_expiry < Date.now())
        throw new Error(enums.DbErrors.EXPIRED)

    return user
}

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

// TODO ...
// USER module end