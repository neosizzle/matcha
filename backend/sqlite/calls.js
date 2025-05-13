const path = require('path');
const dbPath = path.join(__dirname, 'main.db');
const database = require('better-sqlite3')(dbPath);

// why do I store chats and reports here and not in graphdb?
// for chats, creating new nodes and relationships for every chat message 
// increases complexity in sorting and filtering in a graphdb.
// 
// From business perspective, this creates data isolation as moderation
// and technical aspects of the entire system are seperated. Principle of Least privellege

const initDatabase = `
CREATE TABLE IF NOT EXISTS chats (
	from_id TEXT NOT NULL,
	to_id TEXT NOT NULL,
	contents TEXT NOT NULL,
	created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
	reporter_id TEXT NOT NULL,
	reported_id TEXT NOT NULL,
	contents TEXT NOT NULL,
	created_at INTEGER NOT NULL
);
`;

database.exec(initDatabase);

exports.get_chats_by_uid = database.prepare(`
	SELECT * FROM chats 
	WHERE (from_id = ? AND to_id = ?) 
	   OR (to_id = ? AND from_id = ?)
	ORDER BY created_at
	`
);

exports.get_latest_conversations_by_user = database.prepare(`
	WITH paired_chats AS (
	SELECT
		CASE WHEN from_id < to_id THEN from_id ELSE to_id END AS user1,
		CASE WHEN from_id < to_id THEN to_id ELSE from_id END AS user2,
		*
	FROM chats
	WHERE from_id = ? OR to_id = ?
	),
	latest_times AS (
	SELECT
		user1,
		user2,
		MAX(created_at) AS max_created_at
	FROM paired_chats
	GROUP BY user1, user2
	)
	SELECT pc.from_id, pc.to_id, pc.contents, pc.created_at
	FROM paired_chats pc
	JOIN latest_times lt
	ON pc.created_at = lt.max_created_at
	AND (
		(CASE WHEN pc.from_id < pc.to_id THEN pc.from_id ELSE pc.to_id END) = lt.user1 AND
		(CASE WHEN pc.from_id < pc.to_id THEN pc.to_id ELSE pc.from_id END) = lt.user2
	)
	ORDER BY pc.created_at DESC;
`);

exports.create_chat = database.prepare(`
	INSERT INTO chats (from_id, to_id, contents, created_at)
	VALUES (?, ?, ?, ?)
	RETURNING from_id, to_id, contents, created_at
`);

exports.delete_chat_has_id = database.prepare(`
	DELETE FROM chats 
	WHERE (from_id = ? AND to_id = ?) 
	   OR (to_id = ? AND from_id = ?)
`);

exports.create_report = database.prepare(`
	INSERT INTO reports (reporter_id, reported_id, contents, created_at)
	VALUES (?, ?, ?, ?)
	RETURNING reporter_id, reported_id, contents, created_at
`);
