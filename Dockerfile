FROM node:14.15.5

# Create app directory
WORKDIR /usr/src/recordsbackend

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

# use dockerbasic value for manual composition
#ENV NODE_ENV dockerbasic
# use production value for composition with Docker compose or K8S
ENV NODE_ENV production

EXPOSE 3000

CMD [ "npm", "start" ]
