## FlightGlobe

FlightGlobe is an application to visualize global air traffic in a useful way.

It is a fullstack application consisting of multiple backend services and a JavaScript SPA client. 

##### Project Structure

./dataserver contains the backend components, primarily fr-collector, redis-point-persistor, and fg-server. 

./client-source is the frontend application.

##### Backend Design

The backend consists of Collector, Persistor, and Server services written in Golang and communicating via Redis Pub/Sub.

Collectors load flight position updates from one of several upstream APIs, filter bad data, transform good data into a standardized format, and publish it to Redis Pub/Sub. 

Persistors subscribe to the collector data and save it to a datastore. Persistors enforce rules like preventing duplicate position updates or too frequent position updates.

Servers accept client connections and serve both the frontend application files and the position update.  

##### Frontend Design

The frontend is a TypeScript application that utilizes MobX for reactive state, CesiumJS for the 3D globe, and React for the settings and data filtering UI. 

Flight data is stored in the FlightStore, and each Flight is represented by a Flight object that is subscribed to the relevant state in MobX. State updates will cause the Flight object to recompute and update its representation on the globe by rendering, derendering, moving, changing color, etc. 

