var debug = require('debug')('backend:neo4j');
let neo4j = require('neo4j-driver');
let driver = neo4j.driver("bolt://0.0.0.0:7687", neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD));
const enums = require("../constants/enums")
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// TODO add verified and image check when using matching module
// TODO await session.close(); after every new session (recommended)
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
            tags: $tags,
            enable_auto_location: $enable_auto_location,
            location_manual: $location_manual,
            fame_rating: $fame_rating,
            gender: $gender
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
            fame_rating: 0,
            gender: enums.GENDER.NON_BINARY,
            tags: "",
            location_manual: "",
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
    tags,
    enable_auto_location,
    location_manual,
    fame_rating,
    gender
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
            tags: $tags,
            enable_auto_location: $enable_auto_location,
            location_manual: $location_manual,
            fame_rating: $fame_rating,
            gender: $gender
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
        tags,
        enable_auto_location,
        location_manual,
        fame_rating,
        gender
    };
    await session.run(query, params);
}

// writable fields are 
// images, sexuality, displayname, bio, enable_auto_location, tags and gender
exports.update_user = async function ({
    id,
    images,
    sexuality,
    displayname,
    bio,
    enable_auto_location,
    location_manual,
    tags,
    gender,
    email,
    birthday
}) {
    let session = driver.session();
    const existing_user_q = await session.run('MATCH (u:User) WHERE u.id = $id RETURN u', { id })
    if (existing_user_q.records.length == 0)
        throw new Error(enums.DbErrors.NOTFOUND);

    const existing_user = existing_user_q.records[0].get('u').properties
    
    const existing_email = await session.run('MATCH (u:User) WHERE u.email = $email RETURN u', { email })
    if (existing_email.records.length != 0 && existing_user.email != email)
        throw new Error(enums.DbErrors.EXISTS);

    // if email is changed, need to ensure that user is not verified
    let verified = existing_user.verified
    if (existing_user.email != email)
        verified = false

     const query = `
        MATCH (u:User) WHERE u.id  = $id
        SET u = {
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
            tags: $tags,
            enable_auto_location: $enable_auto_location,
            location_manual: $location_manual,
            fame_rating: $fame_rating,
            gender: $gender
        }
        RETURN u;
    `;
    const params = {
        id,
        images,
        email,
        password: existing_user.password,
        iden_42: existing_user.iden_42,
        verified,
        sexuality,
        displayname,
        birthday,
        bio,
        tags, // yes, i am aware user may break the serialization here.
        enable_auto_location,
        location_manual,
        fame_rating:  existing_user.fame_rating,
        gender
    };
    const res = await session.run(query, params);
    delete res['password']
    return res.records[0].get('u').properties
}

// USER module end

// MATCHING module start
exports.get_likes = async function({
    id
}) {
    let session = driver.session();
    let existing_user_q = await session.run('MATCH (u:User) WHERE u.id = $id RETURN u', { id })
    if (existing_user_q.records.length == 0)
        throw new Error(enums.DbErrors.NOTFOUND);
    
    const result = await session.run(`
        MATCH (liker:User)-[:Liked]->(liked:User {id: $id})
        RETURN liker
        LIMIT 5
    `, { id });
    
    const users = result.records.map(record => {
        const user_node = record.get('liker');
        delete user_node.properties['password']
        return user_node.properties;
    });
    return users
}

exports.get_matches = async function({
    id
}) {
    let session = driver.session();
    let existing_user_q = await session.run('MATCH (u:User) WHERE u.id = $id RETURN u', { id })
    if (existing_user_q.records.length == 0)
        throw new Error(enums.DbErrors.NOTFOUND);
    
    const result = await session.run(`
        MATCH (matcher:User)-[:Matched]->(matched:User {id: $id})
        RETURN matcher
        LIMIT 5
    `, { id });
    
    const users = result.records.map(record => {
        const user_node = record.get('matcher');
        delete user_node.properties['password']
        return user_node.properties;
    });
    return users
}

exports.get_views = async function({
    id
}) {
    let session = driver.session();
    let existing_user_q = await session.run('MATCH (u:User) WHERE u.id = $id RETURN u', { id })
    if (existing_user_q.records.length == 0)
        throw new Error(enums.DbErrors.NOTFOUND);
    
    const result = await session.run(`
        MATCH (viewer:User)-[:Viewed]->(viewed:User {id: $id})
        RETURN viewer
        LIMIT 5
    `, { id });
    
    const users = result.records.map(record => {
        const user_node = record.get('viewer');
        delete user_node.properties['password']
        return user_node.properties;
    });
    return users
}

exports.like_user = async function ({
    user_liker_id,
    user_liked_id
}) {
    let session = driver.session();
    let existing_user_q = await session.run('MATCH (u:User) WHERE u.id = $id RETURN u', { id: user_liker_id })
    if (existing_user_q.records.length == 0)
        throw new Error(enums.DbErrors.NOTFOUND);

    existing_user_q = await session.run('MATCH (u:User) WHERE u.id = $id RETURN u', { id: user_liked_id })
    if (existing_user_q.records.length == 0)
        throw new Error(enums.DbErrors.NOTFOUND);

    // you cannot like yourself..
    if (user_liked_id == user_liker_id)
        throw new Error(enums.DbErrors.UNAUTHORIZED);

    // if user_liked had a 'Blocked' relationship user_liker before or vice versa, throw a DbErrors.Unauthorized
    result = await session.run(`
        MATCH (a:User {id: $liker})-[r:Blocked]-(b:User {id: $liked})
        RETURN r
    `, {
        liker: user_liker_id,
        liked: user_liked_id
    });

    if (result.records.length > 0)
        throw new Error(enums.DbErrors.UNAUTHORIZED);

    // if user_liker had liked user_liked before, throw a DbErrors.EXIST
    result = await session.run(`
        MATCH (a:User {id: $liker})-[r:Liked]->(b:User {id: $liked})
        RETURN r
    `, {
        liker: user_liker_id,
        liked: user_liked_id
    });

    if (result.records.length > 0)
        throw new Error(enums.DbErrors.EXISTS);

     // if user_liker had matched user_liked before, throw a DbErrors.EXIST
     result = await session.run(`
        MATCH (a:User {id: $liker})-[r:Matched]->(b:User {id: $liked})
        RETURN r
    `, {
        liker: user_liker_id,
        liked: user_liked_id
    });

    if (result.records.length > 0)
        throw new Error(enums.DbErrors.EXISTS);

    // if user_liked had liked user_liker before, remove the 'Liked' relationship and replace with 'Matched' relationship
    result = await session.run(`
        MATCH (a:User {id: $liked})-[r:Liked]->(b:User {id: $liker})
        RETURN r
    `, {
        liker: user_liker_id,
        liked: user_liked_id
    });

    if (result.records.length > 0) {
        // Remove existing 'Liked' relationship
        await session.run(`
            MATCH (a:User {id: $liked})-[r:Liked]->(b:User {id: $liker})
            DELETE r
        `, {
            liker: user_liker_id,
            liked: user_liked_id
        });

        // Create 'Matched' relationships both ways
        await session.run(`
            MATCH (a:User {id: $liker}), (b:User {id: $liked})
            CREATE (a)-[:Matched { created_at: datetime() }]->(b),
                   (b)-[:Matched { created_at: datetime() }]->(a)
        `, {
            liker: user_liker_id,
            liked: user_liked_id
        });

        return { matched: true };
    }

    // create like
    await session.run(`
        MATCH (a:User {id: $liker}), (b:User {id: $liked})
        CREATE (a)-[:Liked { created_at: datetime() }]->(b)
    `, {
        liker: user_liker_id,
        liked: user_liked_id
    });

    return { matched: false };
}

// MATCHING module end