FROM node:current-slim 

WORKDIR /usr/src/app

COPY package.json .
RUN npm --production install
COPY ./src ./src/
COPY ./webroot ./webroot/
COPY ./startService.sh .

EXPOSE 80

ENTRYPOINT ["./startService.sh"]
