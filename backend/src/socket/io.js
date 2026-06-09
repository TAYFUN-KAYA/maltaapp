let ioInstance = null;

module.exports.setIo = (io) => {
  ioInstance = io;
};

module.exports.getIo = () => ioInstance;

module.exports.emitCustomTourMessage = (requestId, message) => {
  if (!ioInstance) return;
  ioInstance.to(`custom_tour:${requestId}`).emit('custom_tour_new_message', message);
};

module.exports.emitRoomMessage = (roomId, message) => {
  if (!ioInstance) return;
  ioInstance.to(`room:${roomId}`).emit('new_message', message);
};
