FROM node:14.5.0-alpine3.12
# Create app directory
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
# Bundle app source
COPY . .
CMD [ "node", "index.js" ]
