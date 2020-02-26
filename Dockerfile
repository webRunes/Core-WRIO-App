FROM mhart/alpine-node:6
MAINTAINER denso.ffff@gmail.com

#RUN apk add --no-cache make gcc g++ python
RUN npm install -g yarn gulp

COPY package.json /srv/package.json
RUN cd /srv/ && yarn ; rm -fr ~/.cache
COPY . /srv/www/

EXPOSE 5004

# To handle 'not get uid/gid'
RUN npm config set unsafe-perm true

WORKDIR /srv/www
RUN gulp

CMD cd /srv/www/ && rm -fr node_modules && gulp watch --docker