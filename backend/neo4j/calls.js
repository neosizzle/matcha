var debug = require('debug')('backend:neo4j');
let neo4j = require('neo4j-driver');
let driver = neo4j.driver("bolt://0.0.0.0:7687", neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD));
const enums = require("../constants/enums")
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

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
EMAIL_VERI_EXPIRY_SECONDS = 60 * 3
EMAIL_VERI_COOLDOWN_SECONDS = 30
PW_RESET_EXPIRY_SECONDS = 60 * 3
PW_RESET_COOLDOWN_SECONDS = 30

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

exports.get_or_create_user_42 = async function ({
    user_iden,
    birthday
}) {
    let session = driver.session();
    const query_record = await session.run('MATCH (u:User) WHERE u.iden_42 = $user_iden RETURN u as data', { user_iden })
    
    // TODO: no users, create new user
    if (query_record.records.length == 0)
    {
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
        RETURN u as data;
        `;
        const params = {
            id: uuidv4(),
            images: "",
            email: "",
            password: "",
            iden_42: user_iden,
            verified: true,
            sexuality: enums.Sexuality.BISEXUAL,
            displayname : user_iden,
            birthday,
            bio: "",
            enable_auto_location: true,
            fame_rating: 0
        };
        let newuser_query_record = await session.run(query, params);
        const user = newuser_query_record.records[0].get('data').properties
        return user
    }
    // got user, return user
    else 
    {
        const user = query_record.records[0].get('data').properties
        delete user['password']
        return user
    }
    
}

exports.delete_session_from_user = async function ({
    user_id,
}) {
    let session = driver.session();
    const existing_id = await session.run('MATCH (u:User) WHERE u.id = $user_id RETURN u as data', { user_id })
    if (existing_id.records.length == 0)
        throw new Error(enums.DbErrors.NOTFOUND);

    const query = `
        MATCH (u:User) WHERE u.id = $user_id
        OPTIONAL MATCH (u)-[r:HAS_SESSION]->(s:Session)
        DELETE s, r
    `;
    const params = {
        user_id,
    };
    await session.run(query, params);
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
        return u as user, r as has_session
    `;
    const params = {
        token,
    };
    
    const query_results = await session.run(query, params);
    const user = query_results.records[0].get('user').properties
    const session_expiry = query_results.records[0].get('has_session').properties['expires_at'].toStandardDate()

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

exports.create_email_verify = async function ({
    user,
}) {
    let session = driver.session();
    const user_id = user.id
    
    // check pending email verification attempts for cooldown
    let query = `
        MATCH (u:User)-[r:HAS_VERI_ATTEMPT]->(v:VeriAttempt) WHERE u.id = $user_id
        RETURN r, v;
    `;
    let params = {
        user_id,
    };
    let query_results = (await session.run(query, params)).records;
    if (query_results.length > 0)
    {
        const created_at = query_results[0].get('r').properties['created_at'].toStandardDate()
        const diff_seconds = Math.floor((Date.now() - created_at) / 1000)
        if (diff_seconds < EMAIL_VERI_COOLDOWN_SECONDS)
            throw new Error(enums.DbErrors.RATE_LIMIT)
    }

    // create email verification request in db and return OTP
    const otp = Math.floor(100000 + Math.random() * 900000); 
    const salt = bcrypt.genSaltSync(10);
    const otp_hash = bcrypt.hashSync(`${otp}`, salt);
    query = `
        MATCH (u:User) WHERE u.id = $user_id
        OPTIONAL MATCH (u)-[r:HAS_VERI_ATTEMPT]->(v:VeriAttempt)
        DELETE v, r
        CREATE (nv:VeriAttempt { hash: $hash })
        CREATE (u)-[:HAS_VERI_ATTEMPT { expires_at:  datetime() + duration({seconds: $expire_secs}), created_at: datetime() }]->(nv)
        RETURN nv as data;
    `;
    params = {
        hash: otp_hash,
        user_id,
        expire_secs: EMAIL_VERI_EXPIRY_SECONDS
    };
    await session.run(query, params);
    return otp
}

exports.verify_email = async function ({
    user,
    otp
}) {
    let session = driver.session();
    const user_id = user.id
    
    // check existing email verification attempts 
    let query = `
        MATCH (u:User)-[r:HAS_VERI_ATTEMPT]->(v:VeriAttempt) WHERE u.id = $user_id
        RETURN r, v;
    `;
    let params = {
        user_id,
    };
    let query_results = (await session.run(query, params)).records;
    if (query_results.length == 0)
        throw new Error(enums.DbErrors.NOTFOUND)

    const expires_at = query_results[0].get('r').properties['expires_at'].toStandardDate()
    const diff_seconds = Math.floor((expires_at - Date.now()) / 1000)
    const otp_hashed = query_results[0].get('v').properties['hash']

    if (diff_seconds < 0)
        throw new Error(enums.DbErrors.EXPIRED)

    // compare hash
    if (!bcrypt.compareSync(otp, otp_hashed))
        throw new Error(enums.DbErrors.UNAUTHORIZED)

    // everything good, delete veri attempt and set user verified to true
    query = `
        MATCH (u:User) WHERE u.id = $user_id
        OPTIONAL MATCH (u)-[r:HAS_VERI_ATTEMPT]->(v:VeriAttempt)
        DELETE v, r
        SET u.verified = true
        RETURN u as data;
    `;
    params = {
        user_id,
    };
    await session.run(query, params);
}

exports.create_pw_reset = async function ({
    email,
}) {
    let session = driver.session();
    
    // check pending pw attempts for cooldown, and if email exists for user
    let query = `
        OPTIONAL MATCH (u:User) WHERE u.email = $email
        OPTIONAL MATCH (u)-[r:HAS_PWRESET_ATTEMPT]->(v:ResetAttempt)
        RETURN u, r
    `;
    let params = {
        email,
    };
    let query_results = (await session.run(query, params)).records;
    const user = query_results[0].get('u')?.properties
    const has_reset_attempt = query_results[0].get('r')?.properties
    if (!user)
        throw new Error(enums.DbErrors.NOTFOUND);

    if (has_reset_attempt)
    {
        const created_at = has_reset_attempt['created_at'].toStandardDate()
        const diff_seconds = Math.floor((Date.now() - created_at) / 1000)
        if (diff_seconds < PW_RESET_COOLDOWN_SECONDS)
            throw new Error(enums.DbErrors.RATE_LIMIT)
    }

    // create pw reset request in db and return OTP
    const otp = Math.floor(100000 + Math.random() * 900000); 
    const salt = bcrypt.genSaltSync(10);
    const otp_hash = bcrypt.hashSync(`${otp}`, salt);
    query = `
        MATCH (u:User) WHERE u.email = $email
        OPTIONAL MATCH (u)-[r:HAS_PWRESET_ATTEMPT]->(v:ResetAttempt)
        DELETE v, r
        CREATE (nv:ResetAttempt { hash: $hash })
        CREATE (u)-[:HAS_PWRESET_ATTEMPT { expires_at:  datetime() + duration({seconds: $expire_secs}), created_at: datetime() }]->(nv)
        RETURN nv as data;
    `;
    params = {
        hash: otp_hash,
        email,
        expire_secs: PW_RESET_EXPIRY_SECONDS
    };
    await session.run(query, params);
    return otp
}

exports.verify_pw_reset = async function ({
    new_pw,
    otp,
    email
}) {
    let session = driver.session();
    
    // check existing pw reset attempts 
    let query = `
        OPTIONAL MATCH (u:User) WHERE u.email = $email
        OPTIONAL MATCH (u)-[r:HAS_PWRESET_ATTEMPT]->(v:ResetAttempt)
        RETURN v, r
    `;
    let params = {
        email,
    };
    let query_results = (await session.run(query, params)).records;
    const has_reset_attempt = query_results[0].get('r')?.properties
    const reset_attempt = query_results[0].get('v')?.properties

    if (!has_reset_attempt)
        throw new Error(enums.DbErrors.NOTFOUND)

    const expires_at = has_reset_attempt['expires_at'].toStandardDate()
    const diff_seconds = Math.floor((expires_at - Date.now()) / 1000)
    const otp_hashed = reset_attempt['hash']

    if (diff_seconds < 0)
        throw new Error(enums.DbErrors.EXPIRED)

    // compare hash
    if (!bcrypt.compareSync(otp, otp_hashed))
        throw new Error(enums.DbErrors.UNAUTHORIZED)

    // everything good, delete veri attempt and set user password to new password
    query = `
        MATCH (u:User) WHERE u.email = $email
        OPTIONAL MATCH (u)-[r:HAS_PWRESET_ATTEMPT]->(v:ResetAttempt)
        DELETE v, r
        SET u.password = $new_pw
        RETURN u as data;
    `;
    params = {
        email,
        new_pw
    };
    await session.run(query, params);
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