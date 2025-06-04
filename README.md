# matcha
A full stack dating app for minors (jk) with features for user discovery and quality matches

![demo](https://github.com/neosizzle/matcha/blob/main/readme_assets/matcha-demo.gif?raw=true)

[REST API documentation](https://documenter.getpostman.com/view/15157455/2sB2qi9JbB)

## Features demo
- password recovery
![demo](https://github.com/neosizzle/matcha/blob/main/readme_assets/password-recovery.png?raw=true)
- matching suggetion algorithm with filters and sorting
![demo](https://github.com/neosizzle/matcha/blob/main/readme_assets/matching.png?raw=true)
![demo](https://github.com/neosizzle/matcha/blob/main/readme_assets/matching2.png?raw=true)
- global user search
![demo](https://github.com/neosizzle/matcha/blob/main/readme_assets/search.png?raw=true)
- live notifications and notification persistence
![demo](https://github.com/neosizzle/matcha/blob/main/readme_assets/notif.png?raw=true)
- match management (unlike, unmatch, block)
![demo](https://github.com/neosizzle/matcha/blob/main/readme_assets/matches.png?raw=true)
- community user reporting
![demo](https://github.com/neosizzle/matcha/blob/main/readme_assets/report.png?raw=true)
- text chat between matched users
![demo](https://github.com/neosizzle/matcha/blob/main/readme_assets/chat.png?raw=true)
- video call between matched users
![demo](https://github.com/neosizzle/matcha/blob/main/readme_assets/call.png?raw=true)
- ai rizz

	![demo](https://github.com/neosizzle/matcha/blob/main/readme_assets/rizz.png?raw=true)
- date scheduling 
![demo](https://github.com/neosizzle/matcha/blob/main/readme_assets/date.png?raw=true)
- various profile information
![demo](https://github.com/neosizzle/matcha/blob/main/readme_assets/profile.png?raw=true)
- live interactive users map
![demo](https://github.com/neosizzle/matcha/blob/main/readme_assets/map.png?raw=true)

## Installation and requirements
### Requirements
- Docker
- nodejs v 20^

### Infra
```
cd infra
## Create a .env file with your own passwords
docker-compose up
```

### Backend
```
cd backend
## Create a .env file with your own passwords
npm i 
npm run dev
```

### Frontend
```
cd frontend
## Create a .env file with your own passwords
npm i 
npm run dev
```

### Database seeding with ~ 600 test users
```
cd backend
## Create a .env file with your own passwords
npm i 
npm run seed
```


## Tech used and design rationale
### Infrastructure rationales
- `neo4j` and `sqlite`, Are used as databases to store necassary data in the application. User relationships between one another (Likes, matches, blocks, Dates) and Session data are stored in neo4j as it is [more speed and complexity optimized for highly connected data and its flexibility](https://neo4j.com/blog/graph-database/graph-database-vs-relational-database/). Whereas Chat data and report data, which are tabular in nature is more suitabled to be stored using a relational db like sqlite. The segragation of databses also obeys the principal of least privellege, where administrators can only access the required data for moderation (chat and reports)

- `redis-cache` is used as a quick read-write cache layer to store user online statuses. It is not stored in a disk backed database due to thoe statuses will be updated frequently (every few seconds) for each connected user

- `RabbitMQ` is used as a message queue for notifications. Notifications need to be real time and persist until user acknowledgement. RabbitMQ not only abstracts the operation as if the developer is just pushing and popping from a queue, it also provides cross-stack sdks and custom acknowledgement logic, making it the most suitable tool to facilitate the requirement.

### Main frameworks
- `Svelte` and sveltekit was used as the frontend framework due to its flat learning curve and fast development speed. It is also able to handle global states without the need to install an external global state enging 

- `Expressjs`was used as the RESTAPI and WS server due to its low difficulty in extending features and flat learning curve.

### Database schema structure
![demo](https://github.com/neosizzle/matcha/blob/main/readme_assets/data_design.png?raw=true)

### Notification pool
In the frontend, a global notification pool is used to store all incoming notifications. All notifications have the following schema 
```ts
export interface MessageNotification { 
	user: string;
	contents: string
}

export interface NotificationObj {
	type: string;
	data: string | MessageNotification,
	time: number
}
```

and an array of `writable<NotificationObj[]>([])` is subscribed by inner components to react when a notification arrive. The global ws client is responsible to parse and push new notifications to the global notification pool.

Inner components may also write to this pool by removing notifications to mark them as read. 

Notifications will persist if they are received while the user is offline (not connected to ws). There is a REST API endpoint that retreived all missed notifications and another endpoint to acknowledge them later on.

### Live location
The client will use precise geolocation by the browser to retreive live location. `geoapify` api was used to do reverse geolocation. IP geolocation is also used as a fallback incase the user rejected the precise geolocation permissions. 

The user is also able to disable the option to use autolocation entirely, however the IP geolocation will still be done regardless and the last updated auto position will always be derived from the IPs geolocation. 

User autolocation in updated and stored right after rendering certain pages

### User online status
The WS server will send a heartbeat every 5 seconds and expects the clients to send a response. The timestamp of the response is used as last active time of the user and this information is updated in `redis-cache`
