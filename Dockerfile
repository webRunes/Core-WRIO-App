FROM ubuntu:15.04
MAINTAINER denso.ffff@gmail.com

RUN apt-get update && apt-get install -y nodejs npm mc git

RUN ln -s /usr/bin/nodejs /usr/bin/node
RUN npm install -g http-server browserify gulp nodemon
RUN mkdir -p /srv/www

COPY package.json /srv/package.json
RUN cd /srv/ && npm install
COPY . /srv/www/

EXPOSE 5004
CMD cd /srv/www/ && rm -fr node_modules && gulp watch --docker