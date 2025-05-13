var debug = require('debug')('backend:neo4j');
let neo4j = require('neo4j-driver');
let driver = neo4j.driver("bolt://0.0.0.0:7687", neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD));
const enums = require("../constants/enums")
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

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
            location_manual_lon: $location_manual_lon,
            location_manual_lat: $location_manual_lat,
            location_auto_lon: $location_auto_lon,
            location_auto_lat: $location_auto_lat,
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
            location_manual_lon: 999, // max for lon is 180 and lat is 90
            location_manual_lat: 999,
            location_auto_lon: 999,
            location_auto_lat: 999,
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
    location_manual_lon,
    location_manual_lat,
    location_auto_lon,
    location_auto_lat,
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
            location_manual_lon: $location_manual_lon,
            location_manual_lat: $location_manual_lat,
            location_auto_lon: $location_auto_lon,
            location_auto_lat: $location_auto_lat,
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
        location_manual_lon,
        location_manual_lat,
        location_auto_lon,
        location_auto_lat,
        fame_rating,
        gender
    };
    await session.run(query, params);
}

// writable fields are 
// images, sexuality, displayname, bio, enable_auto_location, tags, gender, location and coords
exports.update_user = async function ({
    id,
    images,
    sexuality,
    displayname,
    bio,
    enable_auto_location,
    location_manual,
    location_manual_lon,
    location_manual_lat,
    location_auto_lon,
    location_auto_lat,
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
            location_manual_lon: $location_manual_lon,
            location_manual_lat: $location_manual_lat,
            location_auto_lon: $location_auto_lon,
            location_auto_lat: $location_auto_lat,
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
        location_manual_lon,
        location_manual_lat,
        location_auto_lon,
        location_auto_lat,
        fame_rating:  existing_user.fame_rating,
        gender
    };
    const res = await session.run(query, params);
    delete res['password']
    return res.records[0].get('u').properties
}

exports.get_user = async function ({
    id
}) {
    let session = driver.session();
    const existing_user_q = await session.run('MATCH (u:User) WHERE u.id = $id RETURN u', { id })
    if (existing_user_q.records.length == 0)
        throw new Error(enums.DbErrors.NOTFOUND);

    const existing_user = existing_user_q.records[0].get('u').properties
    return existing_user
}

// TODO block and unblock user


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
        MATCH (viewer:User)-[r:Viewed]->(viewed:User {id: $id})
        RETURN viewer
        ORDER BY r.updated_at DESC
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
        const matched_user_q = await session.run(`
            MATCH (a:User {id: $liker}), (b:User {id: $liked})
            CREATE (a)-[:Matched { created_at: datetime() }]->(b),
                   (b)-[:Matched { created_at: datetime() }]->(a)
            RETURN b as u
        `, {
            liker: user_liker_id,
            liked: user_liked_id
        });
        const matched_user = matched_user_q.records[0].get('u').properties
        delete matched_user['password']
        return { matched: true, user: matched_user };
    }

    // create like
    const liked_user_q = await session.run(`
        MATCH (a:User {id: $liker}), (b:User {id: $liked})
        CREATE (a)-[:Liked { created_at: datetime() }]->(b)
        RETURN a as u
    `, {
        liker: user_liker_id,
        liked: user_liked_id
    });
    const liked_user = liked_user_q.records[0].get('u').properties
    delete liked_user['password']

    return { matched: false, user: liked_user };
}

exports.view_user = async function ({
    user_viewer_id,
    user_viewed_id
}) {
    let session = driver.session();
    let existing_user_q = await session.run('MATCH (u:User) WHERE u.id = $id RETURN u', { id: user_viewer_id })
    if (existing_user_q.records.length == 0)
        throw new Error(enums.DbErrors.NOTFOUND);

    existing_user_q = await session.run('MATCH (u:User) WHERE u.id = $id RETURN u', { id: user_viewed_id })
    if (existing_user_q.records.length == 0)
        throw new Error(enums.DbErrors.NOTFOUND);

    // you cannot view yourself..
    if (user_viewed_id == user_viewer_id)
        throw new Error(enums.DbErrors.UNAUTHORIZED);

    // if user_viewer had viewed user_viewed before, update the relationship updated time. Else, create a new relationship
    await session.run(`
        MERGE (a:User {id: $viewer})
        MERGE (b:User {id: $viewed})
        MERGE (a)-[r:Viewed]->(b)
        ON CREATE SET r.created_at = datetime(), r.updated_at = datetime()
        ON MATCH SET r.updated_at = datetime()
        RETURN r
    `, {
        viewer: user_viewer_id,
        viewed: user_viewed_id
    });
}

exports.unlike_user = async function ({
    user_unliker_id,
    user_unliked_id
}) {
    let session = driver.session();
    let existing_user_q = await session.run('MATCH (u:User) WHERE u.id = $id RETURN u', { id: user_unliker_id })
    if (existing_user_q.records.length == 0)
        throw new Error(enums.DbErrors.NOTFOUND);

    existing_user_q = await session.run('MATCH (u:User) WHERE u.id = $id RETURN u', { id: user_unliked_id })
    if (existing_user_q.records.length == 0)
        throw new Error(enums.DbErrors.NOTFOUND);

    // you cannot unlike yourself..
    if (user_unliked_id == user_unliker_id)
        throw new Error(enums.DbErrors.UNAUTHORIZED);

    // if the user_unliker did not like user_unliked_in the first place, throw notfound error, or just delete implicitly
    let result = await session.run(`
        MATCH (a:User {id: $unliker})-[r:Liked]->(b:User {id: $unliked})
        DELETE r
        RETURN r
    `, {
        unliker: user_unliker_id,
        unliked: user_unliked_id
    });


    if (result.records.length == 0)
        throw new Error(enums.DbErrors.NOTFOUND);

}

exports.block_user = async function({
    user_blocked_id,
    user_blocker_id,
}) {
    let session = driver.session();
    let existing_user_q = await session.run('MATCH (u:User) WHERE u.id = $id RETURN u', { id: user_blocker_id })
    if (existing_user_q.records.length == 0)
        throw new Error(enums.DbErrors.NOTFOUND);

    existing_user_q = await session.run('MATCH (u:User) WHERE u.id = $id RETURN u', { id: user_blocked_id })
    if (existing_user_q.records.length == 0)
        throw new Error(enums.DbErrors.NOTFOUND);

    // you cannot block yourself..
    if (user_blocked_id == user_blocker_id)
        throw new Error(enums.DbErrors.UNAUTHORIZED);

    // If user_blocker already blocked user_blocked, return DbErrors.EXISTS
    const blocked_check = await session.run(
        `
        MATCH (a:User {id: $user_blocker_id})-[r:Blocked]->(b:User {id: $user_blocked_id})
        RETURN r
        `,
        { user_blocker_id, user_blocked_id }
    );
    if (blocked_check.records.length > 0)
        throw new Error(enums.DbErrors.EXISTS);

    // Remove any 'Matched' relationships between the users if any
    await session.run(
        `
        MATCH (a:User {id: $user_blocker_id})-[r:Matched]-(b:User {id: $user_blocked_id})
        DELETE r
        `,
        { user_blocker_id, user_blocked_id }
    );

    // If user_blocker has 'Liked' relationship woth user_blocked, remove it
    await session.run(
        `
        MATCH (a:User {id: $user_blocker_id})-[r:Liked]->(b:User {id: $user_blocked_id})
        DELETE r
        `,
        { user_blocker_id, user_blocked_id }
    );

    // Create a 'Blocked' relationship from user_blocker to user_blocked
    await session.run(
        `
        MATCH (a:User {id: $user_blocker_id}), (b:User {id: $user_blocked_id})
        CREATE (a)-[:Blocked { created_at: datetime() }]->(b)
        `,
        { user_blocker_id, user_blocked_id }
    );
}

exports.unmatch_user = async function({
    user_unmatched_id,
    user_unmatcher_id,
}) {
    let session = driver.session();
    let existing_user_q = await session.run('MATCH (u:User) WHERE u.id = $id RETURN u', { id: user_unmatcher_id })
    if (existing_user_q.records.length == 0)
        throw new Error(enums.DbErrors.NOTFOUND);

    existing_user_q = await session.run('MATCH (u:User) WHERE u.id = $id RETURN u', { id: user_unmatched_id })
    if (existing_user_q.records.length == 0)
        throw new Error(enums.DbErrors.NOTFOUND);

    // you cannot unmatch yourself..
    if (user_unmatched_id == user_unmatcher_id)
        throw new Error(enums.DbErrors.UNAUTHORIZED);

    // If both users does not have 'Matched' relationship, throw NOTFOUND error
    const matched_check = await session.run(
        `
        MATCH (a:User {id: $user_unmatcher_id})-[r:Matched]-(b:User {id: $user_unmatched_id})
        RETURN r
        `,
        { user_unmatcher_id, user_unmatched_id }
    );
    if (matched_check.records.length === 0)
        throw new Error(enums.DbErrors.NOTFOUND);

    // Delete 'Matched' relationship for both users
    await session.run(
        `
        MATCH (a:User {id: $user_unmatcher_id})-[r:Matched]-(b:User {id: $user_unmatched_id})
        DELETE r
        `,
        { user_unmatcher_id, user_unmatched_id }
    );
}

exports.search_with_filters = async function ({
    sort_key,
    sort_dir,
    age_range,
    fame_range,
    loc_range,
    common_tag_range,
    genders,
    user_common_tags,
    user_lat,
    user_lon,
    user_id
}) {
    let session = driver.session();
    const [minAge, maxAge] = age_range;
    const [minFame, maxFame] = fame_range;
    const [minCommonTag, maxCommonTag] = common_tag_range;
    const userTagsArray = user_common_tags.split(',').map(tag => tag.trim());

    const direction = sort_dir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    // destructure loc_range
    const [min_lat, max_lat] = loc_range[0]
    const [min_lon, max_lon] = loc_range[1]

    const query = `
        MATCH (u:User)
        WHERE 
            u.birthday IS NOT NULL AND
            duration.between(date(u.birthday), date()).years >= $minAge AND
            duration.between(date(u.birthday), date()).years <= $maxAge AND
            u.fame_rating >= $minFame AND u.fame_rating <= $maxFame AND
            (
                (u.enable_auto_location = true AND u.location_auto_lat >= $min_lat AND u.location_auto_lat <= $max_lat AND u.location_auto_lon >= $min_lon AND u.location_auto_lon <= $max_lon) OR 
                (u.enable_auto_location = false AND u.location_manual_lat >= $min_lat  AND u.location_manual_lat <= $max_lat AND u.location_manual_lon >= $min_lon  AND u.location_manual_lon <= $max_lon)
            ) AND
            u.gender IN $genders AND
            size(u.images) >= 1 AND
            u.id <> $user_id

        OPTIONAL MATCH (currentUser:User {id: $user_id})-[r:Liked|Matched|Blocked]->(u)
        WHERE r IS NULL

        OPTIONAL MATCH (u)-[r:Blocked]->(currentUser:User {id: $user_id})
        WHERE r IS NULL

         WITH u,
            duration.between(date(u.birthday), date()).years AS age,
            [tag IN split(u.tags, ",") WHERE tag IN $userTags] AS commonTags,
            CASE 
                WHEN u.enable_auto_location THEN
                    sqrt(
                        ((u.location_auto_lat - $user_lat) * 111.32)^2 +
                        ((u.location_auto_lon - $user_lon) * 111.32 * cos(radians($user_lat)))^2
                    )
                ELSE
                    sqrt(
                        ((u.location_manual_lat - $user_lat) * 111.32)^2 +
                        ((u.location_manual_lon - $user_lon) * 111.32 * cos(radians($user_lat)))^2
                    )
            END AS location_diff
        WHERE size(commonTags) >= $minCommonTag AND size(commonTags) <= $maxCommonTag
        RETURN u, age, size(commonTags) AS common_tag_count, location_diff
        ORDER BY ${sort_key === 'age' ? 'age' : 'u.' + sort_key} ${direction}
        LIMIT 100
    `;

    const result = await session.run(query, {
        minAge,
        maxAge,
        minFame,
        maxFame,
        sortKey: sort_key,
        minCommonTag,
        maxCommonTag,
        genders,
        userTags: userTagsArray,
        user_lat,
        user_lon,
        min_lat,
        max_lat,
        min_lon,
        max_lon,
        user_id
    });

    const users = result.records.map(record => {
        let user_obj = record.get('u').properties
        delete user_obj['password']
        return user_obj
    });
    return users;
}

exports.check_matched = async function ({
    user1_id,
    user2_id
}) {
    let session = driver.session();

    const query = `
        MATCH (a:User)-[r:Matched]-(b:User)
        WHERE 
            a.id = $user1_id AND
            b.id = $user2_id
        RETURN r
    `;

    const result = await session.run(query, {
        user1_id,
        user2_id
    })

    if (result.records.length == 0)
        return false
    return true
}

// MATCHING module end