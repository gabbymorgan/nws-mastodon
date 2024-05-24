FROM node:18-alpine

WORKDIR /code

COPY package.json /code/package.json

COPY yarn.lock /code/yarn.lock

COPY .babelrc /code/.babelrc

RUN yarn install

COPY ./src /code/src