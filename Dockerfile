FROM node:24-alpine

WORKDIR /code

COPY package.json /code/package.json

COPY yarn.lock /code/yarn.lock

COPY tsconfig.json /code/tsconfig.json

RUN yarn install

COPY ./src /code/src