FROM node

WORKDIR /usr/src/app

COPY . .

RUN npm install
RUN npm run build

CMD ["node", "./dist/index.js"]