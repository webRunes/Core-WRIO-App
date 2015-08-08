FROM ubuntu:15.04
MAINTAINER denso.ffff@gmail.com

RUN apt-get update && apt-get install -y nodejs npm mc git

RUN ln -s /usr/bin/nodejs /usr/bin/node
RUN npm install -g http-server browserify gulp nodemon
RUN mkdir -p /srv/www

COPY package.json /srv/modules/package.json
RUN cd /srv/modules/ && npm install
COPY . /srv/www/

EXPOSE 5004
CMD cd /srv/www/ && rm -fr node_modules && ln -s /srv/modules/node_modules node_modules && gulp && nodemon server.js