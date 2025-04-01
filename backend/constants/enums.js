const { Neo4jError } = require("neo4j-driver");

exports.Sexuality = Object.freeze({
	HOMOSEXUAL: 'straight',
	HETROSEXUAL: 'gay',
	BISEXUAL: 'bi'
  });
  
exports.DbErrors = Object.freeze({
	EXISTS: 'DbErrors.exists',
	NOTFOUND: 'DbErrors.notfound',
	UNAUTHORIZED: 'DbErrors.unauthorized',
});
