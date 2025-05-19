const { WScheckJWT } = require("../middleware/authcheck");
const { checkProfileWs } = require("../middleware/interactioncheck");
var debug = require('debug')('backend:ws');
const neo4j_calls = require("../neo4j/calls")
const sqlite_calls = require("../sqlite/calls")
const enums = require("../constants/enums")
const { createClient } = require('redis');
const { send_to_queue } = require("../rabbitmq/calls");
const redis_client = createClient();

const PING_FREQUENCY_MS = 5000

let uid_sockid_map = new Map();
let sockid_uid_map = new Map();

const handle_ws = async (socket, io) => {
    let user = null
    let socket_id = null

    debug('A user connected');
    try {
        user = await WScheckJWT(socket)
        delete user['password']
        socket_id = socket.id
        uid_sockid_map.set(user.id, socket_id)
        sockid_uid_map.set(socket_id, user.id)

    } catch (error) {
        socket.emit('message', 'error: Unauthorized');
        return socket.disconnect()
    }
  
    socket.emit('message', user['id']);

    // active heartbeat
    const interval = setInterval(() => {
      socket.emit('notify_ping', Date.now());
    }, PING_FREQUENCY_MS);

    // pong event
    socket.on('emit_pong', async () => {
      const curr_time = Date.now()
      
      // write to redis
      if (!redis_client.isOpen)
        await redis_client.connect()
      await redis_client.set(user.id, curr_time)
    })

    // like event 
    socket.on('emit_like', async (msg, ack) => {
      try {
        const body = JSON.parse(msg)
        const required_fields = ['user_id']

        if (!required_fields.every(key => key in body))
          return ack({'detail': `fields ${required_fields} are required`})

        await checkProfileWs(user.id)

        const user_liked_id = body['user_id']
        const user_liker_id = user['id']
        const like_result = await neo4j_calls.like_user({user_liked_id, user_liker_id})

        // send notification to other user based on like result
        const opp_socketid = uid_sockid_map.get(user_liked_id)
        if (like_result.matched && opp_socketid)
          io.to(opp_socketid).emit('notify_match', {'data': user})
        else if (opp_socketid)
          io.to(opp_socketid).emit('notify_like', {'data': user})

        // store notification if opp_socketid is not in map
        if (!opp_socketid && like_result.matched)
          send_to_queue(user_liked_id, {type: 'notify_match', 'data': user})
        else if (!opp_socketid)
          send_to_queue(user_liked_id, {type: 'notify_like', 'data': user})

        // send ack back to caller
        ack({
          data: like_result
        });

      } catch (error) {
        // any errors, send back to user
        if (error.message == enums.DbErrors.NOTFOUND)
          return ack({'detail': "user not found"})
        if (error.message == enums.DbErrors.EXISTS)
          return ack({'detail': "Like already exists"})
        if (error.message == enums.DbErrors.UNAUTHORIZED)
          return ack({'detail': "Unable to like user"})
        debug(error)
        ack({
          detail: `${error}`
        });
      }
    });

    // view event 
    socket.on('emit_view', async (msg, ack) => {
      try {
        const body = JSON.parse(msg)
        const required_fields = ['user_id']

        if (!required_fields.every(key => key in body))
          return ack({'detail': `fields ${required_fields} are required`})

        const user_viewed_id = body['user_id']
        const user_viewer_id = user['id']
        await neo4j_calls.view_user({user_viewed_id, user_viewer_id})

        // send notification to other user
        const opp_socketid = uid_sockid_map.get(user_viewed_id)
        io.to(opp_socketid).emit('notify_view', {'data': user})

        // store notif if user is not connected to ws
        if (!opp_socketid)
          send_to_queue(user_viewed_id, {type: 'notify_view', 'data': user})


        // send ack back to caller
        ack({
          data: {}
        });

      } catch (error) {
        // any errors, send back to user
        if (error.message == enums.DbErrors.NOTFOUND)
          return ack({'detail': "user not found"})
        if (error.message == enums.DbErrors.UNAUTHORIZED)
          return ack({'detail': "Unable to view user"})
        debug(error)
        ack({
          detail: `${error}`
        });
      }
    });

    // view event 
    socket.on('emit_unlike', async (msg, ack) => {
      try {
        const body = JSON.parse(msg)
        const required_fields = ['user_id']

        if (!required_fields.every(key => key in body))
          return ack({'detail': `fields ${required_fields} are required`})

        const user_unliked_id = body['user_id']
        const user_unliker_id = user['id']
        await neo4j_calls.unlike_user({user_unliked_id, user_unliker_id})

        // send notification to other user
        const opp_socketid = uid_sockid_map.get(user_unliked_id)
        io.to(opp_socketid).emit('notify_unlike', {'data': user})


        // send ack back to caller
        ack({
          data: {}
        });

      } catch (error) {
        // any errors, send back to user
        if (error.message == enums.DbErrors.NOTFOUND)
          return ack({'detail': "user not found"})
        if (error.message == enums.DbErrors.UNAUTHORIZED)
          return ack({'detail': "Unable to unlike user"})
        debug(error)
        ack({
          detail: `${error}`
        });
      }
    });

    // emit chat
    socket.on('emit_chat', async (msg, ack) => {
      try {
        const body = JSON.parse(msg)
        const required_fields = ['user_id', 'contents']

        if (!required_fields.every(key => key in body))
          return ack({'detail': `fields ${required_fields} are required`})

        const to_user_id = body['user_id']
        const contents = body['contents']
        const created_at = Date.now();
        
        // check if both of them are matched
        const is_matched = await neo4j_calls.check_matched({
          user1_id: user.id,
          user2_id: to_user_id
        })
        if (!is_matched)
          return ack({
            detail: "users not matched"
          });

        // check if there is any blocks 
        const is_blocked = await neo4j_calls.check_blocks({
          user_id1: user.id,
          user_id2: to_user_id
        })
        if (is_blocked)
          return ack({
            detail: "blocked"
          });

        const added_chat = sqlite_calls.create_chat.get(user.id, to_user_id, contents, created_at)
        const opp_socketid = uid_sockid_map.get(to_user_id)

        io.to(opp_socketid).emit('notify_chat', {'data': {
          user: user,
          contents
        }})

        // store notification if opp_socketid is not in map
        if (!opp_socketid)
          send_to_queue(to_user_id, {type: 'notify_chat', 'data': {user, contents}})

        // send ack back to caller
        ack({
          data: added_chat
        });

      } catch (error) {
        // any errors, send back to user
        if (error.message == enums.DbErrors.NOTFOUND)
          return ack({'detail': "user not found"})
        if (error.message == enums.DbErrors.UNAUTHORIZED)
          return ack({'detail': "Unable to unlike user"})
        debug(error)
        ack({
          detail: `${error}`
        });
      }
    });

    // Handle message from the client
    socket.on('message', async (msg) => {
      socket.emit('message', msg); // Send message back to the sender
      // socket.broadcast.emit('message', msg); // Broadcast message to everyone except the sender
    });
  
    // Handle disconnect event
    socket.on('disconnect', () => {
      uid_sockid_map.delete(user.id)
      sockid_uid_map.delete(socket_id)
      clearInterval(interval)
      console.log('A user disconnected');
    });
  };
  
  // Export the handler
  module.exports = handle_ws;