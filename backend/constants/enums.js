
exports.Sexuality = Object.freeze({
	HOMOSEXUAL: 'straight',
	HETROSEXUAL: 'gay',
	BISEXUAL: 'bi'
  });
  
exports.GENDER = Object.freeze({
	MALE: 'm',
	FEMALE: 'f',
	NON_BINARY: 'nb'
});

exports.DbErrors = Object.freeze({
	EXISTS: 'DbErrors.exists',
	NOTFOUND: 'DbErrors.notfound',
	UNAUTHORIZED: 'DbErrors.unauthorized',
	EXPIRED: 'DbErrors.expired',
	RATE_LIMIT: 'DbErrors.ratelimit',
	MISC: 'DbErrors.misc',

});
