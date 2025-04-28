const { WScheckJWT } = require("../middleware/authcheck");
var debug = require('debug')('backend:ws');
const neo4j_calls = require("../neo4j/calls")
const enums = require("../constants/enums")

const handle_ws = async (socket) => {
    let user = null

    debug('A user connected');
    try {
        user = await WScheckJWT(socket)
    } catch (error) {
        socket.emit('message', 'error: Unauthorized');
        return socket.disconnect()
    }
  
    socket.emit('message', user['id']);

    // like event 
    socket.on('emit_like', async (msg, ack) => {
      try {
        const body = JSON.parse(msg)
        const required_fields = ['user_id']

        if (!required_fields.every(key => key in body))
          return socket.emit('message', {'detail': `fields ${required_fields} are required`});

        const user_liked_id = body['user_id']
        const user_liker_id = user['id']
        const like_result = await neo4j_calls.like_user({user_liked_id, user_liker_id})

        // TODO: broadcast to room, with user id and based on like_result

        ack({
          data: like_result
        });

      } catch (error) {
        // any errors, send back to user
        if (error.message == enums.DbErrors.NOTFOUND)
          ack({'detail': "user not found"})
        if (error.message == enums.DbErrors.EXISTS)
          ack({'detail': "Like already exists"})
        if (error.message == enums.DbErrors.UNAUTHORIZED)
          ack({'detail': "Unable to like user"})
        debug(error)
        ack({
          detail: `${error}`
        });
      }
    });

    // Handle message from the client
    socket.on('message', async (msg) => {
      socket.emit('message', msg); // Send message back to the sender
      socket.broadcast.emit('message', msg); // Broadcast message to everyone except the sender
    });
  
    // Handle disconnect event
    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  };
  
  // Export the handler
  module.exports = handle_ws;