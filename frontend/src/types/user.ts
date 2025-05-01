export enum Gender {
	MALE = 'm',
	FEMALE = 'f',
	NON_BINARY = 'nb',
}

export enum Sexuality {
	STRAIGHT = 'straight',
	GAY = 'gay',
	BI = 'bi',
}
  
export interface User {
	id: string;
	displayname: string;
	email: string;
	bio: string;
	birthday: Date;
	enable_auto_location: boolean;
	fame_rating: number;
	location_manual: string;
	location_manual_lon: number;
	location_manual_lat: number;
	location_auto_lon: number;
	location_auto_lat: number;
	tags: string[]
	gender: Gender;
	sexuality: Sexuality;
	verified: boolean;
	images: string[];
	iden_42: string;
}
