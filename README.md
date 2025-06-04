# matcha
A full stack dating app for minors (jk) with features for user discovery and quality matches

TODO demo gif

## Features demo
- password recovery
- matching suggetion algorithm with filters and sorting
- global user search
- live notifications and notification persistence
- match management (unlike, unmatch, block)
- community user reporting
- text chat between matched users
- video call between matched users
- ai rizz
- date scheduling 
- various profile information
- live interactive users map

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
- `Svelte` and sveltekit

- Backend `Expressjs`

### Database schema structure
Add uml diag here

### Notable libraries 

### Ws schema

### Layout design

### Notification pool

### Live location

### User online status

### Frontend optimization