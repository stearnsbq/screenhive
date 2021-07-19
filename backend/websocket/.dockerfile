FROM node


WORKDIR /usr/src/app

COPY . .

RUN npm install && npm install typescript -g
RUN npm run build

EXPOSE 3000

CMD ["node", "./dist/index.js"]

