const { WScheckJWT } = require("../middleware/authcheck");
var debug = require('debug')('backend:ws');

const handle_ws = async (socket) => {
    let user = null

    debug('A user connected');
    try {
        user = await WScheckJWT(socket)
    } catch (error) {
        socket.emit('message', 'you die');
        return socket.disconnect()
    }
  
    socket.emit('message', user['id']);

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