FROM node


RUN apk update

WORKDIR /usr/src/app

COPY . .

RUN npm install
RUN npx prisma generate
RUN npm run build

EXPOSE 8080

CMD ["node", "./dist/index.js"]