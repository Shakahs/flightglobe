FROM node:10
COPY --chown=node compiled/ /home/node/app/
USER node
WORKDIR /home/node/app/
RUN npm i @deepstream/client lodash ioredis
CMD ["node","dataserver/deepstream-pusher/src/pusher.js"]

