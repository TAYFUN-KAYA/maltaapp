const EVENT_IMAGES = {
  language_exchange:
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=85&auto=format&fit=crop',
  party: 'https://images.unsplash.com/photo-1514525253161-7a46e19b9a77?w=1200&q=85&auto=format&fit=crop',
  meetup: 'https://images.unsplash.com/photo-1584519331111-4d5dd0f9c410?w=1200&q=85&auto=format&fit=crop',
  cultural: 'https://images.unsplash.com/photo-1555993533-9ad1c6a7a4c4?w=1200&q=85&auto=format&fit=crop',
  default: 'https://images.unsplash.com/photo-1519046900754-79e4b14af06a?w=1200&q=85&auto=format&fit=crop',
};

function resolveEventImage(event) {
  if (!event) return EVENT_IMAGES.default;
  const raw = event.image || event.toObject?.()?.image;
  if (raw) return raw;
  return EVENT_IMAGES[event.type] || EVENT_IMAGES.default;
}

function serializeEvent(event) {
  if (!event) return event;
  const o = event.toObject ? event.toObject() : { ...event };
  o.image = resolveEventImage(o);
  return o;
}

function serializeEvents(events) {
  return events.map((e) => serializeEvent(e));
}

module.exports = { EVENT_IMAGES, resolveEventImage, serializeEvent, serializeEvents };
