## FlightGlobe

FlightGlobe is a tool for visualizing global air traffic in a useful way.

[Demo here](https://www.flight.earth)
 
It projects near real-time flight positions with accurate latitude, longitude, and altitude over a 3D globe. Users can also view a table of flight data and filter visible flights by various parameters. FlightGlobe is meant to be an alternative to other visualization tools that project flight data over 2D maps.  

FlightGlobe consists of a web-based client to display flight positions and backend services to obtain and serve the flight position data.  

##### Backend

The backend consists of containerized Collector, Persistor, and Server services written in Golang, deployed to Kubernetes, and communicating via Redis Pub/Sub.

Collectors load flight position updates from upstream APIs, filter invalid data, transform accepted data into a standardized format, and publish it to Redis Pub/Sub. 

Persistors subscribe to the collector data, further transform it, and save it to a datastore or publish it to a Pub/Sub channel.

Servers subscribe to the persisted data and serve it to clients via WebSocket connections, in addition to serving the static files that make up the frontend application.  

##### Frontend

The frontend is a TypeScript application that utilizes MobX for reactive state, CesiumJS for the 3D globe, and React for the settings and data filtering UI. 

Flight data is stored in the FlightStore, and each Flight is represented by a Flight object that is subscribed to the relevant state in MobX. State updates will cause the Flight object to recompute and update its representation on the globe by rendering, derendering, moving, changing color, etc. 

